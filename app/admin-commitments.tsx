import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { financialCommitmentService } from "@/src/api/services";
import {
  FinancialCommitment,
  FinancialCommitmentSchedule,
  TotalExpenseBreakdown,
} from "@/src/types";
import { useActionStore } from "@/src/store";

// Helper to format currency
const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return "$0.00";
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to style each term schedule uniquely
const getScheduleStyles = (schedule: FinancialCommitmentSchedule) => {
  switch (schedule) {
    case "DAILY":
      return { border: "border-l-[6px] border-l-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "WEEKLY":
      return { border: "border-l-[6px] border-l-blue-500", text: "text-blue-700", bg: "bg-blue-50" };
    case "MONTHLY":
      return { border: "border-l-[6px] border-l-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" };
    case "QUARTERLY":
      return { border: "border-l-[6px] border-l-purple-500", text: "text-purple-700", bg: "bg-purple-50" };
    case "YEARLY":
      return { border: "border-l-[6px] border-l-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
    default:
      return { border: "border-l-[6px] border-l-slate-500", text: "text-slate-700", bg: "bg-slate-50" };
  }
};

// Commitment Card Component
const CommitmentCard = ({
  item,
  onEdit,
  onDelete,
  numTrucks,
}: {
  item: FinancialCommitment;
  onEdit: (item: FinancialCommitment) => void;
  onDelete: (id: string) => void;
  numTrucks: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isDeleting = useActionStore((state) => !!state.pendingActions[`delete_commitment_${item.id}`]);

  const output = item.output;
  const progressRatio = output && output.totalAmount > 0 ? output.amountPaid / output.totalAmount : 0;
  const percentStr = output ? `${Math.round(progressRatio * 100)}%` : "0%";
  
  const scheduleStyles = getScheduleStyles(item.schedule);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
      className={`bg-white p-4 rounded-2xl mb-4 border border-border shadow-sm ${scheduleStyles.border}`}
    >
      {/* Card Header Info */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center mb-1.5 flex-wrap gap-1.5">
            <View className={`px-2.5 py-1 rounded-lg border border-slate-200 ${scheduleStyles.bg}`}>
              <Text className={`text-[10px] font-bold tracking-wider ${scheduleStyles.text}`}>
                {item.schedule}
              </Text>
            </View>
            {item.schedule === "CUSTOM" && (
              <View className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Text className="text-[10px] font-bold text-amber-700 tracking-wider">
                  {item.daysInterval} DAYS
                </Text>
              </View>
            )}
          </View>
          <Text className="text-text-primary font-bold text-base" numberOfLines={1}>
            {item.description}
          </Text>
          <Text className="text-text-secondary text-xs mt-1">
            Starts: {item.startingDate ? item.startingDate.split("T")[0] : "N/A"}
          </Text>
        </View>

        <View className="items-end justify-center">
          <Text className="text-text-primary font-extrabold text-base">
            {formatCurrency(item.regularPaymentAmount)}
          </Text>
          <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-widest mt-0.5">
            Per Term
          </Text>
        </View>
      </View>

      {/* Progress Section */}
      {output && (
        <View className="mt-4 pt-3 border-t border-slate-100">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-xs text-text-secondary">
              Payments: {Number(output.paymentsMade).toFixed(2)} / {item.totalNumberOfPayments || "∞"}
            </Text>
            <Text className="text-xs font-bold text-primary">
              {percentStr} Paid
            </Text>
          </View>
          <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` }}
            />
          </View>
        </View>
      )}

      {/* Expanded Details Section */}
      {expanded && (
        <View className="mt-4 pt-4 border-t border-border-light">
          {output && (
            <View className="bg-surface rounded-2xl p-4 border border-slate-100 mb-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">
                  End Date
                </Text>
                <Text className="text-text-primary text-sm font-semibold">
                  {output.endDate ? output.endDate.split("T")[0] : "N/A"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-200/50">
                <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">
                  Paid to Date
                </Text>
                <Text className="text-success-600 text-sm font-bold">
                  {formatCurrency(output.amountPaid)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-200/50">
                <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">
                  Outstanding
                </Text>
                <Text className="text-danger-600 text-sm font-bold">
                  {formatCurrency(output.outstandingAmount)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-200/50">
                <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">
                  Total Obligation
                </Text>
                <Text className="text-text-primary text-sm font-bold">
                  {formatCurrency(output.totalAmount)}
                </Text>
              </View>

              {/* Term Projection Outlays List */}
              <View className="pt-3 border-t border-slate-200/50">
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-text-secondary text-[10px] uppercase font-bold tracking-widest">
                    Term Outflow Projection
                  </Text>
                  {numTrucks > 0 && (
                    <Text className="text-slate-400 text-[9px] uppercase font-bold">
                      Cost per Truck ({numTrucks} Active)
                    </Text>
                  )}
                </View>
                <View className="gap-2">
                  {[
                    { label: "Daily", key: "daily" },
                    { label: "Weekly", key: "weekly" },
                    { label: "Monthly", key: "monthly" },
                    { label: "Quarterly", key: "quarterly" },
                    { label: "Yearly", key: "yearly" },
                  ].map((period) => {
                    const totalVal = output.expensesBreakdown[period.key as keyof typeof output.expensesBreakdown] || 0;
                    const perTruckVal = numTrucks > 0 ? totalVal / numTrucks : totalVal;
                    return (
                      <View key={period.key} className="flex-row items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Text className="text-xs font-semibold text-slate-600">{period.label}</Text>
                        <View className="flex-row items-center gap-3">
                          <Text className="text-xs font-bold text-slate-800">{formatCurrency(totalVal)}</Text>
                          {numTrucks > 0 && (
                            <Text className="text-xs font-bold text-emerald-600 min-w-[70px] text-right">
                              {formatCurrency(perTruckVal)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Action Row */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="flex-1 flex-row items-center justify-center py-2.5 bg-sky-50 rounded-xl border border-sky-100"
            >
              <Ionicons name="pencil" size={14} color="#0EA5E9" style={{ marginRight: 6 }} />
              <Text className="text-sky-600 font-bold text-xs">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              disabled={isDeleting}
              className="flex-1 flex-row items-center justify-center py-2.5 bg-rose-50 rounded-xl border border-rose-100"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#E11D48" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={14} color="#E11D48" style={{ marginRight: 6 }} />
                  <Text className="text-rose-600 font-bold text-xs">Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AdminCommitmentsScreen() {
  const [commitments, setCommitments] = useState<FinancialCommitment[]>([]);
  const [totals, setTotals] = useState<TotalExpenseBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOutflowProjection, setShowOutflowProjection] = useState(false);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState<FinancialCommitmentSchedule>("MONTHLY");
  const [startingDate, setStartingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [daysInterval, setDaysInterval] = useState("");
  const [regularAmount, setRegularAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [numPayments, setNumPayments] = useState("");
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);

  const { startAction, stopAction } = useActionStore();
  const isSubmitting = useActionStore((state) => !!state.pendingActions["submit_commitment"]);

  const numTrucks = totals && totals.yearly?.perTruck > 0 
    ? Math.round(totals.yearly.total / totals.yearly.perTruck) 
    : 0;

  const totalObligation = commitments.reduce((acc, c) => acc + (c.output?.totalAmount || 0), 0);
  const totalPaid = commitments.reduce((acc, c) => acc + (c.output?.amountPaid || 0), 0);
  const totalOutstanding = commitments.reduce((acc, c) => acc + (c.output?.outstandingAmount || 0), 0);
  const totalProgressRatio = totalObligation > 0 ? totalPaid / totalObligation : 0;
  const totalPercentStr = `${Math.round(totalProgressRatio * 100)}%`;

  const loadData = async () => {
    try {
      const res = await financialCommitmentService.getCommitments();
      setCommitments(res.data || []);
      if (res.totalExpenseBreakdown) {
        setTotals(res.totalExpenseBreakdown);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load commitments");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    const actionKey = `delete_commitment_${id}`;
    if (useActionStore.getState().isActionPending(actionKey)) return;

    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to delete this financial commitment? This will stop recurring calculations immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            startAction(actionKey);
            try {
              await financialCommitmentService.deleteCommitment(id);
              setCommitments((prev) => prev.filter((c) => c.id !== id));
              // Reload total breakdown KPIs
              loadData();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete");
            } finally {
              stopAction(actionKey);
            }
          },
        },
      ]
    );
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setDescription("");
    setSchedule("MONTHLY");
    setStartingDate(new Date());
    setDaysInterval("");
    setRegularAmount("");
    setTotalAmount("");
    setNumPayments("");
    setShowModal(true);
  };

  const handleOpenEdit = (item: FinancialCommitment) => {
    setEditingId(item.id);
    setDescription(item.description);
    setSchedule(item.schedule);
    setStartingDate(item.startingDate ? new Date(item.startingDate) : new Date());
    setDaysInterval(item.daysInterval ? String(item.daysInterval) : "");
    setRegularAmount(item.regularPaymentAmount ? String(item.regularPaymentAmount) : "");
    setTotalAmount(item.totalPaymentAmount ? String(item.totalPaymentAmount) : "");
    setNumPayments(item.totalNumberOfPayments ? String(item.totalNumberOfPayments) : "");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (useActionStore.getState().isActionPending("submit_commitment")) return;

    if (!description.trim()) {
      return Alert.alert("Validation", "Description is required.");
    }
    if (schedule === "CUSTOM" && (!daysInterval.trim() || Number(daysInterval) <= 0)) {
      return Alert.alert("Validation", "A valid positive days interval is required for CUSTOM schedules.");
    }

    // Check that at least one is provided
    const regNum = regularAmount.trim() ? Number(regularAmount) : undefined;
    const totNum = totalAmount.trim() ? Number(totalAmount) : undefined;
    const countNum = numPayments.trim() ? Number(numPayments) : undefined;

    if (regNum === undefined && totNum === undefined && countNum === undefined) {
      return Alert.alert(
        "Validation",
        "Please supply at least one of: Term Payment, Total Amount, or Number of Payments."
      );
    }

    const payload = {
      description: description.trim(),
      schedule,
      startingDate: startingDate.toISOString().split("T")[0],
      daysInterval: schedule === "CUSTOM" ? Number(daysInterval) : undefined,
      regularPaymentAmount: regNum,
      totalPaymentAmount: totNum,
      totalNumberOfPayments: countNum,
    };

    startAction("submit_commitment");
    try {
      if (editingId) {
        await financialCommitmentService.updateCommitment(editingId, payload);
        Alert.alert("Success", "Commitment updated successfully");
      } else {
        await financialCommitmentService.createCommitment(payload);
        Alert.alert("Success", "Commitment created successfully");
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save commitment");
    } finally {
      stopAction("submit_commitment");
    }
  };

  const schedules: FinancialCommitmentSchedule[] = [
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "YEARLY",
    "CUSTOM",
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header Banner */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Ionicons name="wallet-outline" size={26} color="#10B981" />
          <Text className="text-text-primary font-extrabold text-xl ml-2 tracking-tight">
            Financial Commitments
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* KPI Display Metrics */}
        {totals && (
          <View className="mb-6 bg-slate-900 rounded-3xl p-5 shadow-md shadow-slate-300 relative overflow-hidden">
            {/* Visual background accents */}
            <View className="absolute top-[-50px] right-[-50px] w-36 h-36 bg-emerald-500/10 rounded-full" />
            <View className="absolute bottom-[-60px] left-[-30px] w-48 h-48 bg-teal-500/10 rounded-full" />

            {/* Header / Title */}
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <View>
                <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
                  Portfolio Summary
                </Text>
                <Text className="text-white text-lg font-black">
                  Fleet Commitments
                </Text>
              </View>
              <View className="bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <Text className="text-[10px] font-bold text-emerald-400">
                  {commitments.length} Active Pools
                </Text>
              </View>
            </View>

            {/* Part 1: Portfolio Financials */}
            <View className="flex-row justify-between mb-3.5">
              <View className="flex-1 pr-2">
                <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                  Total Obligation
                </Text>
                <Text className="text-white text-sm font-extrabold" numberOfLines={1}>
                  {formatCurrency(totalObligation)}
                </Text>
              </View>

              <View className="w-[1px] bg-slate-800 my-1 mx-2" />

              <View className="flex-1 px-1">
                <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                  Total Paid
                </Text>
                <Text className="text-emerald-400 text-sm font-extrabold" numberOfLines={1}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>

              <View className="w-[1px] bg-slate-800 my-1 mx-2" />

              <View className="flex-1 pl-2">
                <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                  Outstanding
                </Text>
                <Text className="text-rose-400 text-sm font-extrabold" numberOfLines={1}>
                  {formatCurrency(totalOutstanding)}
                </Text>
              </View>
            </View>

            {/* Lifetime Progress Bar */}
            <View className="mb-5 bg-slate-800/50 p-2.5 rounded-2xl border border-slate-800">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Overall Completion Progress
                </Text>
                <Text className="text-[10px] font-bold text-emerald-400">
                  {totalPercentStr}
                </Text>
              </View>
              <View className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <View
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, totalProgressRatio * 100))}%` }}
                />
              </View>
            </View>

            {/* Part 2: Projected Outflow Outlays Grid */}
            <View className="pt-3.5 border-t border-slate-800">
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowOutflowProjection((prev) => !prev)}
                className="flex-row justify-between items-center"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                    Outflow Run Rate Projection
                  </Text>
                  {numTrucks > 0 && (
                    <Text className="text-[9px] font-bold text-emerald-400/80 uppercase mt-1">
                      Divided by {numTrucks} Trucks
                    </Text>
                  )}
                </View>
                <View className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
                  <Ionicons
                    name={showOutflowProjection ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#94A3B8"
                  />
                </View>
              </TouchableOpacity>

              {showOutflowProjection && (
                <View className="gap-2.5 mt-3">
                  {[
                    { label: "Daily Outflow", val: totals.daily },
                    { label: "Weekly Outflow", val: totals.weekly },
                    { label: "Monthly Outflow", val: totals.monthly },
                    { label: "Quarterly Outflow", val: totals.quarterly },
                    { label: "Yearly Outflow", val: totals.yearly },
                  ].map((row, index) => {
                    if (!row.val) return null;
                    return (
                      <View key={index} className="flex-row items-center justify-between py-1 border-b border-slate-800/40">
                        <Text className="text-[11px] font-semibold text-slate-400">{row.label}</Text>
                        <View className="flex-row items-center gap-3">
                          <View className="items-end">
                            <Text className="text-xs font-bold text-white">
                              {formatCurrency(row.val.total)}
                            </Text>
                            <Text className="text-[9px] font-medium text-slate-500">Fleet Total</Text>
                          </View>
                          {numTrucks > 0 && (
                            <View className="items-end min-w-[75px]">
                              <Text className="text-xs font-bold text-emerald-400">
                                {formatCurrency(row.val.perTruck)}
                              </Text>
                              <Text className="text-[9px] font-medium text-slate-500">Per Truck</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Commitment List Section */}
        <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mb-3.5 ml-1">
          Active obligations
        </Text>

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : commitments.length === 0 ? (
          <View className="py-20 items-center justify-center opacity-60 bg-white border border-dashed border-slate-200 rounded-3xl">
            <Ionicons name="card-outline" size={64} color="#94A3B8" />
            <Text className="text-text-secondary text-base mt-4 font-semibold text-center">
              No financial commitments found.
            </Text>
            <Text className="text-slate-400 text-xs mt-1 text-center max-w-[200px]">
              Tap the plus button below to register a recurring commitment.
            </Text>
          </View>
        ) : (
          <View>
            {commitments.map((item, idx) => (
              <CommitmentCard
                key={item.id || idx}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                numTrucks={numTrucks}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB to add a Commitment */}
      <TouchableOpacity
        onPress={handleOpenCreate}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg border border-emerald-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* CREATE / EDIT MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <SafeAreaView className="flex-1 bg-black/60" edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            className="flex-1 justify-end"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="bg-white rounded-t-3xl border-t border-border flex-1 max-h-[85%]">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
                <TouchableOpacity onPress={() => setShowModal(false)} className="p-1">
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text className="text-text-primary font-bold text-lg">
                  {editingId ? "Update Commitment" : "New Commitment"}
                </Text>
                <View className="w-8" />
              </View>

              {/* Form Input fields */}
              <ScrollView className="flex-1 px-5 py-6" contentContainerStyle={{ gap: 20, paddingBottom: 60 }}>
                {/* Description */}
                <View className="gap-1.5">
                  <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                    Description *
                  </Text>
                  <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-border">
                    <Ionicons name="document-text-outline" size={16} color="#94A3B8" />
                    <TextInput
                      className="flex-1 py-3 pl-3 text-base text-text-primary"
                      placeholder="e.g. Office Rent / Insurance"
                      placeholderTextColor="#94A3B8"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>
                </View>

                {/* Starting Date */}
                <View className="gap-1.5">
                  <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                    Starting Date *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3.5 border border-border"
                  >
                    <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                    <Text className="flex-1 ml-3 text-base text-text-primary">
                      {startingDate.toISOString().split("T")[0]}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={startingDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setStartingDate(date);
                    }}
                  />
                )}

                {/* Schedule & DaysInterval */}
                <View className="flex-row gap-4 relative z-50">
                  <View className="flex-1">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1 mb-1.5">
                      Schedule *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowScheduleDropdown(!showScheduleDropdown)}
                      className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3.5 border border-border justify-between"
                    >
                      <Text className="text-base text-text-primary font-medium">{schedule}</Text>
                      <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                    </TouchableOpacity>

                    {showScheduleDropdown && (
                      <View className="absolute top-16 left-0 right-0 bg-white border border-border rounded-xl shadow-lg z-[999] max-h-48 overflow-hidden">
                        <ScrollView nestedScrollEnabled>
                          {schedules.map((s) => (
                            <TouchableOpacity
                              key={s}
                              onPress={() => {
                                setSchedule(s);
                                setShowScheduleDropdown(false);
                              }}
                              className={`px-4 py-3 border-b border-border-light ${
                                schedule === s ? "bg-slate-50" : "bg-white"
                              }`}
                            >
                              <Text
                                className={`text-sm ${
                                  schedule === s ? "text-primary font-bold" : "text-text-primary"
                                }`}
                              >
                                {s}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {schedule === "CUSTOM" && (
                    <View className="flex-1">
                      <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1 mb-1.5">
                        Days Interval *
                      </Text>
                      <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-border">
                        <TextInput
                          className="flex-1 py-3 text-base text-text-primary"
                          placeholder="e.g. 15"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={daysInterval}
                          onChangeText={setDaysInterval}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Info Tip alert box */}
                <View className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex-row gap-2.5 items-start mt-2">
                  <Ionicons name="information-circle" size={20} color="#10B981" style={{ marginTop: 1 }} />
                  <View className="flex-1">
                    <Text className="text-slate-800 font-bold text-xs mb-0.5">Payment Calculation Helpers</Text>
                    <Text className="text-slate-500 text-[11px] leading-4">
                      Provide at least one numerical field below. If you specify two, the server automatically computes the third! Providing all three will validate mathematical consistency.
                    </Text>
                  </View>
                </View>

                {/* Numerical Fields */}
                <View className="gap-4 mt-2">
                  <View className="gap-1.5">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                      Term Payment Amount ($)
                    </Text>
                    <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-border">
                      <Ionicons name="logo-usd" size={16} color="#94A3B8" />
                      <TextInput
                        className="flex-1 py-3 pl-3 text-base text-text-primary"
                        placeholder="e.g. 500.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={regularAmount}
                        onChangeText={setRegularAmount}
                      />
                    </View>
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                      Total Payment Obligation ($)
                    </Text>
                    <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-border">
                      <Ionicons name="logo-usd" size={16} color="#94A3B8" />
                      <TextInput
                        className="flex-1 py-3 pl-3 text-base text-text-primary"
                        placeholder="e.g. 10000.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={totalAmount}
                        onChangeText={setTotalAmount}
                      />
                    </View>
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase ml-1">
                      Total Number of Terms
                    </Text>
                    <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-border">
                      <Ionicons name="list" size={16} color="#94A3B8" />
                      <TextInput
                        className="flex-1 py-3 pl-3 text-base text-text-primary"
                        placeholder="e.g. 20"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={numPayments}
                        onChangeText={setNumPayments}
                      />
                    </View>
                  </View>
                </View>

                {/* Footer Action Buttons */}
                <View className="flex-row gap-4 mt-6">
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 rounded-xl py-4 items-center justify-center border border-border"
                    disabled={isSubmitting}
                  >
                    <Text className="text-text-secondary font-bold text-sm">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-500 rounded-xl py-4 items-center justify-center shadow-sm shadow-emerald-500"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-bold text-sm tracking-wide">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
