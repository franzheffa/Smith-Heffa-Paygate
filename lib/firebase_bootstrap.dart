import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import 'firebase_options.dart';

/// The only owner of the default Firebase application for this Flutter app.
class FirebaseBootstrap {
  Future<FirebaseRuntime>? _initializing;

  // Google OAuth registers Firebase's handler domain, not each Hosting Preview.
  // Keep the configured Firebase auth domain for all Web origins.
  static String get webAuthDomain => firebaseWebOptions.authDomain!;

  Future<FirebaseRuntime> initialize() => _initializing ??= _initialize();

  Future<FirebaseRuntime> _initialize() async {
    final options = kIsWeb ? firebaseWebOptions : null;
    final app = Firebase.apps.isEmpty
        ? await Firebase.initializeApp(options: options)
        : Firebase.app();

    // `FirebaseAuth.instance` is explicitly bound to the initialized default
    // app. This avoids a second app lookup through a separate instance graph.
    final auth = FirebaseAuth.instance;
    if (auth.app.name != app.name) {
      throw StateError(
        'FirebaseAuth is not bound to the default Firebase app.',
      );
    }

    return FirebaseRuntime(
      app: app,
      auth: auth,
      provenance: FirebaseRuntimeProvenance(
        appCount: Firebase.apps.length,
        defaultAppName: app.name,
        projectId: app.options.projectId,
        authAppName: auth.app.name,
        authDomain: options?.authDomain ?? app.options.authDomain,
      ),
    );
  }
}

class FirebaseRuntime {
  const FirebaseRuntime({
    required this.app,
    required this.auth,
    required this.provenance,
  });

  final FirebaseApp app;
  final FirebaseAuth auth;
  final FirebaseRuntimeProvenance provenance;
}

/// Safe fields only. It intentionally excludes API keys and user data.
class FirebaseRuntimeProvenance {
  const FirebaseRuntimeProvenance({
    required this.appCount,
    required this.defaultAppName,
    required this.projectId,
    required this.authAppName,
    required this.authDomain,
  });

  final int appCount;
  final String defaultAppName;
  final String projectId;
  final String authAppName;
  final String? authDomain;

  bool get isSingleDefaultGraph =>
      appCount == 1 && defaultAppName == authAppName;
}
