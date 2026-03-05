import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'splash_screen.dart';
import 'dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  runApp(
    BrickSyncApp(
      initialRoute: token != null && token.isNotEmpty ? 'dashboard' : 'login',
    ),
  );
}

class BrickSyncApp extends StatelessWidget {
  final String initialRoute;
  const BrickSyncApp({super.key, this.initialRoute = 'login'});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BrickSync',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Roboto',
      ),
      home: initialRoute == 'dashboard'
          ? const Dashboard()
          : const SplashScreen(),
    );
  }
}
