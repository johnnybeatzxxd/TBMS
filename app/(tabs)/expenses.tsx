import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExpensesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-text-primary text-3xl font-bold">💸 Expenses</Text>
        <Text className="text-text-secondary text-center mt-2">
          Track fuel, maintenance, and other costs.
        </Text>
      </View>
    </SafeAreaView>
  );
}
