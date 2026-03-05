import 'package:flutter/material.dart';
import 'dart:async';
import 'login_page.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // For the Animated Gradient
  List<Color> colorList = [
    const Color(0xFF0D47A1), // Deep Blue
    const Color(0xFF1976D2), // Mid Blue
    const Color(0xFF002171), // Very Dark Blue
    const Color(0xFF1565C0), // Royal Blue
  ];
  int index = 0;
  Color bottomColor = const Color(0xFF0D47A1);
  Color topColor = const Color(0xFF1976D2);
  Alignment begin = Alignment.bottomLeft;
  Alignment end = Alignment.topRight;

  @override
  void initState() {
    super.initState();

    // 1. Background Gradient Animation Trigger
    Timer(const Duration(milliseconds: 10), () {
      setState(() {
        bottomColor = const Color(0xFF002171);
      });
    });

    // 2. Fade In/Out Animation for Content
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );

    _fadeAnimation =
        TweenSequence([
          TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 40),
          TweenSequenceItem(
            tween: Tween(begin: 1.0, end: 1.0),
            weight: 20,
          ), // Stay visible
          TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 40),
        ]).animate(
          CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
        );

    _fadeController.forward();

    // 3. Navigation
    _fadeController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const LoginPage()),
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // STEP 1: Animated Gradient Background
          AnimatedContainer(
            duration: const Duration(seconds: 3),
            onEnd: () {
              setState(() {
                index = index + 1;
                bottomColor = colorList[index % colorList.length];
                topColor = colorList[(index + 1) % colorList.length];
              });
            },
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: begin,
                end: end,
                colors: [bottomColor, topColor],
              ),
            ),
          ),

          // STEP 2: Corner Designs (Professional Decorative Bricks)
          Positioned(top: -50, left: -50, child: _buildCornerDecor()),
          Positioned(bottom: -50, right: -50, child: _buildCornerDecor()),

          // STEP 3: Main Content
          Center(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'BrickSync',
                    style: TextStyle(
                      fontSize: 52,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 4,
                      color: Colors.white,
                      shadows: [
                        Shadow(
                          blurRadius: 10,
                          color: Colors.black26,
                          offset: Offset(2, 2),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                  // Sleek Linear Progress instead of Circular for a modern feel
                  SizedBox(
                    width: 150,
                    child: LinearProgressIndicator(
                      backgroundColor: Colors.white24,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Helper widget for corner design
  Widget _buildCornerDecor() {
    return RotationTransition(
      turns: const AlwaysStoppedAnimation(45 / 360),
      child: Container(
        height: 200,
        width: 200,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white10, width: 2),
        ),
      ),
    );
  }
}
