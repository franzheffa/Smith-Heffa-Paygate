// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:smith_heffa_paygate_mobile_rebuilt/main.dart';
import 'package:smith_heffa_paygate_mobile_rebuilt/auth_session.dart';

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
  int signOutCalls = 0;
  @override
  Future<void> initialize() async {}
  @override
  Future<void> signInWithGoogle() async {}
  @override
  Future<void> signOut() async { signOutCalls++; status = AuthStatus.signedOut; user = null; notifyListeners(); }
  void authenticate() { status = AuthStatus.authenticated; user = const AppUser(displayName: 'Test', email: 'test@example.invalid'); notifyListeners(); }
}

Widget testShell() => MobileShell(session: FakeAuthSession(AuthStatus.authenticated));

void main() {
  testWidgets('auth gate renders signed-out and authenticated states', (tester) async {
    final signedOut = FakeAuthSession(AuthStatus.signedOut);
    await tester.pumpWidget(PaygateApp(session: signedOut));
    expect(find.text('Connexion securisee'), findsOneWidget);
    expect(find.text('Accueil'), findsNothing);
    signedOut.authenticate();
    await tester.pump();
    expect(find.text('Accueil'), findsWidgets);
  });

  testWidgets('auth gate exposes only the safe Firebase diagnostic code', (tester) async {
    final signedOut = FakeAuthSession(AuthStatus.signedOut)
      ..message = 'Ce domaine Preview n est pas autorise pour Google Sign-In.'
      ..diagnosticCode = 'unauthorized-domain';
    await tester.pumpWidget(PaygateApp(session: signedOut));

    expect(find.text('Code de diagnostic: unauthorized-domain'), findsOneWidget);
  });

  testWidgets('logout returns auth gate to signed-out state', (tester) async {
    final session = FakeAuthSession(AuthStatus.authenticated, const AppUser(displayName: 'Test', email: 'test@example.invalid'));
    await tester.pumpWidget(PaygateApp(session: session));
    await tester.tap(find.text('Compte'));
    await tester.pump();
    await tester.tap(find.text('Deconnexion'));
    await tester.pump();
    expect(session.signOutCalls, 1);
    expect(find.text('Connexion securisee'), findsOneWidget);
  });
  testWidgets('mobile shell exposes account and legal access', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(home: testShell()));
    expect(find.text('Enterprise Payment Rail'), findsOneWidget);
    await tester.tap(find.text('Compte'));
    await tester.pump();
    expect(find.text('Privacy Policy'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Delete Account'), 240);
    expect(find.text('Delete Account'), findsWidgets);
  });

  testWidgets('footer renders at required mobile viewports', (WidgetTester tester) async {
    const viewports = [
      Size(320, 568),
      Size(360, 800),
      Size(375, 812),
      Size(390, 844),
      Size(393, 852),
      Size(412, 915),
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

  testWidgets('travel validates a safe local itinerary without provider access', (WidgetTester tester) async {
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
  });

  testWidgets('pay flow remains a local-only validation', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(home: testShell()));
    await tester.tap(find.text('Payer'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '1250');
    await tester.tap(find.text('Valider localement'));
    await tester.pump();

    expect(find.textContaining('Aucune session, charge ou debit'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('home quick actions navigate within the mobile shell', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(home: testShell()));
    await tester.tap(find.text('Rechercher un vol'));
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

  testWidgets('account legal controls remain reachable with larger text', (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(MediaQuery(
      data: const MediaQueryData(textScaler: TextScaler.linear(1.5)),
      child: MaterialApp(home: testShell()),
    ));
    await tester.tap(find.text('Compte'));
    await tester.pump();
    await tester.scrollUntilVisible(find.text('Delete Account'), 240);

    expect(find.text('Delete Account'), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}
