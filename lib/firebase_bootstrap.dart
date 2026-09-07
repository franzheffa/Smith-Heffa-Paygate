import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import 'firebase_options.dart';

/// The only owner of the default Firebase application for this Flutter app.
class FirebaseBootstrap {
  FirebaseBootstrap({String? webHost}) : _webHost = webHost;

  final String? _webHost;
  Future<FirebaseRuntime>? _initializing;

  // Safari blocks the cross-origin storage bridge used by redirect auth. Keep
  // Firebase's helper iframe and handler on the current approved Hosting host.
  static const approvedSameOriginAuthHosts = {
    'smith-heffa-paygate-mobile.firebaseapp.com',
    'smith-heffa-paygate-mobile.web.app',
    'smith-heffa-paygate-mobile--flutter-mobile-rebuild-750y53hy.web.app',
  };

  static String resolveWebAuthDomain(String host) =>
      approvedSameOriginAuthHosts.contains(host)
      ? host
      : firebaseWebOptions.authDomain!;

  Future<FirebaseRuntime> initialize() => _initializing ??= _initialize();

  Future<FirebaseRuntime> _initialize() async {
    final host = _webHost ?? (kIsWeb ? Uri.base.host : '');
    final options = kIsWeb ? _webOptionsForHost(host) : null;
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

  FirebaseOptions _webOptionsForHost(String host) {
    final authDomain = resolveWebAuthDomain(host);
    if (authDomain == firebaseWebOptions.authDomain) return firebaseWebOptions;
    return FirebaseOptions(
      apiKey: firebaseWebOptions.apiKey,
      appId: firebaseWebOptions.appId,
      messagingSenderId: firebaseWebOptions.messagingSenderId,
      projectId: firebaseWebOptions.projectId,
      authDomain: authDomain,
      storageBucket: firebaseWebOptions.storageBucket,
      measurementId: firebaseWebOptions.measurementId,
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
