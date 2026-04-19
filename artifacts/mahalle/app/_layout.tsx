import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts as useInterFonts } from "@expo-google-fonts/inter";
import {
  Cinzel_700Bold,
  Cinzel_900Black,
} from "@expo-google-fonts/cinzel";
import { useFonts as useCinzelFonts } from "@expo-google-fonts/cinzel";
import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeTransitionLayer } from "@/components/ThemeTransitionLayer";
import { GameProvider } from "@/contexts/GameContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

function ThemedApp() {
  const { background, resolvedTheme } = useColors();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setBackgroundColorAsync(background);
    NavigationBar.setButtonStyleAsync(resolvedTheme === "light" ? "dark" : "light");
  }, [background, resolvedTheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: background }}>
      <KeyboardProvider>
        <StatusBar style={resolvedTheme === "light" ? "dark" : "light"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
        </Stack>
        <ThemeTransitionLayer />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [cinzelLoaded, cinzelError] = useCinzelFonts({
    Cinzel_700Bold,
    Cinzel_900Black,
  });

  const fontsLoaded = interLoaded && cinzelLoaded;
  const fontError = interError || cinzelError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <GameProvider>
            <ThemedApp />
          </GameProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
