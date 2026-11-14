import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

class AnimatedBackground extends StatefulWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Stack(
      children: [
        // Base dark gradient background
        Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF090D16),
                Color(0xFF0D1322),
                Color(0xFF0B0F19),
              ],
            ),
          ),
        ),

        // Animated ambient glow orbs
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final t = _controller.value;
            final offset1X = math.sin(t * 2 * math.pi) * 60;
            final offset1Y = math.cos(t * 2 * math.pi) * 80;
            final offset2X = math.cos(t * 2 * math.pi) * 70;
            final offset2Y = math.sin(t * 2 * math.pi) * 50;

            return Stack(
              children: [
                // Top-left Violet / Indigo Orb
                Positioned(
                  top: -80 + offset1Y,
                  left: -60 + offset1X,
                  child: Container(
                    width: size.width * 0.85,
                    height: size.width * 0.85,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          AppColors.primary.withOpacity(0.35),
                          AppColors.secondary.withOpacity(0.18),
                          Colors.transparent,
                        ],
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),
                ),

                // Bottom-right Cyan / Blue Orb
                Positioned(
                  bottom: -100 + offset2Y,
                  right: -80 + offset2X,
                  child: Container(
                    width: size.width * 0.9,
                    height: size.width * 0.9,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          AppColors.accent.withOpacity(0.22),
                          const Color(0xFF3B82F6).withOpacity(0.15),
                          Colors.transparent,
                        ],
                        stops: const [0.0, 0.45, 1.0],
                      ),
                    ),
                  ),
                ),

                // Center subtle Amber Brick warmth accent
                Positioned(
                  top: size.height * 0.38 - offset1Y * 0.5,
                  right: -40 + offset2X * 0.5,
                  child: Container(
                    width: size.width * 0.55,
                    height: size.width * 0.55,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          AppColors.brickAmber.withOpacity(0.16),
                          Colors.transparent,
                        ],
                        stops: const [0.0, 0.7],
                      ),
                    ),
                  ),
                ),

                // Subtle animated dot grid overlay for tech/construction vibe
                Positioned.fill(
                  child: CustomPaint(
                    painter: GridDotsPainter(
                      offset: Offset(offset1X * 0.2, offset1Y * 0.2),
                    ),
                  ),
                ),
              ],
            );
          },
        ),

        // Foreground content
        SafeArea(child: widget.child),
      ],
    );
  }
}

class GridDotsPainter extends CustomPainter {
  final Offset offset;

  GridDotsPainter({required this.offset});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.04)
      ..style = PaintingStyle.fill;

    const spacing = 32.0;
    final startX = (offset.dx % spacing) - spacing;
    final startY = (offset.dy % spacing) - spacing;

    for (double x = startX; x < size.width + spacing; x += spacing) {
      for (double y = startY; y < size.height + spacing; y += spacing) {
        canvas.drawCircle(Offset(x, y), 1.2, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant GridDotsPainter oldDelegate) {
    return oldDelegate.offset != offset;
  }
}
