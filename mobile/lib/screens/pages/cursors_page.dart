import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/models/cursor_model.dart';
import '../../core/services/cursor_service.dart';
import '../../core/theme/app_colors.dart';
import 'cursor_detail_page.dart';

class CursorsPage extends StatefulWidget {
  const CursorsPage({super.key});

  @override
  State<CursorsPage> createState() => _CursorsPageState();
}

class _CursorsPageState extends State<CursorsPage> {
  List<CursorItem> _cursors = [];
  bool _isLoading = true;
  String _searchQuery = "";

  @override
  void initState() {
    super.initState();
    _fetchCursors();
  }

  Future<void> _fetchCursors() async {
    setState(() => _isLoading = true);
    final data = await CursorService.getAllCursors();
    if (!mounted) return;
    setState(() {
      _cursors = data;
      _isLoading = false;
    });
  }

  List<CursorItem> get _filteredCursors {
    if (_searchQuery.trim().isEmpty) return _cursors;
    final q = _searchQuery.toLowerCase().trim();
    return _cursors.where((c) {
      return c.name.toLowerCase().contains(q) ||
          c.location.toLowerCase().contains(q) ||
          c.phone.toLowerCase().contains(q);
    }).toList();
  }

  int get _totalReadyLoads {
    return _cursors.fold(0, (sum, c) => sum + c.readyToDeliverCount);
  }

  // ─── ADD CURSOR MODAL ───
  void _openAddCursorDialog() {
    final nameCtrl = TextEditingController();
    final locationCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (dCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            "Add New Cursor (Quarry)",
            style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel("CURSOR / QUARRY NAME *"),
                const SizedBox(height: 6),
                TextFormField(
                  controller: nameCtrl,
                  decoration: _inputDecoration("e.g. Thangam Blue Metals, ASB Blue Material"),
                ),
                const SizedBox(height: 12),
                _buildLabel("LOCATION"),
                const SizedBox(height: 6),
                TextFormField(
                  controller: locationCtrl,
                  decoration: _inputDecoration("e.g. Karur Quarry Area"),
                ),
                const SizedBox(height: 12),
                _buildLabel("CONTACT PHONE"),
                const SizedBox(height: 6),
                TextFormField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: _inputDecoration("e.g. 9442131212"),
                ),
                const SizedBox(height: 12),
                _buildLabel("NOTES (OPTIONAL)"),
                const SizedBox(height: 6),
                TextFormField(
                  controller: notesCtrl,
                  decoration: _inputDecoration("Additional quarry details"),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: Text("Cancel", style: GoogleFonts.outfit(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      final name = nameCtrl.text.trim();
                      if (name.isEmpty) return;
                      setDialogState(() => isSaving = true);

                      final res = await CursorService.createCursor(
                        name: name,
                        location: locationCtrl.text.trim(),
                        phone: phoneCtrl.text.trim(),
                        notes: notesCtrl.text.trim(),
                      );

                      if (!dCtx.mounted) return;
                      if (res['success'] == true) {
                        Navigator.pop(dCtx);
                        _showToast("Cursor created successfully!");
                        _fetchCursors();
                      } else {
                        setDialogState(() => isSaving = false);
                        _showToast(res['message']?.toString() ?? "Failed to create cursor");
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text("Create", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  void _showToast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.outfit(color: Colors.white)),
        backgroundColor: AppColors.textPrimary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Widget _buildLabel(String text) => Text(
        text,
        style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5),
      );

  InputDecoration _inputDecoration(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.outfit(fontSize: 12.5, color: AppColors.textMuted.withValues(alpha: 0.6)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          "Cursors (Quarry Loads)",
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            tooltip: "Add Cursor",
            onPressed: _openAddCursorDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: "Refresh",
            onPressed: _fetchCursors,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchCursors,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Summary cards
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      label: "TOTAL CURSORS",
                      value: "${_cursors.length}",
                      icon: Icons.layers_rounded,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      label: "READY TO DELIVER",
                      value: "$_totalReadyLoads loads",
                      icon: Icons.local_shipping_rounded,
                      color: const Color(0xFFD97706),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Search Bar
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: "Search cursors by name, location, phone...",
                    hintStyle: GoogleFonts.outfit(fontSize: 12.5, color: AppColors.textMuted),
                    prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.textMuted),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
              ),

              const SizedBox(height: 16),

              // List of Cursors
              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                )
              else if (_filteredCursors.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.layers_clear_rounded, size: 36, color: AppColors.textMuted.withValues(alpha: 0.5)),
                      const SizedBox(height: 10),
                      Text("No Cursors Found", style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(
                        _searchQuery.isNotEmpty
                            ? "Try searching for a different keyword"
                            : "Add your first quarry vendor (e.g. Thangam Blue Metals)",
                        style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textMuted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _openAddCursorDialog,
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text("Add New Cursor"),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _filteredCursors.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) {
                    final c = _filteredCursors[i];
                    return _buildCursorCard(c);
                  },
                ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openAddCursorDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text("Add Cursor", style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: Colors.white)),
      ),
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.outfit(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppColors.textMuted),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCursorCard(CursorItem c) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        type: MaterialType.transparency,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => CursorDetailPage(cursorId: c.id, cursorName: c.name),
              ),
            ).then((_) => _fetchCursors());
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row with Avatar & Name
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        c.name.isNotEmpty ? c.name.substring(0, c.name.length >= 2 ? 2 : 1).toUpperCase() : "CU",
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c.name,
                            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          ),
                          if (c.location.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 12, color: AppColors.textMuted),
                                const SizedBox(width: 2),
                                Expanded(
                                  child: Text(
                                    c.location,
                                    style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textMuted),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                  ],
                ),

                const SizedBox(height: 14),

                // Badges row
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.category_rounded, size: 12, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text(
                            "${c.productsCount} products",
                            style: GoogleFonts.outfit(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: c.readyToDeliverCount > 0 ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.local_shipping_rounded,
                            size: 12,
                            color: c.readyToDeliverCount > 0 ? const Color(0xFFD97706) : AppColors.textMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            "${c.readyToDeliverCount} ready to dispatch",
                            style: GoogleFonts.outfit(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                              color: c.readyToDeliverCount > 0 ? const Color(0xFFD97706) : AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                if (c.phone.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.phone_rounded, size: 12, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(c.phone, style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ],

                const SizedBox(height: 14),

                // Action Bar
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CursorDetailPage(cursorId: c.id, cursorName: c.name),
                            ),
                          ).then((_) => _fetchCursors());
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.border),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text("View Details →", style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
