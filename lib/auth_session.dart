import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'firebase_bootstrap.dart';
import 'auth_trace_store.dart';

enum AuthStatus { loading, signedOut, signingIn, authenticated, error }

enum RedirectRecoveryDecision {
  credential,
  restoredUser,
  pendingWithoutUser,
  idleSignedOut,
}

RedirectRecoveryDecision classifyRedirectRecovery({
  required bool redirectPending,
  required bool credentialPresent,
  required bool currentUserPresent,
}) {
  if (credentialPresent) return RedirectRecoveryDecision.credential;
  if (currentUserPresent) return RedirectRecoveryDecision.restoredUser;
  if (redirectPending) return RedirectRecoveryDecision.pendingWithoutUser;
  return RedirectRecoveryDecision.idleSignedOut;
}

class AppUser {
  const AppUser({required this.displayName, required this.email});
  final String? displayName;
  final String? email;
}

abstract class AuthSessionSource extends ChangeNotifier {
  AuthStatus get status;
  AppUser? get user;
  String? get message;
  String? get diagnosticCode;
  String? get diagnosticCategory;
  String? get diagnosticStage;
  List<String> get authTrace;
  Future<void> initialize();
  Future<void> signInWithGoogle();
  Future<void> signOut();
}

class AuthSession extends AuthSessionSource {
  AuthSession._({FirebaseRuntime? runtime, Object? bootstrapError})
    : _runtime = runtime,
      _bootstrapError = bootstrapError,
      _auth = runtime?.auth,
      provenance = runtime?.provenance;

  factory AuthSession.fromRuntime(FirebaseRuntime runtime) =>
      AuthSession._(runtime: runtime);

  factory AuthSession.bootstrapFailure(Object error) =>
      AuthSession._(bootstrapError: error);

  @override
  AuthStatus status = AuthStatus.loading;
  @override
  AppUser? user;
  @override
  String? message;
  @override
  String? diagnosticCode;
  @override
  String? diagnosticCategory;
  @override
  String? diagnosticStage;
  @override
  final List<String> authTrace = [];
  final List<StreamSubscription<User?>> _subscriptions = [];
  final FirebaseRuntime? _runtime;
  final Object? _bootstrapError;
  final FirebaseAuth? _auth;
  final FirebaseRuntimeProvenance? provenance;
  final AuthTraceStore _traceStore = AuthTraceStore();

  static String resolveWebAuthDomain(String host) =>
      FirebaseBootstrap.resolveWebAuthDomain(host);

  @override
  Future<void> initialize() async {
    try {
      final bootstrapError = _bootstrapError;
      if (bootstrapError != null) throw bootstrapError;
      final auth = _auth;
      final runtime = _runtime;
      if (auth == null ||
          runtime == null ||
          !runtime.provenance.isSingleDefaultGraph) {
        throw StateError(
          'Firebase bootstrap did not provide a single default app.',
        );
      }
      _trace(
        'APP_BOOTSTRAP_AFTER_REDIRECT '
        'pending=${_yesNo(_traceStore.redirectPending)} '
        'origin=${_traceStore.origin} '
        'apps=${runtime.provenance.appCount} '
        'app=${runtime.provenance.defaultAppName} '
        'project=${runtime.provenance.projectId} '
        'authApp=${runtime.provenance.authAppName} '
        'authDomain=${runtime.provenance.authDomain} '
        'currentUser=${_yesNo(auth.currentUser != null)}',
      );
      _attachAuthStreams(auth);
      if (kIsWeb) await _completeWebRedirect();
      if (!kIsWeb && auth.currentUser == null) status = AuthStatus.signedOut;
    } catch (error) {
      _recordError(error, stage: 'firebase-init');
    }
  }

  @override
  Future<void> signInWithGoogle() async {
    status = AuthStatus.signingIn;
    message = null;
    diagnosticCode = null;
    diagnosticCategory = null;
    diagnosticStage = null;
    notifyListeners();
    try {
      final auth = _auth;
      if (auth == null) {
        throw StateError('Firebase Auth is not initialized.');
      }
      if (kIsWeb) {
        final runtime = _runtime!;
        _trace(
          'REDIRECT_START origin=${_traceStore.origin} '
          'apps=${runtime.provenance.appCount} '
          'app=${runtime.provenance.defaultAppName} '
          'project=${runtime.provenance.projectId} '
          'authApp=${runtime.provenance.authAppName} '
          'authDomain=${runtime.provenance.authDomain} '
          'currentUser=${_yesNo(auth.currentUser != null)} '
          'timestamp=${DateTime.now().toUtc().toIso8601String()}',
        );
        _traceStore.markRedirectPending();
        await auth.signInWithRedirect(GoogleAuthProvider());
        return;
      } else {
        await GoogleSignIn.instance.initialize();
        final account = await GoogleSignIn.instance.authenticate();
        final idToken = account.authentication.idToken;
        if (idToken == null) {
          throw StateError('Google did not return an ID token.');
        }
        await auth.signInWithCredential(
          GoogleAuthProvider.credential(idToken: idToken),
        );
      }
    } catch (error) {
      _traceStore.clearRedirectPending();
      _recordError(error, stage: 'redirect-start');
    }
  }

  Future<void> _completeWebRedirect() async {
    final pending = _traceStore.redirectPending;
    _trace('GET_REDIRECT_RESULT_STARTED pending=${_yesNo(pending)}');
    try {
      final auth = _auth;
      if (auth == null) throw StateError('Firebase Auth is not initialized.');
      final credential = await auth.getRedirectResult();
      final redirectUser = credential.user;
      final currentUser = auth.currentUser;
      final decision = classifyRedirectRecovery(
        redirectPending: pending,
        credentialPresent: redirectUser != null,
        currentUserPresent: currentUser != null,
      );
      _traceStore.clearRedirectPending();

      switch (decision) {
        case RedirectRecoveryDecision.credential:
          final tokenAvailable = await _hasIdToken(redirectUser!);
          _trace(
            'GET_REDIRECT_RESULT_CREDENTIAL '
            '${_safeUserFacts(redirectUser)} '
            'idToken=${_yesNo(tokenAvailable)}',
          );
          _applyUser(redirectUser, source: 'redirect-result');
        case RedirectRecoveryDecision.restoredUser:
          final tokenAvailable = await _hasIdToken(currentUser!);
          _trace(
            'GET_REDIRECT_RESULT_NULL currentUser=YES '
            'idToken=${_yesNo(tokenAvailable)}',
          );
          _applyUser(currentUser, source: 'restored-current-user');
        case RedirectRecoveryDecision.pendingWithoutUser:
          _trace('GET_REDIRECT_RESULT_NULL currentUser=NO pending=YES');
          _recordDiagnostic(
            code: 'redirect-result-null',
            category: 'redirect-recovery',
            stage: 'redirect-result',
          );
        case RedirectRecoveryDecision.idleSignedOut:
          _trace('GET_REDIRECT_RESULT_NULL currentUser=NO pending=NO');
          status = AuthStatus.signedOut;
          notifyListeners();
      }
    } catch (error) {
      _traceStore.clearRedirectPending();
      _trace(
        'GET_REDIRECT_RESULT_EXCEPTION '
        'category=${_errorCategory(error)} code=${_errorCode(error)}',
      );
      _recordError(error, stage: 'redirect-result');
    }
  }

  void _attachAuthStreams(FirebaseAuth auth) {
    _subscriptions.add(
      auth.idTokenChanges().listen(
        (nextUser) => _applyUser(nextUser, source: 'idTokenChanges'),
        onError: (Object error) => _recordError(error, stage: 'id-token-state'),
      ),
    );
    _subscriptions.add(
      auth.authStateChanges().listen(
        (nextUser) => _trace(
          'AUTH_STATE user=${_yesNo(nextUser != null)} '
          '${_safeUserFacts(nextUser)}',
        ),
        onError: (Object error) => _recordError(error, stage: 'auth-state'),
      ),
    );
    _subscriptions.add(
      auth.userChanges().listen(
        (nextUser) => _trace(
          'USER_STATE user=${_yesNo(nextUser != null)} '
          '${_safeUserFacts(nextUser)}',
        ),
        onError: (Object error) => _recordError(error, stage: 'user-state'),
      ),
    );
  }

  void _applyUser(User? nextUser, {required String source}) {
    _trace(
      'ID_TOKEN_STATE source=$source user=${_yesNo(nextUser != null)} '
      '${_safeUserFacts(nextUser)}',
    );
    user = nextUser == null
        ? null
        : AppUser(displayName: nextUser.displayName, email: nextUser.email);
    if (nextUser == null) {
      if (diagnosticCode == null && status != AuthStatus.signingIn) {
        status = AuthStatus.signedOut;
      }
    } else {
      status = AuthStatus.authenticated;
      message = null;
      diagnosticCode = null;
      diagnosticCategory = null;
      diagnosticStage = null;
    }
    notifyListeners();
  }

  Future<bool> _hasIdToken(User user) async =>
      (await user.getIdToken())?.isNotEmpty ?? false;

  String _safeUserFacts(User? user) {
    if (user == null) return 'uid=NO email=NO providers=none';
    final providers = user.providerData
        .map((provider) => provider.providerId)
        .where((provider) => provider.isNotEmpty)
        .join(',');
    return 'uid=YES email=${_yesNo(user.email?.isNotEmpty ?? false)} '
        'providers=${providers.isEmpty ? 'none' : providers} '
        'anonymous=${_yesNo(user.isAnonymous)} '
        'emailVerified=${_yesNo(user.emailVerified)}';
  }

  String _yesNo(bool value) => value ? 'YES' : 'NO';

  void _trace(String event) {
    authTrace.add(event);
    if (authTrace.length > 18) authTrace.removeAt(0);
    debugPrint('AUTH_TRACE=$event');
    notifyListeners();
  }

  String _errorCode(Object error) => switch (error) {
    FirebaseAuthException() => error.code,
    FirebaseException() => error.code,
    _ => 'unknown',
  };

  String _errorCategory(Object error) => switch (error) {
    FirebaseAuthException() => 'FirebaseAuthException',
    FirebaseException() => 'FirebaseException',
    _ => 'non-firebase',
  };

  void _recordError(Object error, {required String stage}) {
    _recordDiagnostic(
      code: _errorCode(error),
      category: _errorCategory(error),
      stage: stage,
    );
  }

  void _recordDiagnostic({
    required String code,
    required String category,
    required String stage,
  }) {
    diagnosticCode = code;
    diagnosticCategory = category;
    diagnosticStage = stage;
    status = AuthStatus.error;
    message = safeAuthMessage(code);
    notifyListeners();
  }

  static String safeAuthMessage(String code) => switch (code) {
    'popup-closed-by-user' => 'Connexion Google annulee.',
    'unauthorized-domain' =>
      'Ce domaine Preview n est pas autorise pour Google Sign-In.',
    'operation-not-allowed' =>
      'Google Sign-In n est pas active pour ce projet.',
    'network-request-failed' => 'Connexion reseau indisponible. Reessayez.',
    'web-storage-unsupported' =>
      'Le stockage du navigateur bloque la connexion Google.',
    'invalid-api-key' => 'La configuration Firebase Web est invalide.',
    'app-not-authorized' =>
      'Cette application Web n est pas autorisee par Firebase.',
    'redirect-result-error' => 'Le retour Google n a pas pu etre traite.',
    'redirect-result-null' =>
      'Google a repondu, mais aucune session Firebase n a ete restauree.',
    'auth-listener-error' => 'La session Firebase ne peut pas etre restauree.',
    _ =>
      'Connexion Google indisponible. Reessayez ou utilisez un autre navigateur.',
  };

  @override
  Future<void> signOut() async {
    await _auth?.signOut();
    if (!kIsWeb) await GoogleSignIn.instance.disconnect();
    user = null;
    status = AuthStatus.signedOut;
    message = null;
    diagnosticCode = null;
    diagnosticCategory = null;
    diagnosticStage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    super.dispose();
  }
}
