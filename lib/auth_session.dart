import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'firebase_bootstrap.dart';

enum AuthStatus { loading, signedOut, signingIn, authenticated, error }

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
  StreamSubscription<User?>? _subscription;
  final FirebaseRuntime? _runtime;
  final Object? _bootstrapError;
  final FirebaseAuth? _auth;
  final FirebaseRuntimeProvenance? provenance;

  static String get webAuthDomain => FirebaseBootstrap.webAuthDomain;

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
      if (kIsWeb) await _completeWebRedirect();
      _subscription = auth.idTokenChanges().listen(
        (nextUser) {
          user = nextUser == null
              ? null
              : AppUser(
                  displayName: nextUser.displayName,
                  email: nextUser.email,
                );
          status = nextUser == null
              ? AuthStatus.signedOut
              : AuthStatus.authenticated;
          // A signed-out event can race with a failed redirect result. Preserve that
          // diagnostic until the user explicitly retries or signs out.
          if (nextUser != null) {
            message = null;
            diagnosticCode = null;
            diagnosticCategory = null;
            diagnosticStage = null;
          }
          notifyListeners();
        },
        onError: (Object error) {
          _recordError(error, stage: 'auth-state');
        },
      );
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
        // Redirect is Firebase's Safari-safe flow and avoids popup blocking.
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
      _recordError(error, stage: 'redirect-start');
    }
  }

  Future<void> _completeWebRedirect() async {
    try {
      final auth = _auth;
      if (auth == null) throw StateError('Firebase Auth is not initialized.');
      await auth.getRedirectResult();
    } catch (error) {
      _recordError(error, stage: 'redirect-result');
    }
  }

  void _recordError(Object error, {required String stage}) {
    final code = switch (error) {
      FirebaseAuthException() => error.code,
      FirebaseException() => error.code,
      _ => 'unknown',
    };
    diagnosticCode = code;
    diagnosticCategory = switch (error) {
      FirebaseAuthException() => 'FirebaseAuthException',
      FirebaseException() => 'FirebaseException',
      _ => 'non-firebase',
    };
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
    _subscription?.cancel();
    super.dispose();
  }
}
