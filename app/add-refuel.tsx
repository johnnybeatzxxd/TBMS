import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { refuelService } from "@/src/api/services";

export default function AddRefuelScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    liters?: string;
    price?: string;
    date?: string;
    location?: string;
    km?: string;
    fullTank?: string;
  }>();

  const isEditMode = !!params.id;

  const [loading, setLoading] = useState(false);

  // Form State — pre-fill from params when editing
  const [volume, setVolume] = useState(params.liters || "");
  const [price, setPrice] = useState(params.price || "");
  const [images, setImages] = useState<string[]>([]);
  const [date, setDate] = useState(params.date ? new Date(params.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [location, setLocation] = useState(params.location || "");
  const [km, setKm] = useState(params.km || "");
  const [fullTank, setFullTank] = useState(params.fullTank === "true");

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
      if (isEditMode) {
        await refuelService.updateRefuel(params.id!, {
          liters: Number(volume),
          price: Number(price),
          date: date.toISOString(),
          location: location.trim() || undefined,
          km: km ? Number(km) : undefined,
          fullTank,
        });
        Alert.alert("Success", "Refuel updated successfully!");
      } else {
        // For now we pass empty receiptPic, pending firebase upload implementation
        await refuelService.registerRefuel({
          liters: Number(volume),
          price: Number(price),
          date: date.toISOString(),
          receiptPic: [],
          location: location.trim() || undefined,
          km: km ? Number(km) : undefined,
          fullTank
        });
        Alert.alert("Success", "Refuel log added successfully!");
      }
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || `Failed to ${isEditMode ? "update" : "submit"} refuel log.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-border"
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">
          {isEditMode ? "Edit Refuel" : "Log Refuel"}
        </Text>
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
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isEditMode ? "bg-sky-50" : "bg-amber-50"}`}>
              <MaterialCommunityIcons name="gas-station" size={32} color={isEditMode ? "#0EA5E9" : "#F59E0B"} />
            </View>
            <Text className="text-text-primary text-xl font-bold">
              {isEditMode ? "Update Refuel Log" : "New Refuel Log"}
            </Text>
            <Text className="text-text-secondary text-sm mt-1 text-center px-4">
              {isEditMode
                ? "Modify the fuel volume, price, or details below."
                : "Enter the fuel volume and total price for the truck."}
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

            {/* Date Field */}
            <View className="z-0">
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                Refuel Date *
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-border rounded-xl h-14 px-4 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#94A3B8" className="mr-3" />
                  <Text className="text-base font-medium text-text-primary ml-2">
                    {date.toISOString().split("T")[0]}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
              {Platform.OS === "ios" && showDatePicker && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="mt-2 py-2 items-center bg-slate-100 rounded-lg"
                >
                  <Text className="text-primary font-semibold">Done</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="h-px bg-border/50 my-2" />

            {/* Odometer (KM) & Location Row */}
            <View className="flex-row gap-4 z-0">
              <View className="flex-1">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                  Odometer (KM)
                </Text>
                <TextInput
                  value={km}
                  onChangeText={setKm}
                  placeholder="150000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  className="bg-white border border-border rounded-xl h-14 px-4 text-base font-medium text-text-primary shadow-sm"
                />
              </View>
              
              <View className="flex-1">
                <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">
                  Location
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Station Name"
                  placeholderTextColor="#94A3B8"
                  className="bg-white border border-border rounded-xl h-14 px-4 text-base font-medium text-text-primary shadow-sm"
                />
              </View>
            </View>

            {/* Full Tank Toggle */}
            <View className="flex-row items-center justify-between bg-white border border-border rounded-xl p-4 shadow-sm z-0">
               <View className="flex-row items-center">
                 <Ionicons name="battery-full" size={20} color={fullTank ? "#16A34A" : "#94A3B8"} className="mr-3" />
                 <Text className="text-text-primary font-bold text-base ml-2">Full Tank</Text>
               </View>
               <Switch
                 value={fullTank}
                 onValueChange={setFullTank}
                 trackColor={{ false: "#E2E8F0", true: "#DCFCE7" }}
                 thumbColor={fullTank ? "#16A34A" : "#94A3B8"}
               />
            </View>


            {/* Images Selection (Optional) — only show for new refuels */}
            {!isEditMode && (
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
            )}

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
            loading
              ? isEditMode ? "bg-sky-400/70" : "bg-amber-400/70"
              : isEditMode ? "bg-sky-500" : "bg-amber-500"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="gas-station" size={20} color="#fff" className="mr-2" />
              <Text className="text-white font-bold text-lg ml-2">
                {isEditMode ? "Update Refuel" : "Submit Refuel"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
