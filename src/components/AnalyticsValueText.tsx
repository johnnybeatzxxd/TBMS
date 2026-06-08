import type { ReactNode } from "react";
import { Text, TextProps } from "react-native";

type AnalyticsValueTextProps = TextProps & {
  children: ReactNode;
  className?: string;
  minScale?: number;
};

export function AnalyticsValueText({
  children,
  className,
  minScale = 0.62,
  numberOfLines = 1,
  style,
  ...props
}: AnalyticsValueTextProps) {
  return (
    <Text
      {...props}
      className={className}
      style={[{ maxWidth: "100%" }, style]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit
      minimumFontScale={minScale}
    >
      {children}
    </Text>
  );
}
