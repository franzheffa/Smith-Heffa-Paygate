import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'firebase_options.dart';

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
  Future<void> initialize();
  Future<void> signInWithGoogle();
  Future<void> signOut();
}

class AuthSession extends AuthSessionSource {
  @override
  AuthStatus status = AuthStatus.loading;
  @override
  AppUser? user;
  @override
  String? message;
  @override
  String? diagnosticCode;
  StreamSubscription<User?>? _subscription;

  @override
  Future<void> initialize() async {
    await Firebase.initializeApp(options: kIsWeb ? firebaseWebOptions : null);
    _subscription = FirebaseAuth.instance.idTokenChanges().listen(
      (nextUser) {
        user = nextUser == null
            ? null
            : AppUser(displayName: nextUser.displayName, email: nextUser.email);
        status = nextUser == null
            ? AuthStatus.signedOut
            : AuthStatus.authenticated;
        // A signed-out event can race with a failed redirect result. Preserve that
        // diagnostic until the user explicitly retries or signs out.
        if (nextUser != null) {
          message = null;
          diagnosticCode = null;
        }
        notifyListeners();
      },
      onError: (Object error) {
        status = AuthStatus.error;
        diagnosticCode = error is FirebaseAuthException
            ? error.code
            : 'auth-listener-error';
        message = safeAuthMessage(diagnosticCode!);
        notifyListeners();
      },
    );
    if (kIsWeb) await _completeWebRedirect();
  }

  @override
  Future<void> signInWithGoogle() async {
    status = AuthStatus.signingIn;
    message = null;
    diagnosticCode = null;
    notifyListeners();
    try {
      if (kIsWeb) {
        // Redirect is Firebase's Safari-safe flow and avoids popup blocking.
        await FirebaseAuth.instance.signInWithRedirect(GoogleAuthProvider());
        return;
      } else {
        await GoogleSignIn.instance.initialize();
        final account = await GoogleSignIn.instance.authenticate();
        final idToken = account.authentication.idToken;
        if (idToken == null) {
          throw StateError('Google did not return an ID token.');
        }
        await FirebaseAuth.instance.signInWithCredential(
          GoogleAuthProvider.credential(idToken: idToken),
        );
      }
    } on FirebaseAuthException catch (error) {
      diagnosticCode = error.code;
      status = AuthStatus.error;
      message = safeAuthMessage(error.code);
      notifyListeners();
    } catch (_) {
      diagnosticCode = 'unknown';
      status = AuthStatus.error;
      message =
          'Connexion Google indisponible. Reessayez ou utilisez un autre navigateur.';
      notifyListeners();
    }
  }

  Future<void> _completeWebRedirect() async {
    try {
      await FirebaseAuth.instance.getRedirectResult();
    } on FirebaseAuthException catch (error) {
      diagnosticCode = error.code;
      status = AuthStatus.error;
      message = safeAuthMessage(error.code);
      notifyListeners();
    } catch (_) {
      diagnosticCode = 'redirect-result-error';
      status = AuthStatus.error;
      message = safeAuthMessage(diagnosticCode!);
      notifyListeners();
    }
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
    await FirebaseAuth.instance.signOut();
    if (!kIsWeb) await GoogleSignIn.instance.disconnect();
    user = null;
    status = AuthStatus.signedOut;
    message = null;
    diagnosticCode = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
