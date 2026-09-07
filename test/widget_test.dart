// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:smith_heffa_paygate_mobile_rebuilt/main.dart';
import 'package:smith_heffa_paygate_mobile_rebuilt/auth_session.dart';
import 'package:smith_heffa_paygate_mobile_rebuilt/auth_trace_store.dart';
import 'package:smith_heffa_paygate_mobile_rebuilt/design_system.dart';
import 'package:smith_heffa_paygate_mobile_rebuilt/firebase_bootstrap.dart';
import 'package:smith_heffa_paygate_mobile_rebuilt/paygate_api.dart';

class FakeAuthSession extends AuthSessionSource {
  FakeAuthSession(this.status, [this.user]);
  @override
  AuthStatus status;
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
  int signOutCalls = 0;
  int initializeCalls = 0;
  @override
  Future<void> initialize() async {
    initializeCalls++;
  }

  @override
  Future<void> signInWithGoogle() async {}
  @override
  Future<String?> getIdToken() async => 'test-id-token';
  @override
  Future<void> signOut() async {
    signOutCalls++;
    status = AuthStatus.signedOut;
    user = null;
    notifyListeners();
  }

  void authenticate() {
    status = AuthStatus.authenticated;
    user = const AppUser(displayName: 'Test', email: 'test@example.invalid');
    notifyListeners();
  }
}

Widget testShell() =>
    MobileShell(session: FakeAuthSession(AuthStatus.authenticated));

void main() {
  testWidgets('auth gate renders signed-out and authenticated states', (
    tester,
  ) async {
    final signedOut = FakeAuthSession(AuthStatus.signedOut);
    await tester.pumpWidget(PaygateApp(session: signedOut));
    expect(find.text('Connexion securisee'), findsOneWidget);
    expect(find.text('Accueil'), findsNothing);
    signedOut.authenticate();
    await tester.pump();
    expect(find.text('Accueil'), findsWidgets);
  });

  testWidgets('preinitialized session is not initialized by the widget tree', (
    tester,
  ) async {
    final session = FakeAuthSession(AuthStatus.signedOut);
    await tester.pumpWidget(
      PaygateApp(session: session, sessionInitialized: true),
    );
    expect(session.initializeCalls, 0);
  });

  testWidgets('auth gate exposes only the safe Firebase diagnostic code', (
    tester,
  ) async {
    final signedOut = FakeAuthSession(AuthStatus.signedOut)
      ..message = 'Ce domaine Preview n est pas autorise pour Google Sign-In.'
      ..diagnosticCode = 'unauthorized-domain'
      ..diagnosticCategory = 'FirebaseAuthException'
      ..diagnosticStage = 'redirect-result'
      ..authTrace.add('AUTH_TRACE=internal-only');
    await tester.pumpWidget(PaygateApp(session: signedOut));

    expect(
      find.text('Code de diagnostic: unauthorized-domain'),
      findsOneWidget,
    );
    expect(find.text('Categorie: FirebaseAuthException'), findsOneWidget);
    expect(find.text('Etape: redirect-result'), findsOneWidget);
    expect(find.textContaining('AUTH_TRACE='), findsNothing);
  });

  test('Firebase error mapping is deterministic and token-free', () {
    expect(
      AuthSession.safeAuthMessage('unauthorized-domain'),
      contains('Preview'),
    );
    expect(
      AuthSession.safeAuthMessage('web-storage-unsupported'),
      contains('stockage'),
    );
    expect(AuthSession.safeAuthMessage('unknown'), contains('indisponible'));
  });

  test('Web authDomain uses approved same-origin Hosting hosts', () {
    expect(
      AuthSession.resolveWebAuthDomain(
        'smith-heffa-paygate-mobile--flutter-mobile-rebuild-750y53hy.web.app',
      ),
      'smith-heffa-paygate-mobile--flutter-mobile-rebuild-750y53hy.web.app',
    );
    expect(
      AuthSession.resolveWebAuthDomain('untrusted.example'),
      'smith-heffa-paygate-mobile.firebaseapp.com',
    );
  });

  test('redirect recovery classifies credential success', () {
    expect(
      classifyRedirectRecovery(
        redirectPending: true,
        credentialPresent: true,
        currentUserPresent: true,
      ),
      RedirectRecoveryDecision.credential,
    );
  });

  test('redirect recovery classifies restored persisted user', () {
    expect(
      classifyRedirectRecovery(
        redirectPending: false,
        credentialPresent: false,
        currentUserPresent: true,
      ),
      RedirectRecoveryDecision.restoredUser,
    );
  });

  test('redirect recovery exposes pending redirect with no Firebase user', () {
    expect(
      classifyRedirectRecovery(
        redirectPending: true,
        credentialPresent: false,
        currentUserPresent: false,
      ),
      RedirectRecoveryDecision.pendingWithoutUser,
    );
    expect(
      AuthSession.safeAuthMessage('redirect-result-null'),
      contains('aucune session Firebase'),
    );
  });

  test('redirect recovery keeps an ordinary initial visit signed out', () {
    expect(
      classifyRedirectRecovery(
        redirectPending: false,
        credentialPresent: false,
        currentUserPresent: false,
      ),
      RedirectRecoveryDecision.idleSignedOut,
    );
  });

  test('redirect pending marker has a deterministic lifecycle', () {
    final store = AuthTraceStore();
    store.clearRedirectPending();
    expect(store.redirectPending, isFalse);
    store.markRedirectPending();
    expect(store.redirectPending, isTrue);
    store.clearRedirectPending();
    expect(store.redirectPending, isFalse);
  });

  test('Firebase runtime provenance rejects a split app/auth graph', () {
    const valid = FirebaseRuntimeProvenance(
      appCount: 1,
      defaultAppName: '[DEFAULT]',
      projectId: 'test-project',
      authAppName: '[DEFAULT]',
      authDomain: 'preview.example',
    );
    const invalid = FirebaseRuntimeProvenance(
      appCount: 2,
      defaultAppName: '[DEFAULT]',
      projectId: 'test-project',
      authAppName: 'secondary',
      authDomain: 'preview.example',
    );

    expect(valid.isSingleDefaultGraph, isTrue);
    expect(invalid.isSingleDefaultGraph, isFalse);
  });

  test(
    'bootstrap failure blocks Firebase operations before redirect start',
    () async {
      final session = AuthSession.bootstrapFailure(
        StateError('bootstrap failed'),
      );
      await session.initialize();
      await session.signInWithGoogle();

      expect(session.status, AuthStatus.error);
      expect(session.diagnosticStage, 'redirect-start');
      expect(session.diagnosticCode, 'unknown');
    },
  );

  test('Preview provenance marker is deterministic and non-sensitive', () {
    expect(
      previewBuildMarker(channel: 'flutter-mobile-rebuild', commit: 'abc1234'),
      'Build: abc1234',
    );
    expect(previewBuildMarker(channel: 'local', commit: 'abc1234'), isEmpty);
  });

  test('design system preserves the white obsidian sun-gold contract', () {
    expect(AppColors.canvas, const Color(0xFFFFFFFF));
    expect(AppColors.ink, const Color(0xFF0A0A0B));
    expect(AppColors.surface, const Color(0xFFF9F9FB));
    expect(AppColors.gold, const Color(0xFFD4AF37));
    expect(AppColors.radiantGold, const Color(0xFFFFD700));
    expect(AppColors.deepGold, const Color(0xFF996515));
    expect(AppColors.border, const Color(0xFFE5E5EA));
  });

  testWidgets('logout returns auth gate to signed-out state', (tester) async {
    final session = FakeAuthSession(
      AuthStatus.authenticated,
      const AppUser(displayName: 'Test', email: 'test@example.invalid'),
    );
    await tester.pumpWidget(PaygateApp(session: session));
    await tester.tap(find.text('Compte'));
    await tester.pump();
    await tester.tap(find.text('Deconnexion'));
    await tester.pump();
    expect(session.signOutCalls, 1);
    expect(find.text('Connexion securisee'), findsOneWidget);
  });
  testWidgets('mobile shell exposes account and legal access', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(MaterialApp(home: testShell()));
    expect(find.text('Enterprise Payment Rail'), findsOneWidget);
    await tester.tap(find.text('Compte'));
    await tester.pump();
    expect(find.text('Privacy Policy'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Delete Account').first, 240);
    expect(find.text('Delete Account'), findsWidgets);
  });

  testWidgets('footer renders at required mobile viewports', (
    WidgetTester tester,
  ) async {
    const viewports = [
      Size(320, 568),
      Size(360, 640),
      Size(375, 667),
      Size(390, 844),
      Size(393, 852),
      Size(414, 896),
      Size(430, 932),
    ];
    addTearDown(() => tester.binding.setSurfaceSize(null));

    for (final viewport in viewports) {
      await tester.binding.setSurfaceSize(viewport);
      await tester.pumpWidget(MaterialApp(home: testShell()));
      await tester.pump();
      await tester.scrollUntilVisible(find.text('Legal et Support'), 240);
      await tester.pump();
      expect(tester.takeException(), isNull, reason: 'Viewport $viewport');
      expect(find.text('Legal et Support'), findsOneWidget);
      expect(find.text('Privacy'), findsOneWidget);
      expect(find.text('Delete Account'), findsOneWidget);
    }
  });

  testWidgets(
    'travel validates a safe local itinerary without provider access',
    (WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 1200));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      await tester.pumpWidget(MaterialApp(home: testShell()));
      await tester.tap(find.text('Voyage'));
      await tester.pumpAndSettle();

      await tester.enterText(find.widgetWithText(TextField, 'Depart'), 'DLA');
      await tester.enterText(find.widgetWithText(TextField, 'Arrivee'), 'DLA');
      await tester.tap(find.text('Rechercher les offres'));
      await tester.pump();

      expect(find.textContaining('ERROR:'), findsOneWidget);
      expect(find.textContaining('Aucun ordre'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('pay flow remains a local-only validation', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(MaterialApp(home: testShell()));
    await tester.tap(find.text('Payer'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '1250');
    await tester.tap(find.text('Vérifier la demande'));
    await tester.pump();

    expect(
      find.textContaining('Aucune session, charge ou debit'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('home quick actions navigate within the mobile shell', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(MaterialApp(home: testShell()));
    final flightAction = find.text('Rechercher un vol').first;
    await tester.ensureVisible(flightAction);
    await tester.pump();
    await tester.tap(flightAction);
    await tester.pumpAndSettle();

    expect(find.text('Rechercher un vol'), findsOneWidget);
    expect(find.text('Duffel en lecture seule'), findsOneWidget);
  });

  test('delete account uses the canonical navigation target', () {
    expect(
      LegalTile.canonicalUrl('/account/delete').toString(),
      'https://smith-heffa-paygate.ca/account/delete',
    );
  });

  test(
    'protected checkout sends Firebase Bearer and idempotency headers',
    () async {
      late http.Request captured;
      final api = PaygateApi(
        baseUri: Uri.parse('https://api.example.invalid'),
        tokenProvider: () async => 'opaque-test-token',
        client: MockClient((request) async {
          captured = request;
          return http.Response(
            '{"checkoutId":"c1","amount":"117.43","currency":"USD","rail":"Stripe"}',
            200,
          );
        }),
      );

      await api.prepareCheckout(offerId: 'offer-1', preferredRail: 'Stripe');

      expect(captured.headers['Authorization'], 'Bearer opaque-test-token');
      expect(captured.headers['Idempotency-Key'], startsWith('flutter:'));
      expect(captured.body, contains('offer-1'));
    },
  );

  test('protected checkout refuses a missing Firebase token', () async {
    final api = PaygateApi(
      baseUri: Uri.parse('https://api.example.invalid'),
      tokenProvider: () async => null,
      client: MockClient((_) async => http.Response('{}', 500)),
    );

    await expectLater(
      () => api.prepareCheckout(offerId: 'offer-1', preferredRail: 'Stripe'),
      throwsA(
        isA<PaygateApiException>().having(
          (error) => error.code,
          'code',
          'AUTH_REQUIRED',
        ),
      ),
    );
  });

  testWidgets('account legal controls remain reachable with larger text', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(2)),
        child: MaterialApp(home: testShell()),
      ),
    );
    await tester.tap(find.text('Compte'));
    await tester.pump();
    await tester.scrollUntilVisible(find.text('Delete Account').first, 240);

    expect(find.text('Delete Account'), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}
