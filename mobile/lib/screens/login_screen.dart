import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/models/user_model.dart';
import '../core/services/auth_service.dart';
import '../core/theme/app_colors.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/interactive_button.dart';
import '../widgets/light_background.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  final String? sessionExpiredMessage;

  const LoginScreen({
    super.key,
    this.sessionExpiredMessage,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final GlobalKey<CustomTextFieldState> _emailFieldKey = GlobalKey();
  final GlobalKey<CustomTextFieldState> _passwordFieldKey = GlobalKey();

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  final FocusNode _emailFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();

  bool _rememberMe = true;
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _backendError;

  @override
  void initState() {
    super.initState();
    if (kDebugMode) {
      _emailController.text = "maswath55@gmail.com";
      _passwordController.text = "123456";
    }
    if (widget.sessionExpiredMessage != null) {
      _backendError = widget.sessionExpiredMessage;
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  bool _validate() {
    bool isValid = true;
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (email.isEmpty) {
      _emailFieldKey.currentState?.setError("Email address is required");
      isValid = false;
    } else if (!emailRegex.hasMatch(email)) {
      _emailFieldKey.currentState?.setError("Please enter a valid business email");
      isValid = false;
    } else {
      _emailFieldKey.currentState?.setError(null);
    }

    if (password.isEmpty) {
      _passwordFieldKey.currentState?.setError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      _passwordFieldKey.currentState?.setError("Password must be at least 6 characters");
      isValid = false;
    } else {
      _passwordFieldKey.currentState?.setError(null);
    }

    return isValid;
  }

  Future<void> _handleLogin() async {
    FocusScope.of(context).unfocus();
    setState(() => _backendError = null);
    if (!_validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _isSuccess = false;
    });

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    final result = await AuthService.login(
      email: email,
      password: password,
    );

    if (!mounted) return;

    if (result.success && result.user != null) {
      setState(() {
        _isLoading = false;
        _isSuccess = true;
      });

      HapticFeedback.lightImpact();

      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;

      final UserModel authenticatedUser = result.user!;

      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 400),
          pageBuilder: (context, anim, secondaryAnim) => DashboardScreen(
            user: authenticatedUser,
          ),
          transitionsBuilder: (context, anim, secondaryAnim, child) {
            return FadeTransition(
              opacity: CurvedAnimation(parent: anim, curve: Curves.easeOut),
              child: child,
            );
          },
        ),
      );
    } else {
      setState(() {
        _isLoading = false;
        _backendError = result.errorMessage ?? "Invalid credentials. Please verify.";
      });
      HapticFeedback.heavyImpact();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: LightBackground(
        child: Center(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // BRAND HEADER
                  _buildBrandHeader(),

                  const SizedBox(height: 28),

                  // PROFESSIONAL LOGIN CARD
                  _buildLoginCard(),

                  const SizedBox(height: 24),

                  // ENTERPRISE FOOTER
                  _buildFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBrandHeader() {
    return Column(
      children: [
        // Clean Logo Icon Container
        Container(
          width: 64,
          height: 64,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.12),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Image.asset(
            'assets/images/logo.png',
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => const Icon(
              Icons.domain_rounded,
              size: 30,
              color: AppColors.primary,
            ),
          ),
        )
            .animate()
            .fadeIn(duration: 400.ms)
            .scale(begin: const Offset(0.85, 0.85), curve: Curves.easeOutBack),

        const SizedBox(height: 14),

        // Brand Name with CRM/ERP Tag
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              "Brick",
              style: GoogleFonts.outfit(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              "Sync",
              style: GoogleFonts.outfit(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.primaryBorder, width: 0.8),
              ),
              child: Text(
                "ERP",
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: -0.1, end: 0),

        const SizedBox(height: 4),

        // Company Tagline
        Text(
          "ASWATH HOLLOW BRICKS & TRANSPORT",
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: AppColors.textMuted,
          ),
        ).animate().fadeIn(delay: 180.ms, duration: 400.ms),
      ],
    );
  }

  Widget _buildLoginCard() {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Text(
            "Sign In to Your Workspace",
            style: GoogleFonts.outfit(
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Enter your enterprise credentials to access management controls.",
            style: GoogleFonts.outfit(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w400,
            ),
          ),

          // Backend Error Alert
          if (_backendError != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.errorSoft,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: AppColors.error,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _backendError!,
                      style: GoogleFonts.outfit(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 22),

          // Email Field
          CustomTextField(
            key: _emailFieldKey,
            controller: _emailController,
            focusNode: _emailFocus,
            label: "BUSINESS EMAIL",
            hint: "Enter your business email",
            prefixIcon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            onEditingComplete: () => _passwordFocus.requestFocus(),
          ),

          const SizedBox(height: 16),

          // Password Field
          CustomTextField(
            key: _passwordFieldKey,
            controller: _passwordController,
            focusNode: _passwordFocus,
            label: "PASSWORD",
            hint: "Enter your password",
            prefixIcon: Icons.lock_outline_rounded,
            isPassword: true,
            textInputAction: TextInputAction.done,
            onEditingComplete: _handleLogin,
          ),

          const SizedBox(height: 14),

          // Remember Me & Forgot Password
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () {
                  setState(() => _rememberMe = !_rememberMe);
                  HapticFeedback.selectionClick();
                },
                child: Row(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: _rememberMe ? AppColors.primary : Colors.white,
                        borderRadius: BorderRadius.circular(5),
                        border: Border.all(
                          color: _rememberMe
                              ? AppColors.primary
                              : AppColors.border,
                          width: 1.4,
                        ),
                      ),
                      child: _rememberMe
                          ? const Icon(
                              Icons.check_rounded,
                              size: 13,
                              color: Colors.white,
                            )
                          : null,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "Remember me",
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: AppColors.textPrimary,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      content: Text(
                        "Password reset instructions have been forwarded to the system admin.",
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  );
                },
                child: Text(
                  "Forgot Password?",
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 22),

          // Sign In Action Button
          InteractiveButton(
            text: "Sign In to Workspace",
            icon: Icons.arrow_forward_rounded,
            isLoading: _isLoading,
            isSuccess: _isSuccess,
            onPressed: _handleLogin,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 240.ms, duration: 400.ms).slideY(begin: 0.08, end: 0);
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.lock_rounded,
              size: 13,
              color: AppColors.success,
            ),
            const SizedBox(width: 6),
            Text(
              "256-Bit SSL Encrypted Enterprise Gateway",
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          "BrickSync Mobile • v1.0.0",
          style: GoogleFonts.outfit(
            fontSize: 10,
            color: AppColors.textMuted,
          ),
        ),
      ],
    ).animate().fadeIn(delay: 350.ms, duration: 400.ms);
  }
}
