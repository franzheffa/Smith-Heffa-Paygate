// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:smith_heffa_paygate_mobile_rebuilt/main.dart';

void main() {
  testWidgets('mobile shell exposes account and legal access', (WidgetTester tester) async {
    await tester.pumpWidget(const PaygateApp());
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
      await tester.pumpWidget(const PaygateApp());
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
    await tester.pumpWidget(const PaygateApp());
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
    await tester.pumpWidget(const PaygateApp());
    await tester.tap(find.text('Payer'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '1250');
    await tester.tap(find.text('Valider localement'));
    await tester.pump();

    expect(find.textContaining('Aucune session, charge ou debit'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('home quick actions navigate within the mobile shell', (WidgetTester tester) async {
    await tester.pumpWidget(const PaygateApp());
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
    await tester.pumpWidget(const MediaQuery(
      data: MediaQueryData(textScaler: TextScaler.linear(1.5)),
      child: PaygateApp(),
    ));
    await tester.tap(find.text('Compte'));
    await tester.pump();
    await tester.scrollUntilVisible(find.text('Delete Account'), 240);

    expect(find.text('Delete Account'), findsWidgets);
    expect(tester.takeException(), isNull);
  });
}
