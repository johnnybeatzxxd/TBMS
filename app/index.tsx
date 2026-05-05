import { View, ActivityIndicator } from "react-native";

/**
 * Root index screen — acts as a splash/loading screen.
 * The actual navigation happens in _layout.tsx after session restore.
 * Without this file, production APK builds show "Unmatched Route" errors
 * because Expo Router cannot resolve the "/" path.
 */
export default function IndexScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
