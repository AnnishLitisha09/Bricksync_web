import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

class LightBackground extends StatelessWidget {
  final Widget child;

  const LightBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Stack(
      children: [
        // Base crisp light canvas
        Container(
          width: double.infinity,
          height: double.infinity,
          color: AppColors.background,
        ),

        // Subtle soft indigo warmth at the top
        Positioned(
          top: -size.width * 0.4,
          left: -size.width * 0.2,
          child: Container(
            width: size.width * 1.4,
            height: size.width * 1.0,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.primarySoft,
                  const Color(0xFFF1F5F9),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.6, 1.0],
              ),
            ),
          ),
        ),

        // Foreground content
        SafeArea(child: child),
      ],
    );
  }
}
