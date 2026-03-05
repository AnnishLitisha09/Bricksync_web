import 'package:flutter/material.dart';
import 'splash_screen.dart';

void main() {
  runApp(const BrickSyncApp());
}

class BrickSyncApp extends StatelessWidget {
  const BrickSyncApp({super.key}); // This makes it a real Widget!

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BrickSync',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const SplashScreen(),
    );
  }
}
