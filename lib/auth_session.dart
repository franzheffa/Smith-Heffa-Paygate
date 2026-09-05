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
  StreamSubscription<User?>? _subscription;

  @override
  Future<void> initialize() async {
    await Firebase.initializeApp(options: kIsWeb ? firebaseWebOptions : null);
    _subscription = FirebaseAuth.instance.idTokenChanges().listen((nextUser) {
      user = nextUser == null ? null : AppUser(displayName: nextUser.displayName, email: nextUser.email);
      status = nextUser == null ? AuthStatus.signedOut : AuthStatus.authenticated;
      message = null;
      notifyListeners();
    }, onError: (_) {
      status = AuthStatus.error;
      message = 'La session Firebase ne peut pas etre restauree.';
      notifyListeners();
    });
  }

  @override
  Future<void> signInWithGoogle() async {
    status = AuthStatus.signingIn;
    message = null;
    notifyListeners();
    try {
      if (kIsWeb) {
        await FirebaseAuth.instance.signInWithPopup(GoogleAuthProvider());
      } else {
        await GoogleSignIn.instance.initialize();
        final account = await GoogleSignIn.instance.authenticate();
        final idToken = account.authentication.idToken;
        if (idToken == null) throw StateError('Google did not return an ID token.');
        await FirebaseAuth.instance.signInWithCredential(GoogleAuthProvider.credential(idToken: idToken));
      }
    } catch (_) {
      status = AuthStatus.error;
      message = 'Connexion Google annulee ou indisponible.';
      notifyListeners();
    }
  }

  @override
  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    if (!kIsWeb) await GoogleSignIn.instance.disconnect();
    user = null;
    status = AuthStatus.signedOut;
    message = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
