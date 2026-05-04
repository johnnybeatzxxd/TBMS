import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { truckService } from "@/src/api/services";

export default function AddTruckModal() {
  const params = useLocalSearchParams<{
    id?: string;
    plateNumber?: string;
    vinNumber?: string;
    brand?: string;
    model?: string;
  }>();

  const isEditMode = !!params.id;

  const [plateNumber, setPlateNumber] = useState(params.plateNumber || "");
  const [vinNumber, setVinNumber] = useState(params.vinNumber || "");
  const [brand, setBrand] = useState(params.brand || "");
  const [model, setModel] = useState(params.model || "");
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!plateNumber.trim()) {
      Alert.alert("Error", "Plate number is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        plateNumber: plateNumber.trim().toUpperCase(),
        vinNumber: vinNumber.trim().toUpperCase() || "",
        brand: brand.trim() || "",
        model: model.trim() || "",
      };

      if (isEditMode) {
        await truckService.updateTruck(params.id!, payload);
      } else {
        await truckService.addTruck(payload);
      }

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to ${isEditMode ? "update" : "add"} truck`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            {isEditMode ? "Edit Truck" : "Add Truck"}
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-4">
            
            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Plate Number *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="barcode-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary uppercase"
                  placeholder="e.g. KAA 001A"
                  placeholderTextColor="#94A3B8"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                VIN Number (Optional)
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="finger-print-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary uppercase"
                  placeholder="e.g. VIN12345678"
                  placeholderTextColor="#94A3B8"
                  value={vinNumber}
                  onChangeText={setVinNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Brand (Optional)
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="car-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="e.g. Volvo, Scania"
                  placeholderTextColor="#94A3B8"
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Model (Optional)
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="construct-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="e.g. FH16, R500"
                  placeholderTextColor="#94A3B8"
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mt-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-surface-hover rounded-xl py-4 items-center justify-center border border-border"
                disabled={loading}
              >
                <Text className="text-text-secondary font-bold text-base">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="flex-1 bg-sky-500 rounded-xl py-4 items-center justify-center shadow-sm shadow-sky-500"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base tracking-wide">
                    {isEditMode ? "Save Changes" : "Add Truck"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
