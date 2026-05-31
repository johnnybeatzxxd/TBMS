import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { formService, truckService } from "@/src/api/services";
import { FormField, FieldType, CreateFormTemplatePayload } from "@/src/types/form.types";
import { useActionStore } from "@/src/store";

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "text-outline" },
  { value: "number", label: "Number", icon: "calculator-outline" },
  { value: "date", label: "Date", icon: "calendar-outline" },
  { value: "select", label: "Dropdown", icon: "list-outline" },
  { value: "boolean", label: "Yes / No", icon: "toggle-outline" },
  { value: "image", label: "Image Upload", icon: "image-outline" },
];

const CATEGORIES = ["Maintenance", "Payment", "General", "Insurance", "Legal"];

const generateFieldId = () => `fld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

// ─── Single Field Editor Card ────────────────────────────────────────

const FieldEditor = ({
  field,
  index,
  allFields,
  onUpdate,
  onRemove,
}: {
  field: FormField;
  index: number;
  allFields: FormField[];
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onRemove: (id: string) => void;
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [showDependsMenu, setShowDependsMenu] = useState(false);
  const [showDependsValueMenu, setShowDependsValueMenu] = useState(false);

  // Fields that can be depended on (boolean and select only, exclude self)
  const eligibleParents = allFields.filter(
    (f) => f.id !== field.id && (f.type === "boolean" || f.type === "select")
  );
  const parentField = field.dependsOn
    ? allFields.find((f) => f.id === field.dependsOn?.fieldId)
    : null;

  return (
    <View className="bg-white rounded-2xl border border-border shadow-sm mb-4">
      {/* Field Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-slate-50 border-b border-border/50 rounded-t-2xl">
        <View className="flex-row items-center gap-2">
          <View className="w-6 h-6 bg-indigo-100 rounded-md items-center justify-center">
            <Text className="text-indigo-600 text-xs font-black">{index + 1}</Text>
          </View>
          <Text className="text-text-primary font-bold text-sm">
            {field.label || "Untitled Field"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Remove Field", `Delete "${field.label || "this field"}"?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => onRemove(field.id) },
            ]);
          }}
          className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center border border-rose-100"
        >
          <Ionicons name="trash-outline" size={14} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="p-4 gap-4">
        {/* Field Label */}
        <View>
          <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
            Field Name *
          </Text>
          <TextInput
            value={field.label}
            onChangeText={(v) => onUpdate(field.id, { label: v })}
            placeholder="e.g. Mileage, Description, Date..."
            placeholderTextColor="#94A3B8"
            className="bg-surface border border-border rounded-xl h-12 px-3.5 text-sm font-medium text-text-primary"
          />
        </View>

        {/* Field Type Dropdown */}
        <View className="relative" style={{ zIndex: 100 }}>
          <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
            Data Type *
          </Text>
          <TouchableOpacity
            onPress={() => setShowTypeMenu(!showTypeMenu)}
            className="bg-surface border border-border rounded-xl h-12 px-3.5 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={FIELD_TYPES.find(t => t.value === field.type)?.icon as any || "help-outline"}
                size={16}
                color="#6366F1"
              />
              <Text className="text-text-primary text-sm font-medium">
                {FIELD_TYPES.find(t => t.value === field.type)?.label || "Select..."}
              </Text>
            </View>
            <Ionicons name={showTypeMenu ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
          </TouchableOpacity>

          {showTypeMenu && (
            <View className="absolute top-[72px] left-0 right-0 bg-white rounded-xl border border-border shadow-lg overflow-hidden" style={{ zIndex: 999, elevation: 20 }}>
              {FIELD_TYPES.map((ft) => (
                <TouchableOpacity
                  key={ft.value}
                  onPress={() => {
                    onUpdate(field.id, { type: ft.value, options: ft.value === "select" ? [] : undefined });
                    setShowTypeMenu(false);
                  }}
                  className={`px-4 py-3 flex-row items-center gap-2.5 border-b border-border/30 ${field.type === ft.value ? "bg-indigo-50" : "bg-white"}`}
                  activeOpacity={0.7}
                >
                  <Ionicons name={ft.icon as any} size={16} color={field.type === ft.value ? "#6366F1" : "#64748B"} />
                  <Text className={`text-sm font-medium ${field.type === ft.value ? "text-indigo-600 font-bold" : "text-text-primary"}`}>
                    {ft.label}
                  </Text>
                  {field.type === ft.value && <Ionicons name="checkmark" size={14} color="#6366F1" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Placeholder */}
        <View>
          <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
            Placeholder (Optional)
          </Text>
          <TextInput
            value={field.placeholder || ""}
            onChangeText={(v) => onUpdate(field.id, { placeholder: v })}
            placeholder="Hint text shown to driver..."
            placeholderTextColor="#94A3B8"
            className="bg-surface border border-border rounded-xl h-12 px-3.5 text-sm font-medium text-text-primary"
          />
        </View>

        {/* Dropdown Options (only for select type) */}
        {field.type === "select" && (
          <View>
            <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
              Dropdown Options *
            </Text>
            <View className="bg-surface rounded-xl border border-border p-3 gap-2">
              {(field.options || []).map((opt, i) => (
                <View key={i} className="flex-row items-center gap-2">
                  <View className="flex-1 bg-white border border-border/50 rounded-lg px-3 py-2">
                    <Text className="text-text-primary text-sm">{opt}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const newOpts = [...(field.options || [])];
                      newOpts.splice(i, 1);
                      onUpdate(field.id, { options: newOpts });
                    }}
                    className="w-7 h-7 bg-rose-50 rounded-md items-center justify-center"
                  >
                    <Ionicons name="close" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <View className="flex-row items-center gap-2 mt-1">
                <TextInput
                  value={newOption}
                  onChangeText={setNewOption}
                  placeholder="Add an option..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 bg-white border border-border rounded-lg h-10 px-3 text-sm text-text-primary"
                  onSubmitEditing={() => {
                    if (newOption.trim()) {
                      onUpdate(field.id, { options: [...(field.options || []), newOption.trim()] });
                      setNewOption("");
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (newOption.trim()) {
                      onUpdate(field.id, { options: [...(field.options || []), newOption.trim()] });
                      setNewOption("");
                    }
                  }}
                  className="w-10 h-10 bg-indigo-500 rounded-lg items-center justify-center"
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Required Toggle */}
        <View className="flex-row items-center justify-between bg-surface border border-border/50 rounded-xl px-3.5 py-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={16} color={field.required ? "#EF4444" : "#94A3B8"} />
            <Text className="text-text-primary font-semibold text-sm">Required Field</Text>
          </View>
          <Switch
            value={field.required}
            onValueChange={(v) => onUpdate(field.id, { required: v })}
            trackColor={{ false: "#E2E8F0", true: "#C7D2FE" }}
            thumbColor={field.required ? "#6366F1" : "#94A3B8"}
          />
        </View>

        {/* ─── Conditional Visibility (Depends On) ──────── */}
        {eligibleParents.length > 0 && (
          <View className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 gap-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="git-branch-outline" size={14} color="#D97706" />
              <Text className="text-amber-700 text-[10px] font-bold tracking-widest uppercase">Conditional Visibility</Text>
            </View>

            {field.dependsOn ? (
              <>
                {/* Show current dependency */}
                <View className="bg-white rounded-lg border border-amber-200 px-3 py-2.5">
                  <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1">Show this field when:</Text>
                  <Text className="text-text-primary text-sm font-medium">
                    "{parentField?.label || "Unknown"}" = {String(field.dependsOn.value) === "true" ? "Yes" : String(field.dependsOn.value) === "false" ? "No" : `"${field.dependsOn.value}"`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onUpdate(field.id, { dependsOn: undefined })}
                  className="flex-row items-center justify-center py-2 bg-white rounded-lg border border-amber-200"
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
                  <Text className="text-amber-700 font-semibold text-xs">Remove Condition</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Parent field picker */}
                <View className="relative" style={{ zIndex: 80 }}>
                  <TouchableOpacity
                    onPress={() => { setShowDependsMenu(!showDependsMenu); setShowDependsValueMenu(false); }}
                    className="bg-white border border-amber-200 rounded-lg h-10 px-3 flex-row items-center justify-between"
                    activeOpacity={0.8}
                  >
                    <Text className="text-text-secondary text-xs font-medium">Select parent field...</Text>
                    <Ionicons name={showDependsMenu ? "chevron-up" : "chevron-down"} size={14} color="#D97706" />
                  </TouchableOpacity>

                  {showDependsMenu && (
                    <View className="absolute top-[44px] left-0 right-0 bg-white rounded-lg border border-border shadow-lg overflow-hidden" style={{ zIndex: 999, elevation: 20 }}>
                      {eligibleParents.map((pf) => (
                        <TouchableOpacity
                          key={pf.id}
                          onPress={() => {
                            // Set dependency with default value
                            const defaultValue = pf.type === "boolean" ? true : (pf.options?.[0] || "");
                            onUpdate(field.id, { dependsOn: { fieldId: pf.id, value: defaultValue } });
                            setShowDependsMenu(false);
                          }}
                          className="px-3 py-2.5 border-b border-border/30 flex-row items-center gap-2"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={pf.type === "boolean" ? "toggle-outline" : "list-outline"}
                            size={14}
                            color="#64748B"
                          />
                          <Text className="text-text-primary text-sm font-medium flex-1">{pf.label || "Untitled"}</Text>
                          <Text className="text-text-secondary text-[10px] uppercase">{pf.type === "boolean" ? "Yes/No" : "Dropdown"}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Value picker (only shown when dependency is set) */}
            {field.dependsOn && parentField && (
              <View className="relative" style={{ zIndex: 70 }}>
                <Text className="text-amber-700 text-[10px] font-bold tracking-widest uppercase mb-1.5">Trigger Value</Text>
                <TouchableOpacity
                  onPress={() => setShowDependsValueMenu(!showDependsValueMenu)}
                  className="bg-white border border-amber-200 rounded-lg h-10 px-3 flex-row items-center justify-between"
                  activeOpacity={0.8}
                >
                  <Text className="text-text-primary text-sm font-medium">
                    {String(field.dependsOn.value) === "true" ? "Yes" : String(field.dependsOn.value) === "false" ? "No" : field.dependsOn.value}
                  </Text>
                  <Ionicons name={showDependsValueMenu ? "chevron-up" : "chevron-down"} size={14} color="#D97706" />
                </TouchableOpacity>

                {showDependsValueMenu && (
                  <View className="absolute top-[60px] left-0 right-0 bg-white rounded-lg border border-border shadow-lg overflow-hidden" style={{ zIndex: 999, elevation: 20 }}>
                    {parentField.type === "boolean" ? (
                      <>
                        <TouchableOpacity
                          onPress={() => { onUpdate(field.id, { dependsOn: { ...field.dependsOn!, value: true } }); setShowDependsValueMenu(false); }}
                          className={`px-3 py-2.5 border-b border-border/30 ${field.dependsOn.value === true ? "bg-amber-50" : ""}`}
                        >
                          <Text className={`text-sm ${field.dependsOn.value === true ? "text-amber-700 font-bold" : "text-text-primary"}`}>Yes (On)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { onUpdate(field.id, { dependsOn: { ...field.dependsOn!, value: false } }); setShowDependsValueMenu(false); }}
                          className={`px-3 py-2.5 ${field.dependsOn.value === false ? "bg-amber-50" : ""}`}
                        >
                          <Text className={`text-sm ${field.dependsOn.value === false ? "text-amber-700 font-bold" : "text-text-primary"}`}>No (Off)</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      (parentField.options || []).map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => { onUpdate(field.id, { dependsOn: { ...field.dependsOn!, value: opt } }); setShowDependsValueMenu(false); }}
                          className={`px-3 py-2.5 border-b border-border/30 ${field.dependsOn!.value === opt ? "bg-amber-50" : ""}`}
                        >
                          <Text className={`text-sm ${field.dependsOn!.value === opt ? "text-amber-700 font-bold" : "text-text-primary"}`}>{opt}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Form Builder Screen ────────────────────────────────────────

export default function AddFormTemplateScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!params.id;

  const [loading, setLoading] = useState(false);
  const { isActionPending, startAction, stopAction } = useActionStore();
  const saving = isActionPending("submit_form_template");

  // Form metadata
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Custom fields
  const [fields, setFields] = useState<FormField[]>([]);

  // Truck Selection
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruckIds, setSelectedTruckIds] = useState<string[]>([]);
  const [showTruckMenu, setShowTruckMenu] = useState(false);

  // Load trucks and existing template (if in edit mode)
  useEffect(() => {
    setLoading(true);
    
    const fetchPromises: Promise<any>[] = [
      truckService.getMyTrucks().then(res => {
        if ("trucks" in res) setTrucks(res.trucks);
      })
    ];

    if (isEditMode && params.id) {
      fetchPromises.push(
        formService.getFormTemplate(params.id).then((template) => {
          if (template) {
            setName(template.name);
            setCategory(template.category);
            setDescription(template.description || "");
            setRequiresApproval(template.requiresApproval);
            setFields(template.fields);
            setIsActive(template.isActive === true || (template.isActive as any) === "true");
            if (template.allowedTruckIds) {
              setSelectedTruckIds(template.allowedTruckIds);
            }
          }
        })
      );
    }

    Promise.all(fetchPromises)
      .catch((e: any) => {
        Alert.alert("Error", e.message || "Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const addField = () => {
    setFields(prev => [
      ...prev,
      {
        id: generateFieldId(),
        label: "",
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Missing", "Please enter a form name.");
    if (!category) return Alert.alert("Missing", "Please select a category.");

    // Validate fields
    for (const field of fields) {
      if (!field.label.trim()) return Alert.alert("Validation", `Field #${fields.indexOf(field) + 1} needs a name.`);
      if (field.type === "select" && (!field.options || field.options.length < 2)) {
        return Alert.alert("Validation", `"${field.label}" needs at least 2 dropdown options.`);
      }
    }

    startAction("submit_form_template");
    try {
      const payload: CreateFormTemplatePayload = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        requiresApproval,
        fields,
        allowedTruckIds: selectedTruckIds,
        isActive,
      };

      if (isEditMode && params.id) {
        await formService.updateFormTemplate(params.id, payload);
        Alert.alert("Success", "Form template updated!");
      } else {
        await formService.createFormTemplate(payload);
        Alert.alert("Success", "Form template created!");
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save template.");
    } finally {
      stopAction("submit_form_template");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-text-secondary mt-3">Loading template...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-border"
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">
          {isEditMode ? "Edit Form" : "Create Form"}
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Section 1: Form Info ─────────────────────── */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-7 h-7 bg-indigo-100 rounded-lg items-center justify-center">
                <Ionicons name="information-circle" size={16} color="#6366F1" />
              </View>
              <Text className="text-text-primary font-bold text-base">Form Details</Text>
            </View>

            <View className="gap-5">
              {/* Form Name */}
              <View>
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
                  Form Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Oil Change Request"
                  placeholderTextColor="#94A3B8"
                  className="bg-white border border-border rounded-xl h-14 px-4 text-base font-medium text-text-primary shadow-sm"
                />
              </View>

              {/* Category Dropdown */}
              <View className="relative" style={{ zIndex: 200 }}>
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
                  Category *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCategoryMenu(!showCategoryMenu)}
                  className="bg-white border border-border rounded-xl h-14 px-4 flex-row items-center justify-between shadow-sm"
                  activeOpacity={0.8}
                >
                  <Text className={`text-base ${category ? "text-text-primary font-medium" : "text-slate-400"}`}>
                    {category || "Select category..."}
                  </Text>
                  <Ionicons name={showCategoryMenu ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                </TouchableOpacity>

                {showCategoryMenu && (
                  <View className="absolute top-[76px] left-0 right-0 bg-white rounded-xl border border-border shadow-lg overflow-hidden" style={{ zIndex: 999, elevation: 20 }}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => {
                          setCategory(cat);
                          setShowCategoryMenu(false);
                        }}
                        className={`px-4 py-3.5 border-b border-border/30 ${category === cat ? "bg-indigo-50" : "bg-white"}`}
                        activeOpacity={0.7}
                      >
                        <Text className={`text-base ${category === cat ? "text-indigo-600 font-bold" : "text-text-primary"}`}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Description */}
              <View>
                <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1.5 ml-0.5">
                  Description (Optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Short explanation shown to drivers..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                  className="bg-white border border-border rounded-xl p-4 min-h-[80px] text-base text-text-primary shadow-sm"
                />
              </View>

              {/* Requires Approval Toggle */}
              <View className="flex-row items-center justify-between bg-white border border-border rounded-xl p-4 shadow-sm">
                <View className="flex-row items-center gap-2 flex-1 pr-3">
                  <Ionicons name="shield-checkmark" size={20} color={requiresApproval ? "#F59E0B" : "#16A34A"} />
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-sm">Requires Approval</Text>
                    <Text className="text-text-secondary text-xs mt-0.5">
                      {requiresApproval
                        ? "Admin must review and approve submissions"
                        : "Submissions are auto-approved instantly"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={requiresApproval}
                  onValueChange={setRequiresApproval}
                  trackColor={{ false: "#DCFCE7", true: "#FEF3C7" }}
                  thumbColor={requiresApproval ? "#F59E0B" : "#16A34A"}
                />
              </View>

              {/* Form Active Toggle */}
              <View className="flex-row items-center justify-between bg-white border border-border rounded-xl p-4 shadow-sm">
                <View className="flex-row items-center gap-2 flex-1 pr-3">
                  <Ionicons name="eye-outline" size={20} color={isActive ? "#6366F1" : "#94A3B8"} />
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-sm">Form Status</Text>
                    <Text className="text-text-secondary text-xs mt-0.5">
                      {isActive
                        ? "Enabled - drivers can fill and submit this form"
                        : "Disabled - drivers will not see this form"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: "#E2E8F0", true: "#C7D2FE" }}
                  thumbColor={isActive ? "#6366F1" : "#94A3B8"}
                />
              </View>

              {/* Allowed Trucks Multi-Select */}
              <View className="relative" style={{ zIndex: 150 }}>
                <View className="flex-row items-center justify-between mb-1.5 ml-0.5">
                  <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase">
                    Allowed Trucks
                  </Text>
                  <Text className="text-text-secondary text-[10px]">
                    {selectedTruckIds.length === 0 ? "All Trucks Allowed" : `${selectedTruckIds.length} Selected`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTruckMenu(!showTruckMenu)}
                  className="bg-white border border-border rounded-xl min-h-[56px] px-4 py-3 flex-row items-center justify-between shadow-sm"
                  activeOpacity={0.8}
                >
                  <View className="flex-1 flex-row flex-wrap gap-2 mr-2">
                    {selectedTruckIds.length === 0 ? (
                      <Text className="text-slate-400 text-base">Select trucks (leave empty for all)...</Text>
                    ) : (
                      selectedTruckIds.map(id => {
                        const truck = trucks.find(t => t.id === id);
                        return (
                          <View key={id} className="bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                            <Text className="text-indigo-700 text-xs font-bold">{truck?.plateNumber || id}</Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                  <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                </TouchableOpacity>

                {showTruckMenu && (
                  <View className="absolute top-[100%] left-0 right-0 mt-2 bg-white rounded-xl border border-border shadow-lg overflow-hidden" style={{ zIndex: 999, elevation: 20 }}>
                    <ScrollView style={{ maxHeight: 200, flexGrow: 0 }}>
                      {trucks.map((truck) => {
                        const isSelected = selectedTruckIds.includes(truck.id);
                        return (
                          <TouchableOpacity
                            key={truck.id}
                            onPress={() => {
                              setSelectedTruckIds(prev =>
                                isSelected ? prev.filter(id => id !== truck.id) : [...prev, truck.id]
                              );
                            }}
                            className={`px-4 py-3.5 border-b border-border/30 flex-row items-center justify-between ${isSelected ? "bg-indigo-50" : "bg-white"}`}
                            activeOpacity={0.7}
                          >
                            <Text className={`text-base ${isSelected ? "text-indigo-600 font-bold" : "text-text-primary"}`}>
                              {truck.plateNumber}
                            </Text>
                            {isSelected && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                          </TouchableOpacity>
                        );
                      })}
                      {trucks.length === 0 && (
                        <View className="p-4 items-center">
                          <Text className="text-text-secondary text-sm">No trucks available.</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ─── Default Fields Banner ────────────────────── */}
          <View className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex-row items-center gap-3 mb-6">
            <Ionicons name="cash" size={18} color="#6366F1" />
            <View className="flex-1">
              <Text className="text-indigo-700 text-xs font-bold">Total Amount (ETB)</Text>
              <Text className="text-indigo-500 text-[10px] mt-0.5">
                This field is included automatically in every form. You don't need to add it.
              </Text>
            </View>
            <View className="bg-indigo-100 px-2 py-0.5 rounded">
              <Text className="text-indigo-600 text-[9px] font-bold">DEFAULT</Text>
            </View>
          </View>

          {/* ─── Section 2: Custom Fields ─────────────────── */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 bg-indigo-100 rounded-lg items-center justify-center">
                  <Ionicons name="layers" size={16} color="#6366F1" />
                </View>
                <Text className="text-text-primary font-bold text-base">
                  Custom Fields ({fields.length})
                </Text>
              </View>
            </View>

            {fields.map((field, index) => (
              <View key={field.id} style={{ zIndex: fields.length - index, elevation: fields.length - index }}>
                <FieldEditor
                  field={field}
                  index={index}
                  allFields={fields}
                  onUpdate={updateField}
                  onRemove={removeField}
                />
              </View>
            ))}

            {/* Add Field Button */}
            <TouchableOpacity
              onPress={addField}
              activeOpacity={0.8}
              className="border-2 border-dashed border-indigo-200 rounded-2xl py-4 items-center justify-center flex-row gap-2 bg-indigo-50/30"
            >
              <Ionicons name="add-circle" size={20} color="#6366F1" />
              <Text className="text-indigo-600 font-bold text-sm">Add Custom Field</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Sticky Save Button ───────────────────────────── */}
      <View className="p-5 bg-white border-t border-border shadow-lg">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          className={`h-14 rounded-xl flex-row items-center justify-center shadow-md ${saving ? "bg-indigo-400/70" : "bg-indigo-500"}`}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={isEditMode ? "checkmark-circle" : "create"} size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-lg">
                {isEditMode ? "Update Form" : "Create Form"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
