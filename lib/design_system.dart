import 'package:flutter/material.dart';

abstract final class AppColors {
  static const canvas = Color(0xFFFFFFFF);
  static const ink = Color(0xFF0A0A0B);
  static const surface = Color(0xFFF9F9FB);
  static const gold = Color(0xFFD4AF37);
  static const radiantGold = Color(0xFFFFD700);
  static const deepGold = Color(0xFF996515);
  static const border = Color(0xFFE5E5EA);
  static const text = Color(0xFF0A0A0B);
  static const textMuted = Color(0xFF66666E);
  static const disabled = Color(0xFFA8A8AE);
  static const success = Color(0xFF067647);
  static const warning = Color(0xFF8A5D00);
  static const error = Color(0xFFB42318);
  static const info = Color(0xFF175CD3);
}

abstract final class AppSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;
  static const xxxl = 40.0;
  static const huge = 48.0;
  static const hero = 64.0;
}

abstract final class AppRadius {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const pill = 999.0;
}

abstract final class AppMotion {
  static const press = Duration(milliseconds: 140);
  static const selection = Duration(milliseconds: 190);
  static const card = Duration(milliseconds: 220);
  static const screen = Duration(milliseconds: 240);
}

abstract final class AppElevation {
  static const none = 0.0;
  static const raised = 2.0;
  static const overlay = 12.0;
  static const subtleShadow = [
    BoxShadow(color: Color(0x100A0A0B), blurRadius: 18, offset: Offset(0, 6)),
  ];
}

abstract final class AppBorders {
  static const neutral = BorderSide(color: AppColors.border);
  static const gold = BorderSide(color: AppColors.gold);
}

abstract final class AppSurfaces {
  static const ceramic = AppColors.canvas;
  static const secondary = AppColors.surface;
  static const obsidian = AppColors.ink;
}

abstract final class AppStatusColors {
  static const success = AppColors.success;
  static const warning = AppColors.warning;
  static const error = AppColors.error;
  static const info = AppColors.info;
  static const inactive = AppColors.textMuted;
}

abstract final class AppTypography {
  static const fallbacks = <String>[
    '-apple-system',
    'BlinkMacSystemFont',
    'Inter',
    'Roboto',
    'sans-serif',
  ];

  static const display = TextStyle(
    color: AppColors.text,
    fontSize: 32,
    height: 1.12,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.7,
    fontFamilyFallback: fallbacks,
  );
  static const titleLarge = TextStyle(
    color: AppColors.text,
    fontSize: 24,
    height: 1.2,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.35,
    fontFamilyFallback: fallbacks,
  );
  static const title = TextStyle(
    color: AppColors.text,
    fontSize: 18,
    height: 1.25,
    fontWeight: FontWeight.w700,
    fontFamilyFallback: fallbacks,
  );
  static const section = TextStyle(
    color: AppColors.text,
    fontSize: 16,
    height: 1.3,
    fontWeight: FontWeight.w800,
    letterSpacing: 0.1,
    fontFamilyFallback: fallbacks,
  );
  static const body = TextStyle(
    color: AppColors.text,
    fontSize: 15,
    height: 1.45,
    fontWeight: FontWeight.w400,
    fontFamilyFallback: fallbacks,
  );
  static const bodyMuted = TextStyle(
    color: AppColors.textMuted,
    fontSize: 14,
    height: 1.45,
    fontWeight: FontWeight.w400,
    fontFamilyFallback: fallbacks,
  );
  static const label = TextStyle(
    color: AppColors.text,
    fontSize: 13,
    height: 1.25,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.15,
    fontFamilyFallback: fallbacks,
  );
  static const caption = TextStyle(
    color: AppColors.textMuted,
    fontSize: 12,
    height: 1.35,
    fontWeight: FontWeight.w500,
    fontFamilyFallback: fallbacks,
  );
  static const amount = TextStyle(
    color: AppColors.text,
    fontSize: 28,
    height: 1.1,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.5,
    fontFamilyFallback: fallbacks,
    fontFeatures: [FontFeature.tabularFigures()],
  );
}

abstract final class AppTheme {
  static ThemeData get light {
    const scheme = ColorScheme.light(
      primary: AppColors.gold,
      onPrimary: AppColors.ink,
      secondary: AppColors.deepGold,
      onSecondary: AppColors.canvas,
      surface: AppColors.canvas,
      onSurface: AppColors.ink,
      error: AppColors.error,
      onError: AppColors.canvas,
      outline: AppColors.border,
    );
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.canvas,
      canvasColor: AppColors.canvas,
      fontFamilyFallback: AppTypography.fallbacks,
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(
        bodyColor: AppColors.text,
        displayColor: AppColors.text,
      ),
      cardTheme: const CardThemeData(
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: AppElevation.none,
        margin: EdgeInsets.symmetric(vertical: AppSpacing.xs),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.lg)),
          side: AppBorders.neutral,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.ink,
        foregroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: AppElevation.none,
        centerTitle: false,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.canvas,
        surfaceTintColor: Colors.transparent,
        elevation: AppElevation.raised,
        indicatorColor: AppColors.gold.withValues(alpha: 0.18),
        height: 72,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => AppTypography.caption.copyWith(
            color: states.contains(WidgetState.selected)
                ? AppColors.ink
                : AppColors.textMuted,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w800
                : FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: AppColors.canvas,
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
          borderSide: AppBorders.neutral,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
          borderSide: AppBorders.neutral,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
          borderSide: BorderSide(color: AppColors.deepGold, width: 1.5),
        ),
        labelStyle: AppTypography.bodyMuted,
        hintStyle: AppTypography.bodyMuted,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: AppColors.ink,
          disabledBackgroundColor: AppColors.border,
          disabledForegroundColor: AppColors.disabled,
          minimumSize: const Size(48, 50),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          textStyle: AppTypography.label,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.ink,
          minimumSize: const Size(48, 48),
          side: AppBorders.neutral,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(AppRadius.md)),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.border),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.gold,
        linearTrackColor: AppColors.border,
      ),
    );
  }
}

class PremiumCard extends StatelessWidget {
  const PremiumCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.md),
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Container(
    decoration: const BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.all(Radius.circular(AppRadius.lg)),
      border: Border.fromBorderSide(AppBorders.neutral),
    ),
    clipBehavior: Clip.antiAlias,
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    ),
  );
}

class ObsidianCard extends StatelessWidget {
  const ObsidianCard({super.key, required this.child, this.padding});
  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding ?? const EdgeInsets.all(AppSpacing.xl),
    decoration: BoxDecoration(
      color: AppColors.ink,
      borderRadius: const BorderRadius.all(Radius.circular(AppRadius.xl)),
      border: Border.all(color: AppColors.gold.withValues(alpha: 0.7)),
      boxShadow: AppElevation.subtleShadow,
    ),
    child: child,
  );
}

class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });
  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Semantics(
    label: label,
    child: Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: const BorderRadius.all(Radius.circular(AppRadius.pill)),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: color),
            const SizedBox(width: AppSpacing.xs),
          ],
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption.copyWith(
                color: color,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.caption});
  final String title;
  final String? caption;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: AppSpacing.xxl, bottom: AppSpacing.sm),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTypography.section),
        if (caption != null) ...[
          const SizedBox(height: AppSpacing.xxs),
          Text(caption!, style: AppTypography.bodyMuted),
        ],
      ],
    ),
  );
}
