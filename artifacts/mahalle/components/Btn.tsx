import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "lg" | "md" | "sm";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Btn({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  disabled,
  loading,
  style,
  icon,
}: Props) {
  const c = useColors();

  const bg =
    variant === "primary"
      ? c.primary
      : variant === "danger"
      ? c.destructive
      : variant === "ghost"
      ? "transparent"
      : c.secondary;
  const fg =
    variant === "primary"
      ? c.primaryForeground
      : variant === "danger"
      ? c.destructiveForeground
      : c.foreground;
  const border = variant === "ghost" ? c.border : "transparent";

  const padV = size === "lg" ? 16 : size === "md" ? 12 : 8;
  const fontSize = size === "lg" ? 17 : size === "md" ? 15 : 13;

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          paddingVertical: padV,
          borderRadius: c.radius,
          borderWidth: variant === "ghost" ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={{
              color: fg,
              fontSize,
              fontFamily: "Inter_600SemiBold",
              letterSpacing: 0.2,
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
