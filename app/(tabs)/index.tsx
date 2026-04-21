import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-3xl font-bold">🚛 TBMS Dashboard</Text>
        <Text className="text-slate-400 text-sm mt-2">
          Ready to build the future of truck management.
        </Text>
      </View>
    </SafeAreaView>
  );
}
