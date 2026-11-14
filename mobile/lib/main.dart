import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/services/storage_service.dart';
import 'core/services/api_client.dart';
import 'core/services/auth_service.dart';
import 'core/theme/app_theme.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize local persistent storage
  await StorageService.init();

  // Edge-to-edge system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Setup global session expired handler: automatically logs out and redirects to login
  ApiClient.onSessionExpired = (message) {
    navigatorKey.currentState?.pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => LoginScreen(sessionExpiredMessage: message),
      ),
      (route) => false,
    );
  };

  // Restore authenticated session seamlessly when opening the app
  Widget initialScreen = const LoginScreen();
  if (StorageService.hasToken()) {
    final cachedUser = StorageService.getUser();
    if (cachedUser != null) {
      initialScreen = DashboardScreen(user: cachedUser);
      // Verify session in background without blocking instant app launch
      AuthService.verifySession().catchError((_) => null);
    }
  }

  runApp(BrickSyncApp(
    initialScreen: initialScreen,
  ));
}

class BrickSyncApp extends StatelessWidget {
  final Widget initialScreen;

  const BrickSyncApp({
    super.key,
    required this.initialScreen,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'BrickSync Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: initialScreen,
    );
  }
}
