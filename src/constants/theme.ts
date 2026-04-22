export const COLORS = {
  // Primary - Blue
  primary: "#2563EB",
  primary50: "#EFF6FF",
  primary100: "#DBEAFE",
  primary200: "#BFDBFE",
  primary300: "#93C5FD",
  primary400: "#60A5FA",
  primary500: "#2563EB",
  primary600: "#1D4ED8",
  primary700: "#1E40AF",
  primary800: "#1E3A8A",
  primary900: "#172554",

  // Secondary - Orange
  secondary: "#F97316",
  secondary50: "#FFF7ED",
  secondary500: "#F97316",
  secondary600: "#EA580C",

  // Semantic
  success: "#16A34A",
  warning: "#EAB308",
  danger: "#DC2626",
  info: "#0EA5E9",

  // Backgrounds
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceHover: "#F1F5F9",

  // Text
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Borders
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // White
  white: "#FFFFFF",
} as const;

export const FONTS = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semiBold: "Inter-SemiBold",
  bold: "Inter-Bold",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const TRUCK_STATUS_COLORS: Record<string, string> = {
  active: "#16A34A",
  maintenance: "#EAB308",
  idle: "#64748B",
  retired: "#DC2626",
} as const;

export const TRIP_STATUS_COLORS: Record<string, string> = {
  scheduled: "#2563EB",
  "in-progress": "#F97316",
  completed: "#16A34A",
  cancelled: "#DC2626",
} as const;

export const DRIVER_STATUS_COLORS: Record<string, string> = {
  available: "#16A34A",
  "on-trip": "#F97316",
  "off-duty": "#64748B",
  suspended: "#DC2626",
} as const;
