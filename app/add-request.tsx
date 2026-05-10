import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/src/store";
import { formService, expenseService } from "@/src/api/services";
import { FormTemplate, SubmitFormPayload } from "@/src/types/form.types";

export default function AddRequestScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // List of service types (id + name only)
  const [serviceTypes, setServiceTypes] = useState<{ id: string; name: string }[]>([]);

  // Selection Menu
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  // Full template fetched when user picks a service type
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Shared Form Fields
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Dynamic Template Fields
  const [values, setValues] = useState<Record<string, any>>({});

  // ── Load service type names on mount ──────────────────────────────
  useEffect(() => {
    formService.getFormTemplates()
      .then(async (res) => {
        setServiceTypes(res.templates.map(t => ({ id: t.id, name: t.name })));
        if (isEditMode && params.id) {
          const sub = await formService.getSubmission(params.id);
          setSelectedServiceId(sub.templateId);
          setAmount(sub.amount.toString());
          setDescription(sub.description || "");
          setValues(sub.values || {});
        }
      })
      .catch((e: any) => {
        Alert.alert("Error", e.message || "Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  // ── Fetch full template when driver selects a service type ────────
  useEffect(() => {
    if (!selectedServiceId) {
      setActiveTemplate(null);
      setValues({});
      return;
    }

    const fetchTemplate = async () => {
      setLoadingTemplate(true);
      try {
        const fullTemplate = await formService.getFormTemplate(selectedServiceId);
        setActiveTemplate(fullTemplate);

        if (fullTemplate) {
          setValues(prev => {
            const mappedValues: Record<string, any> = {};
            fullTemplate.fields.forEach(f => {
              if (prev[f.label] !== undefined) {
                mappedValues[f.id] = prev[f.label];
              } else if (prev[f.id] !== undefined) {
                mappedValues[f.id] = prev[f.id];
              } else if (f.type === "boolean") {
                mappedValues[f.id] = false;
              } else if (f.type === "select" && f.options && f.options.length > 0) {
                mappedValues[f.id] = f.options[0];
              }
            });
            return mappedValues;
          });
        }
      } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to load form details.");
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [selectedServiceId]);

  // ── Helpers ───────────────────────────────────────────────────────
  const updateValue = (fieldId: string, val: any) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
  };

  const isFieldVisible = (field: any) => {
    if (!field.dependsOn) return true;
    const parentValue = values[field.dependsOn.fieldId];
    return String(parentValue) === String(field.dependsOn.value);
  };

  const pickFieldImage = async (fieldId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      updateValue(fieldId, result.assets[0].uri);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedServiceId || !activeTemplate) {
      return Alert.alert("Missing", "Please select a service type.");
    }

    // Amount validation
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return Alert.alert("Validation", "Please enter a valid amount.");
    }

    // Dynamic fields validation
    const payloadValues: Record<string, any> = {};
    for (const field of activeTemplate.fields) {
      if (!isFieldVisible(field)) continue;
      if (field.required) {
        const val = values[field.id];
        if (val === undefined || val === null || (typeof val === "string" && !val.trim()) || (field.type === "number" && isNaN(Number(val)))) {
          return Alert.alert("Validation", `Please fill out the required field: ${field.label}`);
        }
      }
      if (values[field.id] !== undefined) {
        payloadValues[field.label] = values[field.id];
      }
    }

    setSubmitting(true);
    try {
      if (isEditMode && params.id) {
        await formService.updateSubmission(params.id, {
          cost: numAmount,
          dynamicData: payloadValues,
        });
        Alert.alert("Success", "Your request has been updated successfully.");
      } else {
        if (!activeTemplate.requiresApproval) {
          // Bypass Service Request flow and hit General Expenses endpoint directly
          await expenseService.addExpense((user as any)?.truckId || "", {
            price: numAmount,
            remark: `${activeTemplate.name} ${description ? ' - ' + description : ''}`.trim(),
            date: new Date().toISOString(),
            serviceTypeId: selectedServiceId,
            dynamicData: payloadValues,
          });
          Alert.alert("Success", "Request submitted");
        } else {
          const payload: SubmitFormPayload = {
            formData: payloadValues,
            totalCost: numAmount,
            description: description.trim() || undefined,
          };

          await formService.submitForm(selectedServiceId, payload);
          Alert.alert("Success", "Your request has been submitted successfully.");
        }
      }
      
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Access Guard ──────────────────────────────────────────────────
  if (user?.role === "admin") {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#94A3B8" />
        <Text className="text-text-primary font-bold text-xl mt-4 text-center">Access Denied</Text>
        <Text className="text-text-secondary text-sm mt-2 text-center">Only drivers can submit service requests.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-8 bg-primary px-8 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-text-secondary mt-3">Loading services...</Text>
      </SafeAreaView>
    );
  }

  // ── Selected service name for header ──────────────────────────────
  const selectedName = serviceTypes.find(s => s.id === selectedServiceId)?.name;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top","bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm z-50">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-surface rounded-xl items-center justify-center border border-border"
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-text-primary font-bold text-xl">{isEditMode ? "Edit Request" : "New Request"}</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View className="gap-5">
            {/* ─── Service Type Selection ─── */}
            <View className="relative" style={{ zIndex: 110, opacity: isEditMode ? 0.6 : 1 }} pointerEvents={isEditMode ? "none" : "auto"}>
              <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">Service Type *</Text>
              <TouchableOpacity
                onPress={() => setShowTypeMenu(!showTypeMenu)}
                className="bg-white border border-border rounded-xl h-14 px-4 flex-row items-center justify-between shadow-sm"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="documents-outline" size={18} color="#2563EB" />
                  <Text className={`text-base font-bold ${selectedServiceId ? "text-text-primary" : "text-text-secondary"}`}>
                    {selectedName || "Select a service..."}
                  </Text>
                </View>
                <Ionicons name={showTypeMenu ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
              </TouchableOpacity>

              {showTypeMenu && (
                <View className="absolute top-[80px] left-0 right-0 bg-white rounded-2xl border border-border shadow-lg overflow-hidden" style={{ zIndex: 999, elevation: 20 }}>
                  <ScrollView style={{ maxHeight: 250 }}>
                    {serviceTypes.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => { setSelectedServiceId(s.id); setShowTypeMenu(false); }}
                        className={`px-4 py-3.5 border-b border-border/50 flex-row items-center gap-3 ${selectedServiceId === s.id ? "bg-primary-50" : "bg-white"}`}
                      >
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${selectedServiceId === s.id ? "bg-primary" : "bg-surface border border-border"}`}>
                          <Ionicons name="document-text" size={14} color={selectedServiceId === s.id ? "#fff" : "#64748B"} />
                        </View>
                        <Text className={`text-base flex-1 ${selectedServiceId === s.id ? "text-primary font-bold" : "text-text-primary"}`}>{s.name}</Text>
                        {selectedServiceId === s.id && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                      </TouchableOpacity>
                    ))}

                    {serviceTypes.length === 0 && (
                      <View className="px-4 py-6 items-center">
                        <Ionicons name="alert-circle-outline" size={24} color="#94A3B8" />
                        <Text className="text-text-secondary text-sm mt-2">No service types available.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* ─── Dynamic Form Fields ─── */}
            {selectedServiceId ? (
              loadingTemplate ? (
                <View className="py-10 items-center justify-center">
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text className="text-text-secondary text-sm mt-2">Loading form fields...</Text>
                </View>
              ) : activeTemplate ? (
                <View className="gap-5">
                  {/* Separator */}
                  {activeTemplate.fields.length > 0 && (
                    <View className="flex-row items-center gap-3 mt-1">
                      <View className="flex-1 h-px bg-border" />
                      <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase">Form Fields</Text>
                      <View className="flex-1 h-px bg-border" />
                    </View>
                  )}

                  {/* Dynamic fields */}
                  {activeTemplate.fields.map((field, index) => {
                    if (!isFieldVisible(field)) return null;

                    return (
                      <View key={field.id} style={{ zIndex: 100 - index }}>
                        <View className="flex-row items-center gap-1 mb-2 ml-1">
                          <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase">
                            {field.label} {field.required ? "*" : ""}
                          </Text>
                          {field.dependsOn && <Ionicons name="git-branch-outline" size={12} color="#D97706" />}
                        </View>

                        {(field.type === "text" || field.type === "number" || field.type === "date") && (
                          <TextInput
                            value={values[field.id] || ""}
                            onChangeText={(v) => updateValue(field.id, v)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            placeholderTextColor="#94A3B8"
                            keyboardType={field.type === "number" ? "numeric" : "default"}
                            className="bg-white border border-border rounded-xl h-14 px-4 text-base font-medium text-text-primary shadow-sm"
                          />
                        )}

                        {field.type === "boolean" && (
                          <View className="bg-white border border-border rounded-xl h-14 px-4 flex-row items-center justify-between shadow-sm">
                            <Text className="text-text-primary text-base">{values[field.id] ? "Yes" : "No"}</Text>
                            <Switch
                              value={!!values[field.id]}
                              onValueChange={(v) => updateValue(field.id, v)}
                              trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                              thumbColor={values[field.id] ? "#2563EB" : "#94A3B8"}
                            />
                          </View>
                        )}

                        {field.type === "select" && (
                          <View className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 8, gap: 8 }}>
                              {(field.options || []).map(opt => {
                                const isSelected = values[field.id] === opt;
                                return (
                                  <TouchableOpacity
                                    key={opt}
                                    onPress={() => updateValue(field.id, opt)}
                                    className={`px-4 py-2.5 rounded-lg border ${isSelected ? "bg-primary border-primary" : "bg-surface border-border"}`}
                                    activeOpacity={0.8}
                                  >
                                    <Text className={`${isSelected ? "text-white font-bold" : "text-text-primary"}`}>{opt}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}

                        {field.type === "image" && (
                          <TouchableOpacity
                            onPress={() => pickFieldImage(field.id)}
                            className="bg-white border border-border border-dashed rounded-xl h-24 items-center justify-center shadow-sm"
                          >
                            {values[field.id] ? (
                              <View className="items-center">
                                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                                <Text className="text-success-600 font-bold mt-1">Image Attached</Text>
                              </View>
                            ) : (
                              <View className="items-center">
                                <Ionicons name="cloud-upload-outline" size={24} color="#94A3B8" />
                                <Text className="text-text-secondary text-sm mt-1">Tap to upload {field.label.toLowerCase()}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}

                  {/* Description - optional */}
                  <View>
                    <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">Description (Optional)</Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Provide additional details..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      textAlignVertical="top"
                      className="bg-white border border-border rounded-xl p-4 min-h-[80px] text-base text-text-primary shadow-sm"
                    />
                  </View>

                  {/* Total Amount - always shown at the bottom */}
                  <View style={{ zIndex: 90 }}>
                    <Text className="text-text-secondary text-xs font-bold tracking-widest uppercase mb-2 ml-1">Total Cost (ETB) *</Text>
                    <View className="relative">
                      <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                         <Text className="text-text-secondary font-bold text-lg">ETB</Text>
                      </View>
                      <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        className="bg-white border border-border rounded-xl h-14 pl-14 pr-4 text-base font-medium text-text-primary shadow-sm"
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View className="py-10 items-center">
                  <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
                  <Text className="text-danger-600 font-bold mt-2">Failed to load form</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedServiceId(selectedServiceId)}
                    className="mt-3 px-6 py-2 bg-primary-50 rounded-lg border border-primary-100"
                  >
                    <Text className="text-primary font-bold">Retry</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              /* Empty state - no service selected yet */
              <View className="py-12 items-center justify-center opacity-50">
                <Ionicons name="arrow-up-circle-outline" size={48} color="#94A3B8" />
                <Text className="text-text-secondary font-bold text-base mt-3">Select a service type above</Text>
                <Text className="text-text-secondary text-sm mt-1">The form fields will appear here</Text>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Submit Button - only show when form is ready */}
      {selectedServiceId && activeTemplate && !loadingTemplate && (
        <View className="p-5 bg-white border-t border-border shadow-lg z-0">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            className={`h-14 rounded-xl flex-row items-center justify-center shadow-md ${
              submitting ? "bg-primary/70" : "bg-primary"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name={isEditMode ? "update" : "send"} size={20} color="#fff" className="mr-2" />
                <Text className="text-white font-bold text-lg ml-2">{isEditMode ? "Update Request" : "Submit Request"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
