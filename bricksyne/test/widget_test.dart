import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bricksyne/main.dart'; // Ensure 'bricksyne' matches your actual folder name

void main() {
  testWidgets('BrickSync splash screen smoke test', (
    WidgetTester tester,
  ) async {
    // 1. Build our app and trigger a frame.
    await tester.pumpWidget(const BrickSyncApp());

    // 2. Verify that the Splash Screen text "BrickSync" is present.
    expect(find.text('BrickSync'), findsOneWidget);

    // 3. Optional: Wait for the fade animation and navigation to finish
    // This prevents the "Bad state" errors by letting the timers finish.
    await tester.pumpAndSettle(const Duration(seconds: 5));
  });
}
