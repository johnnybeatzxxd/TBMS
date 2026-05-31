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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { reminderService, driverService } from "@/src/api/services";
import { useActionStore } from "@/src/store";

export default function AddReminderModal() {
  const [reminderName, setReminderName] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  
  const [reminderType, setReminderType] = useState<"ONE_TIME" | "RECURRING">("ONE_TIME");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  
  const [reminderStart, setReminderStart] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date());
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const { isActionPending, startAction, stopAction } = useActionStore();
  const loading = isActionPending("submit_reminder");

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
    if (!reminderName.trim()) return Alert.alert("Validation", "Reminder title required.");
    if (!reminderMessage.trim()) return Alert.alert("Validation", "Reminder message required.");

    startAction("submit_reminder");
    try {
      await reminderService.addReminder({
        reminderName,
        reminderMessage,
        reminderType,
        frequency: reminderType === "RECURRING" ? frequency : undefined,
        reminderStart: reminderStart.toISOString(),
        deadline: reminderType === "ONE_TIME" ? deadline.toISOString() : undefined,
        remindDrivers: selectedDrivers.length > 0 ? selectedDrivers : undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create reminder");
    } finally {
      stopAction("submit_reminder");
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
            Create Routine
          </Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ gap: 24, paddingBottom: 60 }}>
          <View className="bg-white rounded-2xl p-5 border border-border shadow-sm gap-5">

            <View className="gap-1.5 z-0">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Name *
              </Text>
              <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
                <Ionicons name="flag-outline" size={16} color="#64748B" />
                <TextInput
                  className="flex-1 py-3.5 pl-3 text-base text-text-primary"
                  placeholder="e.g. Oil Change"
                  placeholderTextColor="#94A3B8"
                  value={reminderName}
                  onChangeText={setReminderName}
                />
              </View>
            </View>

            <View className="gap-1.5 z-0">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Message *
              </Text>
              <View className="flex-row items-start bg-surface rounded-xl px-4 py-3 border border-border min-h-[100px]">
                <Ionicons name="chatbox-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
                <TextInput
                  className="flex-1 pl-3 text-base text-text-primary pt-0"
                  placeholder="Alert message body..."
                  placeholderTextColor="#94A3B8"
                  value={reminderMessage}
                  onChangeText={setReminderMessage}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setReminderType("ONE_TIME")} className={`flex-1 py-3 rounded-xl items-center border ${reminderType === "ONE_TIME" ? "bg-primary-50 border-primary-500" : "bg-surface border-border"}`}>
                <Text className={`font-bold ${reminderType === "ONE_TIME" ? "text-primary-700" : "text-text-secondary"}`}>One Time</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReminderType("RECURRING")} className={`flex-1 py-3 rounded-xl items-center border ${reminderType === "RECURRING" ? "bg-primary-50 border-primary-500" : "bg-surface border-border"}`}>
                <Text className={`font-bold ${reminderType === "RECURRING" ? "text-primary-700" : "text-text-secondary"}`}>Recurring</Text>
              </TouchableOpacity>
            </View>

            {reminderType === "RECURRING" && (
              <View className="flex-row justify-between bg-surface p-1.5 rounded-xl border border-border">
                 {["DAILY", "WEEKLY", "MONTHLY"].map((f) => (
                   <TouchableOpacity key={f} onPress={() => setFrequency(f as any)} className={`px-4 py-2 rounded-lg ${frequency === f ? "bg-white shadow-sm" : ""}`}>
                     <Text className={`text-xs font-bold ${frequency === f ? "text-text-primary" : "text-text-secondary"}`}>{f}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
            )}

            <View className="gap-3">
              <View className="gap-1.5 z-0">
                <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                  Start Date *
                </Text>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border">
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text className="flex-1 ml-3 text-base text-text-primary">{reminderStart.toISOString().split("T")[0]}</Text>
                </TouchableOpacity>
              </View>

              {reminderType === "ONE_TIME" && (
                <View className="gap-1.5 z-0">
                  <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                    Deadline *
                  </Text>
                  <TouchableOpacity onPress={() => setShowDeadlinePicker(true)} className="flex-row items-center bg-surface rounded-xl px-4 py-3.5 border border-border">
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text className="flex-1 ml-3 text-base text-text-primary">{deadline.toISOString().split("T")[0]}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {(showStartPicker || showDeadlinePicker) && (
              <DateTimePicker
                value={showStartPicker ? reminderStart : deadline}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS === "android") {
                     setShowStartPicker(false);
                     setShowDeadlinePicker(false);
                  }
                  if (date) {
                     if (showStartPicker) setReminderStart(date);
                     else setDeadline(date);
                  }
                }}
              />
            )}
            {Platform.OS === "ios" && (showStartPicker || showDeadlinePicker) && (
              <TouchableOpacity
                onPress={() => { setShowStartPicker(false); setShowDeadlinePicker(false); }}
                className="py-2 items-center bg-slate-100 rounded-lg"
              >
                <Text className="text-primary font-semibold">Done</Text>
              </TouchableOpacity>
            )}

            <View className="gap-1.5 relative z-50">
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                Linked Drivers (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowDriverMenu(!showDriverMenu)}
                className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
              >
                <Ionicons name="people-outline" size={16} color="#64748B" />
                <Text className={`flex-1 ml-2 text-base ${selectedDrivers.length ? "text-text-primary" : "text-slate-400"}`}>
                  {selectedDrivers.length > 0 ? `${selectedDrivers.length} Selected` : "Tap to select"}
                </Text>
                <Ionicons name={showDriverMenu ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
              </TouchableOpacity>

              {showDriverMenu && (
                <View className="absolute top-16 left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-hidden">
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
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base tracking-wide">Save</Text>}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
