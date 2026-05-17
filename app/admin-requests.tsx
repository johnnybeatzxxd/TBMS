import { formService, truckService } from "@/src/api/services";
import { DateFilterPreset } from "@/src/components/DateFilterBar";
import { useAuthStore, useCacheStore } from "@/src/store";
import { FormSubmission } from "@/src/types/form.types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, SectionList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getRelativeDateLabel = (dateStr: string) => {
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;

  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return "Invalid Date";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const formatCurrency = (n?: number) => n ? n.toLocaleString("en-US") : "0";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "APPROVED":
      return (
        <View className="bg-success-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-success-200">
          <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
          <Text className="text-success-700 text-[10px] font-bold uppercase tracking-wider">Approved</Text>
        </View>
      );
    case "DECLINED":
      return (
        <View className="bg-danger-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-danger-200">
          <Ionicons name="close-circle" size={12} color="#DC2626" />
          <Text className="text-danger-700 text-[10px] font-bold uppercase tracking-wider">Declined</Text>
        </View>
      );
    case "PROCEED":
      return (
        <View className="bg-blue-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-blue-200">
          <Ionicons name="arrow-forward-circle" size={12} color="#2563EB" />
          <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">Proceed</Text>
        </View>
      );
    case "COMPLETED":
      return (
        <View className="bg-indigo-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-indigo-200">
          <Ionicons name="checkmark-done" size={12} color="#6366F1" />
          <Text className="text-indigo-700 text-[10px] font-bold uppercase tracking-wider">Completed</Text>
        </View>
      );
    default:
      return (
        <View className="bg-amber-100 px-2 py-0.5 rounded flex-row items-center gap-1 border border-amber-200">
          <Ionicons name="time" size={12} color="#D97706" />
          <Text className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">Pending</Text>
        </View>
      );
  }
};

const RequestCard = ({ req, isManager, isDriver, onStatusUpdate }: { req: FormSubmission, isManager: boolean, isDriver: boolean, onStatusUpdate: (id: string, action: string) => void }) => {
  const [expanded, setExpanded] = useState(false);

  // Filter out empty values and render dynamic fields
  const filledValues = Object.entries(req.values || {}).filter(([_, v]) => v !== undefined && v !== null && v !== "");
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-border mt-3 overflow-hidden shadow-sm"
    >
      {/* Title / Type Row */}
      <View className="flex-row items-center justify-between p-4 bg-white">
        <View className="flex-row items-center flex-1 pr-4">
          <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center mr-3">
            <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-0.5">
              {req.truckPlate || "Unknown Truck"}
            </Text>
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
              {req.templateName === "Unknown" && req.tag ? req.tag : req.templateName}
            </Text>
            {isManager && req.driverName && (
              <Text className="text-primary-600 text-[10px] mt-0.5">{req.driverName}</Text>
            )}
          </View>
        </View>
        <StatusBadge status={req.status} />
      </View>

      {/* Expanded Actions & Info */}
      {expanded && (
        <View className="px-4 pb-4 bg-surface/50 border-t border-border pt-4 gap-4">

          {/* Amount */}
          {req.amount > 0 && (
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-1">Total Amount</Text>
              <Text className="text-text-primary font-bold text-xl text-danger-600">${formatCurrency(req.amount)}</Text>
            </View>
          )}

          {/* Description / Remark */}
          {req.description ? (
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-1">Description</Text>
              <Text className="text-text-primary text-sm leading-5">{req.description}</Text>
            </View>
          ) : null}

          {/* Date */}
          {req.date && (
            <View>
              <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-1">Date</Text>
              <Text className="text-text-primary text-sm">{new Date(req.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</Text>
            </View>
          )}

          {/* Approval Type */}
          <View>
            <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-1">Approval Type</Text>
            <Text className="text-text-primary text-sm font-medium">{req.requiresApproval ? "Requires Admin Approval" : "Auto-Approved"}</Text>
          </View>

          {/* Render dynamic form values */}
          {filledValues.length > 0 && (
            <View className="bg-white border border-border rounded-xl p-3 gap-3">
              <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Form Details</Text>
              {filledValues.map(([fieldLabel, value], index) => (
                <View key={fieldLabel} className={`flex-row justify-between ${index > 0 ? "border-t border-border/50 pt-2" : ""}`}>
                  <Text className="text-text-secondary text-sm">{fieldLabel}</Text>
                  <Text className="text-text-primary text-sm font-medium">{String(value)}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Manager Actions — PENDING */}
          {isManager && req.status === "PENDING" && (
            <View className="flex-row gap-3 mt-2 border-t border-border pt-4">
              {req.requiresApproval ? (
                /* requiresApproval === true → show Proceed + Decline */
                <>
                  <TouchableOpacity
                    className="flex-1 bg-primary py-2.5 rounded-xl items-center"
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(req.id, "PROCEED");
                    }}
                  >
                    <Text className="text-white font-bold text-sm">Proceed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-[0.7] bg-white border border-danger-500 py-2.5 rounded-xl items-center"
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(req.id, "DECLINED");
                    }}
                  >
                    <Text className="text-danger-600 font-bold text-sm">Decline</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* requiresApproval === false → show Approve + Decline */
                <>
                  <TouchableOpacity
                    className="flex-1 bg-success-500 py-2.5 rounded-xl items-center"
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(req.id, "APPROVED");
                    }}
                  >
                    <Text className="text-white font-bold text-sm">Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-[0.7] bg-white border border-danger-500 py-2.5 rounded-xl items-center"
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(req.id, "DECLINED");
                    }}
                  >
                    <Text className="text-danger-600 font-bold text-sm">Decline</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Driver Actions */}
          {isDriver && (req.status === "PENDING" || req.status === "PROCEED") && (
            <View className="flex-row gap-3 mt-2 border-t border-border pt-4">
              <TouchableOpacity
                className="flex-1 bg-white border border-primary py-2.5 rounded-xl items-center"
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/add-request?id=${req.id}`);
                }}
              >
                <Text className="text-primary font-bold text-sm">Edit Request</Text>
              </TouchableOpacity>

              {req.status === "PROCEED" && (
                <TouchableOpacity
                  className="flex-1 bg-indigo-500 py-2.5 rounded-xl items-center"
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(req.id, "COMPLETED");
                  }}
                >
                  <Text className="text-white font-bold text-sm">Mark Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Manager Action — COMPLETED: Final Approve */}
          {isManager && req.status === "COMPLETED" && (
            <View className="mt-2 border-t border-border pt-4">
              <TouchableOpacity
                className="bg-success-500 py-2.5 rounded-xl items-center"
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(req.id, "APPROVED");
                }}
              >
                <Text className="text-white font-bold text-sm">Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row items-center justify-between border-t border-border pt-3 mt-1">
            <Text className="text-text-secondary text-xs">Created: {new Date(req.createdAt).toLocaleDateString()}</Text>
            <Text className="text-text-secondary text-xs">Updated: {new Date(req.updatedAt).toLocaleDateString()}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function RequestsScreen() {
  const { user } = useAuthStore();
  const isManager = user?.role === "manager" || user?.role === "admin";
  const { requests: cachedRequests, setRequests: setCachedRequests } = useCacheStore();

  const [loading, setLoading] = useState(cachedRequests.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<FormSubmission[]>(cachedRequests);
  const [trucks, setTrucks] = useState<any[]>([{ id: "all", plateNumber: "All Trucks" }]);
  const [selectedTruck, setSelectedTruck] = useState<any>({ id: "all", plateNumber: "All Trucks" });
  const [showTruckMenu, setShowTruckMenu] = useState(false);

  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (isManager) {
      (async () => {
        const res = await truckService.getMyTrucks();
        if ("trucks" in res) {
          setTrucks([{ id: "all", plateNumber: "All Trucks" }, ...res.trucks]);
        }
      })();
    }
  }, [isManager]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};

      // Date filtering
      if (filterPreset !== "all") {
        const now = new Date();
        if (filterPreset === "today") {
          filters.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          filters.endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        } else if (filterPreset === "week") {
          const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
          filters.startDate = weekAgo.toISOString();
          filters.endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        } else if (filterPreset === "month") {
          const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
          filters.startDate = monthAgo.toISOString();
          filters.endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        } else if (filterPreset === "custom" && customFrom && customTo) {
          filters.startDate = customFrom.toISOString();
          filters.endDate = customTo.toISOString();
        }
      }

      // Truck filtering
      if (selectedTruck.id !== "all") {
        filters.truckId = selectedTruck.id;
      }

      // Status filtering
      if (selectedStatuses.length > 0) {
        filters.status = selectedStatuses;
      }

      const promises: Promise<any>[] = [
        formService.getFormSubmissions(filters),
      ];
      if (isManager) {
        promises.push(truckService.getMyTrucks().catch(() => ({ trucks: [] })));
      }

      const [res, trucksRes] = await Promise.all(promises);

      // Get unique template IDs from submissions and fetch full details for each
      const uniqueTemplateIds = [...new Set(
        res.submissions.map((s: FormSubmission) => s.templateId).filter(Boolean)
      )] as string[];

      const templateResults = await Promise.all(
        uniqueTemplateIds.map((id: string) => formService.getFormTemplate(id).catch(() => null))
      );

      const templatesDict: Record<string, { name: string; requiresApproval: boolean }> = {};
      templateResults.forEach((t: any) => {
        if (t) templatesDict[t.id] = { name: t.name, requiresApproval: t.requiresApproval };
      });

      const trucksDict: Record<string, string> = {};
      if (trucksRes && trucksRes.trucks) {
        trucksRes.trucks.forEach((t: any) => trucksDict[t.id] = t.plateNumber);
      }

      let processed = res.submissions.map((s: FormSubmission) => {
        // Look up template info
        const tpl = templatesDict[s.templateId];
        if (s.templateName === "Unknown" && tpl) {
          s.templateName = tpl.name;
        }
        // Always apply requiresApproval from template if available
        if (tpl) {
          s.requiresApproval = tpl.requiresApproval;
        }
        if (!s.truckPlate || s.truckPlate === "Unknown" || s.truckPlate.trim() === "") {
          if (isManager && trucksDict[s.truckId]) {
            s.truckPlate = trucksDict[s.truckId];
          } else if (!isManager) {
            s.truckPlate = "My Truck";
          }
        }
        return s;
      });

      setRequests(processed);

      // Update cache only if there are no filters applied
      if (!isManager && filterPreset === "all" && selectedStatuses.length === 0) {
        setCachedRequests(res.submissions);
      } else if (isManager && selectedTruck.id === "all" && filterPreset === "all" && selectedStatuses.length === 0) {
        setCachedRequests(res.submissions);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterPreset, customFrom, customTo, selectedTruck, selectedStatuses, user, isManager]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      const { useAuthStore } = require("@/src/store/authStore");
      if (!useAuthStore.getState().isAuthenticated) return;
      loadRequests();
    }, [loadRequests])
  );

  const isDriver = user?.role === "driver";

  const handleStatusUpdate = async (id: string, action: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action as any } : r));
    try {
      switch (action) {
        case "PROCEED":
          await formService.markProceed(id);
          break;
        case "COMPLETED":
          await formService.markCompleted(id);
          break;
        case "APPROVED":
          await formService.markApproved(id);
          break;
        case "DECLINED":
          console.log(`[Requests] Calling markDeclined for ${id}`);
          await formService.markDeclined(id);
          break;
      }
    } catch (e: any) {
      console.error("Failed to update status", e);
      loadRequests();
    }
  };

  const groupedData = useMemo(() => {
    const grouped = requests.reduce((acc, req) => {
      const date = req.createdAt.split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(req);
      return acc;
    }, {} as Record<string, FormSubmission[]>);

    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, reqs]) => ({
        dateStr: date,
        title: getRelativeDateLabel(date),
        data: reqs,
      }));
  }, [requests]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="bg-primary z-50 elevation-10 shadow-sm relative pt-4 pb-20 px-5 rounded-b-[40px]">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold tracking-wide">Requests</Text>
            <Text className="text-white/70 text-sm mt-0.5">
              {isManager ? "Manage driver requests" : "Track your requests"}
            </Text>
          </View>

          {isManager && (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setShowAdvancedFilters(true)}
                className="w-10 h-10 bg-white/20 border border-white/30 rounded-full items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="options" size={20} color="#fff" />
                {selectedStatuses.length > 0 && (
                  <View className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full items-center justify-center border border-white">
                    <Text className="text-white text-[8px] font-black">{selectedStatuses.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View className="relative z-50">
                <TouchableOpacity
                  onPress={() => setShowTruckMenu(!showTruckMenu)}
                  className="flex-row items-center bg-white/20 border border-white/30 rounded-full px-4 py-2 gap-2"
                  activeOpacity={0.8}
                >
                  <Ionicons name="car-sport" size={16} color="#fff" />
                  <Text className="text-white font-medium text-sm">{selectedTruck.plateNumber}</Text>
                  <Ionicons name={showTruckMenu ? "chevron-up" : "chevron-down"} size={16} color="#fff" />
                </TouchableOpacity>

                {showTruckMenu && (
                  <View className="absolute right-0 top-12 bg-white rounded-2xl border border-border shadow-lg overflow-hidden min-w-[200px] z-[999] elevation-20">
                    <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                      {trucks.map((truck) => (
                        <TouchableOpacity
                          key={truck.id}
                          onPress={() => {
                            setSelectedTruck(truck);
                            setShowTruckMenu(false);
                          }}
                          className={`px-4 py-3 border-b border-border/50 flex-row items-center gap-3 ${selectedTruck.id === truck.id ? "bg-primary-50" : "bg-white"
                            }`}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={truck.id === "all" ? "apps-outline" : "car-sport-outline"}
                            size={18}
                            color={selectedTruck.id === truck.id ? "#2563EB" : "#64748B"}
                          />
                          <Text className={`text-sm ${selectedTruck.id === truck.id ? "text-primary font-bold" : "text-text-primary"}`}>
                            {truck.plateNumber}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Stats Summary Bubble */}
        <View className="absolute -bottom-8 left-5 right-5 bg-white rounded-3xl border border-border shadow-sm p-4 flex-row justify-between items-center z-10">
          <View className="items-center flex-1">
            <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-1">Total</Text>
            <Text className="text-text-primary font-black text-xl">{requests.length}</Text>
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="items-center flex-1">
            <Text className="text-amber-500 text-[10px] font-bold tracking-widest uppercase mb-1">Pending</Text>
            <Text className="text-text-primary font-black text-xl">{requests.filter(r => r.status === "PENDING").length}</Text>
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="items-center flex-1">
            <Text className="text-success-500 text-[10px] font-bold tracking-widest uppercase mb-1">Approved</Text>
            <Text className="text-text-primary font-black text-xl">{requests.filter(r => r.status === "APPROVED").length}</Text>
          </View>
        </View>
      </View>

      {/* Header Spacer for Stats Bubble */}
      <View className="mt-12" />

      {/* Advanced Filter Modal */}
      <Modal visible={showAdvancedFilters} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-border shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
              <Text className="text-text-primary font-bold text-lg">Filters</Text>
              <TouchableOpacity onPress={() => setShowAdvancedFilters(false)} className="w-8 h-8 bg-surface rounded-full items-center justify-center">
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4 max-h-[450px]">
              <View className="gap-6">
                {/* Status Selection */}
                <View>
                  <Text className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Status</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["PENDING", "PROCEED", "COMPLETED", "APPROVED", "DECLINED"].map((status) => {
                      const isSelected = selectedStatuses.includes(status);
                      return (
                        <TouchableOpacity
                          key={status}
                          onPress={() => {
                            setSelectedStatuses(prev =>
                              prev.includes(status)
                                ? prev.filter(s => s !== status)
                                : [...prev, status]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg border ${isSelected ? "bg-primary-50 border-primary" : "bg-surface border-border"
                            }`}
                        >
                          <Text className={`text-[11px] font-bold ${isSelected ? "text-primary" : "text-text-secondary"}`}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Date Presets */}
                <View>
                  <Text className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Time Range</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["all", "today", "week", "month", "custom"].map((preset) => {
                      const isSelected = filterPreset === preset;
                      return (
                        <TouchableOpacity
                          key={preset}
                          onPress={() => setFilterPreset(preset as any)}
                          className={`px-3 py-1.5 rounded-lg border ${isSelected ? "bg-primary-50 border-primary" : "bg-surface border-border"
                            }`}
                        >
                          <Text className={`text-[11px] font-bold capitalize ${isSelected ? "text-primary" : "text-text-secondary"}`}>
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Custom Date Inputs */}
                {filterPreset === "custom" && (
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setShowFromPicker(true)}
                      className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border"
                    >
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <Text className="ml-2 text-xs text-text-primary">
                        {customFrom ? customFrom.toLocaleDateString() : "Start Date"}
                      </Text>
                    </TouchableOpacity>
                    <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                    <TouchableOpacity
                      onPress={() => setShowToPicker(true)}
                      className="flex-1 flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border"
                    >
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <Text className="ml-2 text-xs text-text-primary">
                        {customTo ? customTo.toLocaleDateString() : "End Date"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View className="p-5 border-t border-border/50 bg-surface flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedStatuses([]);
                  setFilterPreset("all");
                  setCustomFrom(null);
                  setCustomTo(null);
                }}
                className="flex-1 bg-white border border-border rounded-xl items-center justify-center py-3"
              >
                <Text className="text-text-secondary font-bold text-sm tracking-wide">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowAdvancedFilters(false);
                  loadRequests();
                }}
                className="flex-1 bg-primary rounded-xl items-center justify-center py-3 shadow-sm border border-primary-600"
              >
                <Text className="text-white font-bold text-sm tracking-wide">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={customFrom || new Date()}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowFromPicker(false);
              if (d) setCustomFrom(d);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={customTo || new Date()}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowToPicker(false);
              if (d) setCustomTo(d);
            }}
          />
        )}
      </Modal>

      {loading && requests.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <SectionList
          className="flex-1 px-4 z-0 elevation-0"
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          sections={groupedData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-10 mt-10">
              <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="clipboard-check-outline" size={40} color="#2563EB" opacity={0.5} />
              </View>
              <Text className="text-text-primary font-bold text-lg mb-2">No Requests Found</Text>
              <Text className="text-text-secondary text-center px-6">
                No service requests match the selected filters. Tap the + icon below to create one.
              </Text>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View className="mt-6 mb-2 flex-row items-center gap-3">
              <Text className="text-text-primary font-bold text-sm tracking-wide">{title}</Text>
              <View className="flex-1 h-px bg-border/80" />
            </View>
          )}
          renderItem={({ item }) => (
            <RequestCard req={item} isManager={isManager} isDriver={isDriver} onStatusUpdate={handleStatusUpdate} />
          )}
        />
      )}

      {/* Add Request FAB - Only for Drivers */}
      {!isManager && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/add-request")}
          className="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-lg border-4 border-white z-50 elevation-10"
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
