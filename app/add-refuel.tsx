import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function AddRefuelScreen() {
  const [loading, setLoading] = useState(false);

  // Form State
  const [volume, setVolume] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow access to your photos to upload receipts.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image.");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!volume || isNaN(Number(volume))) return Alert.alert("Error", "Please enter a valid volume.");
    if (!price || isNaN(Number(price))) return Alert.alert("Error", "Please enter a valid price.");

    setLoading(true);
    try {
      // Simulate backend POST request
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert("Success", "Refuel log added successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to submit refuel log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-border"
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">Log Refuel</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-amber-50 rounded-full items-center justify-center mb-3">
              <MaterialCommunityIcons name="gas-station" size={32} color="#F59E0B" />
            </View>
            <Text className="text-text-primary text-xl font-bold">New Refuel Log</Text>
            <Text className="text-text-secondary text-sm mt-1 text-center px-4">
              Enter the fuel volume and total price for the truck.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-6 z-50">

            {/* Volume Field */}
            <View className="z-0">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                Volume (Liters) *
              </Text>
              <TextInput
                value={volume}
                onChangeText={setVolume}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                className="bg-white border border-border rounded-xl h-14 px-4 text-base font-medium text-text-primary shadow-sm"
              />
            </View>

            {/* Price Field */}
            <View className="z-0">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                Total Price (ETB) *
              </Text>
              <View className="relative">
                <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                   <Text className="text-text-secondary font-bold text-lg">$</Text>
                </View>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  className="bg-white border border-border rounded-xl h-14 pl-10 pr-4 text-base font-medium text-text-primary shadow-sm"
                />
              </View>
            </View>

            {/* Images Selection (Optional) */}
            <View className="z-0 pb-6">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                Receipt / Optional Photos ({images.length}/2)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                {images.map((imgUri, index) => (
                  <View key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border shadow-sm">
                    <Image source={imgUri} className="w-full h-full" contentFit="cover" />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 w-6 h-6 rounded-full items-center justify-center backdrop-blur-sm"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 2 && (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-surface items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={28} color="#94A3B8" />
                    <Text className="text-text-secondary text-xs font-bold mt-1">Add Image</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Actions */}
      <View className="p-5 bg-white border-t border-border shadow-lg z-0">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          className={`h-14 rounded-xl flex-row items-center justify-center shadow-md ${
            loading ? "bg-amber-400/70" : "bg-amber-500"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="gas-station" size={20} color="#fff" className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">Submit Refuel</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
