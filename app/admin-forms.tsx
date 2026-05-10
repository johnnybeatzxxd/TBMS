import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { formService } from "@/src/api/services";
import { FormTemplate } from "@/src/types/form.types";

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  boolean: "Yes/No",
};

const TemplateCard = ({ template, onEdit, onDelete }: {
  template: FormTemplate;
  onEdit: (t: FormTemplate) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <View className="bg-white rounded-2xl border border-border shadow-sm mb-3 p-4 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 pr-3">
        <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 border"
          style={{ backgroundColor: "#6366F115", borderColor: "#6366F130" }}
        >
          <Ionicons name="document-text" size={20} color="#6366F1" />
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
            {template.name}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center bg-indigo-50 rounded-lg border border-indigo-100"
          activeOpacity={0.8}
          onPress={() => onEdit(template)}
        >
          <Ionicons name="pencil" size={16} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center bg-rose-50 rounded-lg border border-rose-100"
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert("Delete Template", `Are you sure you want to delete "${template.name}"?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(template.id) },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function AdminFormsScreen() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await formService.getFormTemplates();
      setTemplates(res.templates);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load form templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await formService.deleteFormTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete template");
    }
  };

  const handleEdit = (template: FormTemplate) => {
    router.push(`/add-form-template?id=${template.id}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 bg-white border-b border-border shadow-sm" style={{ zIndex: 50, elevation: 10 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center rounded-full bg-slate-100">
            <Ionicons name="arrow-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <Ionicons name="construct" size={24} color="#6366F1" />
          <View>
            <Text className="text-text-primary font-bold text-xl tracking-wide">Form Builder</Text>
            <Text className="text-text-secondary text-[10px] font-semibold tracking-widest uppercase">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {loading && templates.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-text-secondary tracking-widest uppercase text-xs font-bold">Loading templates...</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
          renderItem={({ item }) => (
            <TemplateCard template={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 opacity-60">
              <Ionicons name="document-text-outline" size={64} color="#94A3B8" />
              <Text className="text-text-primary font-bold text-lg mt-4">No Form Templates</Text>
              <Text className="text-text-secondary text-sm mt-2 text-center px-8">
                Tap the + button below to create your first custom form for drivers.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/add-form-template")}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full items-center justify-center shadow-lg border border-indigo-600"
        style={{ elevation: 5 }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
