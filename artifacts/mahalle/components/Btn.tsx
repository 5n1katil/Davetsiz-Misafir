import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { haptic } from "@/lib/haptics";
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
  pulse?: boolean;
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
  pulse,
}: Props) {
  const c = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bg =
    variant === "primary"
      ? c.primary
      : variant === "danger"
      ? c.destructive
      : "transparent";

  const fg =
    variant === "primary"
      ? c.primaryForeground
      : variant === "danger"
      ? c.destructiveForeground
      : c.foreground;

  const borderColor =
    variant === "primary"
      ? "transparent"
      : variant === "danger"
      ? c.destructive
      : c.border;

  const padV = size === "lg" ? 16 : size === "md" ? 13 : 9;
  const minH = size === "lg" ? 52 : size === "md" ? 44 : 34;
  const fontSize = size === "lg" ? 16 : size === "md" ? 14 : 13;

  function handlePress() {
    if (disabled || loading) return;
    haptic(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], ...(style as any) }}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: bg,
            borderColor,
            borderWidth: variant === "primary" ? 0 : 1,
            opacity: disabled ? 0.38 : pressed ? 0.82 : 1,
            paddingVertical: padV,
            minHeight: minH,
            borderRadius: c.radius,
          },
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
                fontFamily: "Inter_700Bold",
                letterSpacing: variant === "primary" ? 1 : 0.3,
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
