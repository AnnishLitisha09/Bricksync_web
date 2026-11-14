import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_colors.dart';
import 'package:mobile/core/models/user_model.dart';

void main() {
  test('UserModel parses role and displays correct label', () {
    final admin = UserModel.fromJson({
      'name': 'Aswath',
      'email': 'admin@aswathbricks.com',
      'userRole': 1,
    });
    expect(admin.isAdmin, true);
    expect(admin.roleDisplayName, 'Administrator');

    final driver = UserModel.fromJson({
      'name': 'Murugan',
      'email': 'driver@aswathbricks.com',
      'userRole': 3,
      'staffRole': 'Heavy Vehicle Driver',
    });
    expect(driver.isAdmin, false);
    expect(driver.roleDisplayName, 'Heavy Vehicle Driver');
  });

  test('AppColors light theme constants are defined', () {
    expect(AppColors.background, const Color(0xFFF8FAFC));
    expect(AppColors.primary, const Color(0xFF4F46E5));
    expect(AppColors.surface, const Color(0xFFFFFFFF));
  });
}
