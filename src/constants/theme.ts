export const COLORS = {
  primary: "#1A56DB",
  primaryLight: "#EBF2FF",
  secondary: "#F97316",
  success: "#16A34A",
  warning: "#CA8A04",
  danger: "#DC2626",
  dark: "#0F172A",
  dark100: "#1E293B",
  dark200: "#334155",
  dark300: "#475569",
  surface: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
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
  maintenance: "#CA8A04",
  idle: "#475569",
  retired: "#DC2626",
} as const;

export const TRIP_STATUS_COLORS: Record<string, string> = {
  scheduled: "#1A56DB",
  "in-progress": "#F97316",
  completed: "#16A34A",
  cancelled: "#DC2626",
} as const;

export const DRIVER_STATUS_COLORS: Record<string, string> = {
  available: "#16A34A",
  "on-trip": "#F97316",
  "off-duty": "#475569",
  suspended: "#DC2626",
} as const;
