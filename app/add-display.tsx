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
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { displayService, driverService } from "@/src/api/services";

export default function AddDisplayModal() {
  const [displayMessage, setDisplayMessage] = useState("");
  const [displayActive, setDisplayActive] = useState(true);
  
  const [startTime, setStartTime] = useState(new Date());
  
  const defaultEndTime = new Date();
  defaultEndTime.setFullYear(defaultEndTime.getFullYear() + 2);
  const [endTime, setEndTime] = useState(defaultEndTime);
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // Driver Association
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [showDriverMenu, setShowDriverMenu] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  useEffect(() => {
    driverService.getMyDrivers().then((res) => {
      setDrivers(res.drivers.map(d => ({ id: d.id || (d as any)._id, name: d.name })));
    }).catch(() => setDrivers([]));
  }, []);

  const toggleDriver = (id: string) => {
    if (selectedDrivers.includes(id)) {
      setSelectedDrivers(prev => prev.filter(d => d !== id));
    } else {
      setSelectedDrivers(prev => [...prev, id]);
    }
  };

  const handleSubmit = async () => {
    if (!displayMessage.trim()) return Alert.alert("Validation", "Display message required.");
    if (displayMessage.length > 256) return Alert.alert("Validation", "Message cannot exceed 256 characters.");

    setLoading(true);
    try {
      await displayService.addDisplay({
        displayMessage: displayMessage.trim(),
        displayActive,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        forDrivers: selectedDrivers.length > 0 ? selectedDrivers : undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create display");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            Create Banner
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-5">

            <View className="flex-row items-center justify-between bg-primary-50 p-3 rounded-xl border border-primary-100">
               <View className="flex-col">
                  <Text className="font-bold text-primary-800">Immediately Active</Text>
                  <Text className="text-[10px] text-primary-600 font-medium">Broadcast currently to dashboards</Text>
               </View>
               <Switch
                 value={displayActive}
                 onValueChange={setDisplayActive}
                 trackColor={{ false: "#CBD5E1", true: "#60A5FA" }}
                 thumbColor={displayActive ? "#2563EB" : "#F8FAFC"}
               />
            </View>

            <View className="gap-1.5 z-0">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Billboard Text *
              </Text>
              <View className="flex-row items-start bg-surface rounded-xl px-4 py-3 border border-border min-h-[100px]">
                <Ionicons name="megaphone-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                <TextInput
                  className="flex-1 pl-3 text-base text-text-primary pt-0"
                  placeholder="Insert announcement here..."
                  placeholderTextColor="#94A3B8"
                  value={displayMessage}
                  onChangeText={setDisplayMessage}
                  multiline
                  maxLength={256}
                  textAlignVertical="top"
                />
              </View>
              <Text className="text-right text-[10px] text-slate-400 mt-1 mr-1">{displayMessage.length} / 256</Text>
            </View>

            <View className="gap-3">
              <View className="gap-1.5 z-0">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Start Date *
                </Text>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border">
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text className="flex-1 ml-3 text-base text-text-primary">{startTime.toISOString().split("T")[0]}</Text>
                </TouchableOpacity>
              </View>

              <View className="gap-1.5 z-0">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Expiration Date *
                </Text>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border">
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text className="flex-1 ml-3 text-base text-text-primary">{endTime.toISOString().split("T")[0]}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {(showStartPicker || showEndPicker) && (
              <DateTimePicker
                value={showStartPicker ? startTime : endTime}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS === "android") {
                     setShowStartPicker(false);
                     setShowEndPicker(false);
                  }
                  if (date) {
                     if (showStartPicker) setStartTime(date);
                     else setEndTime(date);
                  }
                }}
              />
            )}
            {Platform.OS === "ios" && (showStartPicker || showEndPicker) && (
              <TouchableOpacity
                onPress={() => { setShowStartPicker(false); setShowEndPicker(false); }}
                className="py-2 items-center bg-slate-100 rounded-lg"
              >
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            )}

            <View className="gap-1.5 relative z-50 mt-2">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Linked Drivers (Optional)
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium ml-1 mb-1">If blank, broadcasts to ALL your drivers uniformly.</Text>
              <TouchableOpacity
                onPress={() => setShowDriverMenu(!showDriverMenu)}
                className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
              >
                <Ionicons name="people-outline" size={16} color="#64748B" />
                <Text className={`flex-1 ml-2 text-base ${selectedDrivers.length ? "text-text-primary" : "text-slate-400"}`}>
                  {selectedDrivers.length > 0 ? `${selectedDrivers.length} Configured` : "Broadcast to Everyone"}
                </Text>
                <Ionicons name={showDriverMenu ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
              </TouchableOpacity>

              {showDriverMenu && (
                <View className="absolute top-[88px] left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-hidden">
                  <ScrollView nestedScrollEnabled>
                    {drivers.map((drv) => (
                      <TouchableOpacity
                        key={drv.id}
                        onPress={() => toggleDriver(drv.id)}
                        className={`flex-row items-center px-4 py-3 border-b border-border-light ${
                          selectedDrivers.includes(drv.id) ? "bg-primary-50" : "bg-white"
                        }`}
                      >
                        <Text className={`flex-1 text-sm ${selectedDrivers.includes(drv.id) ? "text-primary font-semibold" : "text-text-primary"}`}>
                          {drv.name}
                        </Text>
                        {selectedDrivers.includes(drv.id) && (
                          <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View className="flex-row gap-4 mt-6 z-0">
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
                className="flex-1 bg-primary rounded-xl py-4 items-center justify-center shadow-sm shadow-primary-500"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base tracking-wide">Publish</Text>}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
