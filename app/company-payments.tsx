import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  SectionList,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Company } from "@/src/types";
import { companyService } from "@/src/api/services";
import { useActionStore } from "@/src/store";

type CompanyPayment = {
  id: string;
  amount: number;
  date: string;
  createdAt?: string;
  remark?: string;
};

const getRelativeDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export default function CompanyPaymentsScreen() {
  const { companyId, name } = useLocalSearchParams<{ companyId: string; name?: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isActionPending, startAction, stopAction } = useActionStore();
  const saving = isActionPending("save_payment");
  const [company, setCompany] = useState<Company | null>(null);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date());
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  const loadCompany = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const companies = await companyService.getCompanies();
      const found: any = (companies || []).find((c: any) => c.id === companyId);
      setCompany(found || null);

      // Fetch payments using the dedicated endpoint
      const rawPayments = await companyService.getCompanyPayments(companyId);
      const normalized = rawPayments
        .map((item: any, index: number) => ({
          id: String(item?.id || item?._id || `${index}-${item?.date || "payment"}`),
          amount: Number(item?.amount || 0),
          date: String(item?.date || item?.createdAt || new Date().toISOString()),
          createdAt: item?.createdAt ? String(item.createdAt) : undefined,
          remark: item?.remark ? String(item.remark) : undefined,
        }))
        .sort((a: CompanyPayment, b: CompanyPayment) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPayments(normalized);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load company");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useFocusEffect(
    useCallback(() => {
      loadCompany();
    }, [loadCompany])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompany();
    setRefreshing(false);
  }, [loadCompany]);

  const isPaymentDateInFuture = (d: Date) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return d.getTime() > end.getTime();
  };

  const onPaymentDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowPaymentDatePicker(false);
    if (date) setPaymentDate(date);
  };

  const handleRegisterPayment = async () => {
    const parsedAmount = Number(amount);
    if (!companyId) return;
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }
    if (isPaymentDateInFuture(paymentDate)) {
      Alert.alert("Invalid date", "Payment date cannot be in the future.");
      return;
    }

    startAction("save_payment");
    try {
      const result: any = await companyService.registerPayment({
        companyId,
        amount: parsedAmount,
        date: paymentDate.toISOString(),
      });
      setAmount("");
      setPaymentDate(new Date());
      setShowFormModal(false);

      const newPaymentRaw = result?.payment || result?.newPayment || result?.record || null;
      if (newPaymentRaw) {
        const newPayment: CompanyPayment = {
          id: String(newPaymentRaw?.id || newPaymentRaw?._id || `${Date.now()}`),
          amount: Number(newPaymentRaw?.amount || parsedAmount),
          date: String(newPaymentRaw?.date || newPaymentRaw?.createdAt || new Date().toISOString()),
          createdAt: newPaymentRaw?.createdAt ? String(newPaymentRaw.createdAt) : undefined,
          remark: newPaymentRaw?.remark ? String(newPaymentRaw.remark) : undefined,
        };
        setPayments((prev) => [newPayment, ...prev]);
      } else {
        // If backend does not return payment item, still add optimistic item.
        setPayments((prev) => [
          {
            id: `${Date.now()}`,
            amount: parsedAmount,
            date: paymentDate.toISOString(),
          },
          ...prev,
        ]);
      }

      Alert.alert("Success", "Payment registered successfully.");
      await loadCompany();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to register payment.");
    } finally {
      stopAction("save_payment");
    }
  };

  const groupedPayments = useMemo(() => {
    const grouped = payments.reduce((acc, payment) => {
      const key = new Date(payment.date).toLocaleDateString("en-US");
      if (!acc[key]) acc[key] = [];
      acc[key].push(payment);
      return acc;
    }, {} as Record<string, CompanyPayment[]>);

    return Object.entries(grouped).map(([dateKey, data]) => ({
      title: getRelativeDateLabel(dateKey),
      data,
    }));
  }, [payments]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-4 bg-white border-b border-border shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-3"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-xl" numberOfLines={1}>
            {name || "Company"} Payments
          </Text>
          <Text className="text-text-secondary text-xs">Register received payments</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <SectionList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
          sections={groupedPayments}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListHeaderComponent={
            <View className="bg-white rounded-2xl border border-border p-4 mb-2">
              <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase">Current Balance</Text>
              <Text className="text-amber-600 text-3xl font-bold mt-1">${company?.currentBalance?.toLocaleString() || 0}</Text>

              <Text className="text-text-secondary text-[10px] font-bold tracking-widest uppercase mt-4">Total Balance</Text>
              <Text className="text-text-primary text-2xl font-bold mt-1">${company?.totalBalance?.toLocaleString() || 0}</Text>
            </View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-text-secondary font-bold text-xs tracking-widest uppercase mb-2 mt-4">{title}</Text>
          )}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl border border-border p-4 mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-success-50 border border-success-100 items-center justify-center mr-3">
                    <Ionicons name="cash-outline" size={18} color="#16A34A" />
                  </View>
                  <View>
                    <Text className="text-text-primary font-bold text-base">Payment Received</Text>
                    <Text className="text-text-secondary text-xs mt-0.5">
                      {new Date(item.date).toLocaleDateString("en-US")}
                    </Text>
                  </View>
                </View>
                <Text className="text-success-700 font-bold text-lg">+ ${item.amount.toLocaleString()}</Text>
              </View>
              {!!item.remark && (
                <View className="mt-3 pt-3 border-t border-border/40">
                  <Text className="text-text-secondary text-sm">{item.remark}</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Ionicons name="receipt-outline" size={44} color="#CBD5E1" />
              <Text className="text-text-secondary mt-3 text-sm text-center">
                No payment history yet.{`\n`}Tap + to register the first payment.
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={showFormModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-2xl border border-border p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary font-bold text-lg">Register Payment</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!saving) {
                    setShowPaymentDatePicker(false);
                    setShowFormModal(false);
                  }
                }}
                className="w-8 h-8 rounded-full bg-surface items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-surface rounded-xl px-4 py-3 border border-border text-text-primary"
              keyboardType="decimal-pad"
              placeholder="Payment amount"
              placeholderTextColor="#94A3B8"
              value={amount}
              onChangeText={setAmount}
            />

            <Text className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mt-4 mb-2">
              Payment date
            </Text>
            <TouchableOpacity
              onPress={() => setShowPaymentDatePicker(true)}
              className="bg-surface rounded-xl px-4 py-3 border border-border flex-row items-center gap-2"
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={18} color="#16A34A" />
              <Text className="text-text-primary font-medium flex-1">
                {paymentDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
            {showPaymentDatePicker && (
              <DateTimePicker
                value={paymentDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={onPaymentDateChange}
              />
            )}

            <TouchableOpacity
              onPress={handleRegisterPayment}
              disabled={saving}
              className="mt-3 bg-success py-3 rounded-xl items-center justify-center"
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold">Save Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        onPress={() => {
          setPaymentDate(new Date());
          setAmount("");
          setShowPaymentDatePicker(false);
          setShowFormModal(true);
        }}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg border border-primary-600 elevation-5"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
