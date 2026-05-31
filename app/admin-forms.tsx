import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList, RefreshControl, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { formService } from "@/src/api/services";
import { FormTemplate } from "@/src/types/form.types";
import { useActionStore } from "@/src/store";

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  boolean: "Yes/No",
};

const TemplateCard = ({ template, onEdit, onDelete, onToggleActive }: {
  template: FormTemplate;
  onEdit: (t: FormTemplate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (t: FormTemplate, isActive: boolean) => void;
}) => {
  const { isActionPending } = useActionStore();
  const isTemplateActive = template.isActive === true || (template.isActive as any) === "true";
  const isToggling = isActionPending(`toggle_form_${template.id}`);
  const isDeleting = isActionPending(`delete_form_${template.id}`);

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
      <View className="flex-row items-center gap-2">
        <Switch
          value={isTemplateActive}
          onValueChange={(val) => onToggleActive(template, val)}
          disabled={isToggling}
          trackColor={{ false: "#E2E8F0", true: "#C7D2FE" }}
          thumbColor={isTemplateActive ? "#6366F1" : "#94A3B8"}
          style={{ transform: [{ scale: 0.8 }] }}
        />
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center bg-indigo-50 rounded-lg border border-indigo-100"
          activeOpacity={0.8}
          onPress={() => onEdit(template)}
        >
          <Ionicons name="pencil" size={16} color="#6366F1" />
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-10 h-10 items-center justify-center rounded-lg border ${isDeleting ? "bg-rose-100 border-rose-200" : "bg-rose-50 border-rose-100"}`}
          activeOpacity={0.8}
          disabled={isDeleting}
          onPress={() => {
            Alert.alert("Delete Template", `Are you sure you want to delete "${template.name}"?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onDelete(template.id) },
            ]);
          }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          )}
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

  const { startAction, stopAction } = useActionStore();

  const handleDelete = async (id: string) => {
    startAction(`delete_form_${id}`);
    try {
      await formService.deleteFormTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete template");
    } finally {
      stopAction(`delete_form_${id}`);
    }
  };

  const handleEdit = (template: FormTemplate) => {
    router.push(`/add-form-template?id=${template.id}` as any);
  };

  const handleToggleActive = async (template: FormTemplate, isActive: boolean) => {
    startAction(`toggle_form_${template.id}`);
    setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isActive } : t));
    try {
      await formService.updateFormTemplate(template.id, { isActive });
    } catch (e: any) {
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isActive: template.isActive } : t));
      Alert.alert("Error", e.message || "Failed to update form status");
    } finally {
      stopAction(`toggle_form_${template.id}`);
    }
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
            <TemplateCard template={item} onEdit={handleEdit} onDelete={handleDelete} onToggleActive={handleToggleActive} />
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
