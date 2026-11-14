# BrickSync Mobile Enterprise App

Modern, attractive, and smoothly animated Flutter application for **BrickSync** (Aswath Hollow Bricks & Transport / CRM & ERP).

---

## ✨ Features & Visual Highlights

- **Dynamic Ambient Atmosphere**:
  - Smooth floating glowing orbs (Radial Gradients in Indigo, Violet, Cyan, and warm Amber Brick accents) rendered with 60 FPS `AnimationController`.
  - Subtle interactive tech dot matrix background.
- **Brand Identity & Pulse**:
  - Glowing animated logo with smooth breathing scale & illumination pulse.
  - Distinctive typography using Google Fonts (Outfit).
  - Enterprise status badges with glass borders.
- **Animated Role Selector**:
  - Seamless animated switcher between **Admin Portal** and **Logistics & Staff**.
  - One-tap credential auto-fill for testing and demo flows.
- **Glassmorphism & Micro-Interactions**:
  - Frosted glass cards with background blur and gradient borders.
  - Interactive input fields with focus glow animations, animated prefix icons, clear buttons, and animated password reveal.
  - Dynamic error shake animation on invalid submission.
  - Animated custom "Remember Me" toggle.
- **Interactive Action Button & Biometrics**:
  - Gradient button with continuous shimmer light sweep effect.
  - Tap bounce & scale micro-interaction.
  - Morphing loading state ("Authenticating...") and success checkmark.
  - Dedicated Biometric authentication button (Face ID / Fingerprint simulation).
- **Post-Login Experience**:
  - Transitions to a sleek **Dashboard Screen** showcasing daily metrics (Stock in pieces, Dispatches, Revenue, Pending Orders) and quick ERP actions.

---

## 📁 Project Architecture

```
mobile/
├── assets/
│   └── images/
│       └── logo.png              # Authentic BrickSync brand logo
├── lib/
│   ├── main.dart                 # Application entry point & theme
│   ├── core/
│   │   └── theme/
│   │       ├── app_colors.dart   # Brand palette & gradients
│   │       └── app_theme.dart    # Dark theme styling & typography
│   ├── widgets/
│   │   ├── animated_background.dart # Ambient floating glowing orbs
│   │   ├── glass_card.dart          # Frosted glass card with blur
│   │   ├── custom_text_field.dart   # Animated focus & error shake
│   │   └── interactive_button.dart  # Shimmer & loading button
│   └── screens/
│       ├── login_screen.dart     # Beautiful animated login screen
│       └── dashboard_screen.dart # Post-login overview & metrics
└── test/
    └── widget_test.dart          # Component test suite
```

---

## 🚀 How to Run

1. Navigate to the mobile project folder:
   ```bash
   cd mobile
   ```

2. Get dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app on an Android emulator, iOS simulator, or macOS desktop:
   ```bash
   flutter run
   ```

4. Or build the debug APK:
   ```bash
   flutter build apk --debug
   ```
