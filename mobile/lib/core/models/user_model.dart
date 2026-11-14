class UserModel {
  final int? userid;
  final String name;
  final String email;
  final String? phoneNumber;
  final int userRole;
  final String? staffRole;

  UserModel({
    this.userid,
    required this.name,
    required this.email,
    this.phoneNumber,
    required this.userRole,
    this.staffRole,
  });

  String get roleDisplayName {
    if (userRole == 1) return "Administrator";
    if (userRole == 2) return "Operations Manager";
    if (staffRole != null && staffRole!.trim().isNotEmpty) {
      return staffRole!.trim();
    }
    return "Staff & Operations";
  }

  bool get isAdmin => userRole == 1;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userid: json['userid'] as int?,
      name: (json['name'] ?? json['email']?.toString().split('@').first ?? 'User').toString(),
      email: (json['email'] ?? '').toString(),
      phoneNumber: json['phoneNumber']?.toString(),
      userRole: (json['userRole'] ?? json['role'] ?? 3) as int,
      staffRole: json['staffRole']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userid': userid,
      'name': name,
      'email': email,
      'phoneNumber': phoneNumber,
      'userRole': userRole,
      'staffRole': staffRole,
    };
  }
}
