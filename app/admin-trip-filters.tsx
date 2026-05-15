import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import type { DateFilterPreset } from "@/src/components/DateFilterBar";
import { companyService } from "@/src/api/services";
import {
  readOpenFiltersDraft,
  writeAppliedFilters,
  clearOpenFiltersDraft,
  type AdminTripFiltersSnapshot,
} from "@/src/utils/adminTripFiltersStorage";

function emptySnapshot(): AdminTripFiltersSnapshot {
  return {
    filterPreset: "all",
    customFromIso: null,
    customToIso: null,
    claimFilter: "All",
    advLoadingSite: "",
    advDestinationSite: "",
    advAmount: "",
    advRoadExpence: "",
    advVolume: "",
    advApproved: "",
    advCompanyId: "",
  };
}

export default function AdminTripFiltersScreen() {
  const { paymentMethod } = useLocalSearchParams<{ paymentMethod?: string }>();
  const pm: "CASH" | "CREDIT" = paymentMethod === "CREDIT" ? "CREDIT" : "CASH";

  const [loadingDraft, setLoadingDraft] = useState(true);
  const [filterPreset, setFilterPreset] = useState<DateFilterPreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [claimFilter, setClaimFilter] = useState<"All" | "Claimed" | "Unclaimed">("All");
  const [advLoadingSite, setAdvLoadingSite] = useState("");
  const [advDestinationSite, setAdvDestinationSite] = useState("");
  const [advAmount, setAdvAmount] = useState("");
  const [advRoadExpence, setAdvRoadExpence] = useState("");
  const [advVolume, setAdvVolume] = useState<"" | "MCUBE10" | "MCUBE16">("");
  const [advApproved, setAdvApproved] = useState<"" | "PENDING" | "APPROVED" | "DECLINED">("");
  const [advCompanyId, setAdvCompanyId] = useState("");
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await readOpenFiltersDraft();
      if (cancelled) return;
      if (draft) {
        setFilterPreset(draft.filterPreset ?? "all");
        setCustomFrom(draft.customFromIso ? new Date(draft.customFromIso) : null);
        setCustomTo(draft.customToIso ? new Date(draft.customToIso) : null);
        setClaimFilter(draft.claimFilter ?? "All");
        setAdvLoadingSite(draft.advLoadingSite ?? "");
        setAdvDestinationSite(draft.advDestinationSite ?? "");
        setAdvAmount(draft.advAmount ?? "");
        setAdvRoadExpence(draft.advRoadExpence ?? "");
        setAdvVolume((draft.advVolume as "" | "MCUBE10" | "MCUBE16") || "");
        setAdvApproved((draft.advApproved as AdminTripFiltersSnapshot["advApproved"]) || "");
        setAdvCompanyId(draft.advCompanyId ?? "");
      } else {
        const d = emptySnapshot();
        setFilterPreset(d.filterPreset);
        setClaimFilter(d.claimFilter);
      }
      setLoadingDraft(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const list = await companyService.getCompanies({ page: 1, perPage: 100 });
      setCompanies(list.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pm === "CREDIT" && companyPickerOpen) void loadCompanies();
  }, [pm, companyPickerOpen, loadCompanies]);

  const toSnapshot = (): AdminTripFiltersSnapshot => ({
    filterPreset,
    customFromIso: customFrom ? customFrom.toISOString() : null,
    customToIso: customTo ? customTo.toISOString() : null,
    claimFilter,
    advLoadingSite,
    advDestinationSite,
    advAmount,
    advRoadExpence,
    advVolume,
    advApproved,
    advCompanyId,
  });

  const handleApply = async () => {
    await writeAppliedFilters(toSnapshot());
    await clearOpenFiltersDraft();
    router.back();
  };

  const handleClear = () => {
    const d = emptySnapshot();
    setFilterPreset(d.filterPreset);
    setCustomFrom(null);
    setCustomTo(null);
    setClaimFilter(d.claimFilter);
    setAdvLoadingSite("");
    setAdvDestinationSite("");
    setAdvAmount("");
    setAdvRoadExpence("");
    setAdvVolume("");
    setAdvApproved("");
    setAdvCompanyId("");
    setCompanyPickerOpen(false);
  };

  if (loadingDraft) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-3 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-2"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-lg">Trip filters</Text>
          <Text className="text-text-secondary text-xs">Edit filters, then tap Apply</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 mb-4">
          <Text className="text-[10px] font-bold text-primary uppercase tracking-widest">Payment method</Text>
          <Text className="text-sm font-bold text-primary mt-0.5">
            {pm} (matches Cash / Credit tab on Trips)
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
            Custom date range
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              className="flex-1 flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-border"
            >
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text className="ml-2 text-sm text-text-primary flex-1" numberOfLines={1}>
                {customFrom ? customFrom.toLocaleDateString() : "Start"}
              </Text>
            </TouchableOpacity>
            <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              className="flex-1 flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-border"
            >
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text className="ml-2 text-sm text-text-primary flex-1" numberOfLines={1}>
                {customTo ? customTo.toLocaleDateString() : "End"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
            Loading site
          </Text>
          <TextInput
            value={advLoadingSite}
            onChangeText={setAdvLoadingSite}
            placeholder="Filter by loading site"
            placeholderTextColor="#94A3B8"
            className="bg-white rounded-xl px-3 py-2.5 border border-border text-text-primary text-sm"
          />
        </View>

        <View className="mb-4">
          <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
            Destination site
          </Text>
          <TextInput
            value={advDestinationSite}
            onChangeText={setAdvDestinationSite}
            placeholder="Filter by destination"
            placeholderTextColor="#94A3B8"
            className="bg-white rounded-xl px-3 py-2.5 border border-border text-text-primary text-sm"
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Amount</Text>
            <TextInput
              value={advAmount}
              onChangeText={(t) => setAdvAmount(t.replace(/[^0-9.]/g, ""))}
              placeholder="Exact"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              className="bg-white rounded-xl px-3 py-2.5 border border-border text-text-primary text-sm"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
              Road expense
            </Text>
            <TextInput
              value={advRoadExpence}
              onChangeText={(t) => setAdvRoadExpence(t.replace(/[^0-9.]/g, ""))}
              placeholder="Exact"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              className="bg-white rounded-xl px-3 py-2.5 border border-border text-text-primary text-sm"
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Volume</Text>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { key: "" as const, label: "Any" },
                { key: "MCUBE10" as const, label: "10 M³" },
                { key: "MCUBE16" as const, label: "16 M³" },
              ] as const
            ).map((opt) => (
              <TouchableOpacity
                key={opt.key || "any"}
                onPress={() => setAdvVolume(opt.key)}
                className={`px-3 py-1.5 rounded-full border ${
                  advVolume === opt.key ? "bg-primary border-primary" : "bg-white border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${advVolume === opt.key ? "text-white" : "text-text-secondary"}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {pm === "CASH" && (
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
              Approval status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  { key: "" as const, label: "Any" },
                  { key: "PENDING" as const, label: "Pending" },
                  { key: "APPROVED" as const, label: "Approved" },
                  { key: "DECLINED" as const, label: "Declined" },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key || "any"}
                  onPress={() => setAdvApproved(opt.key)}
                  className={`px-3 py-1.5 rounded-full border ${
                    advApproved === opt.key ? "bg-primary border-primary" : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${advApproved === opt.key ? "text-white" : "text-text-secondary"}`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {pm === "CREDIT" && (
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">
              Claim status
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(["All", "Claimed", "Unclaimed"] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setClaimFilter(status)}
                  className={`px-3 py-1.5 rounded-full border ${
                    claimFilter === status ? "bg-primary border-primary" : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${claimFilter === status ? "text-white" : "text-text-secondary"}`}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {pm === "CREDIT" && (
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Company</Text>
            <TouchableOpacity
              onPress={() => setCompanyPickerOpen((o) => !o)}
              className="flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-border"
              activeOpacity={0.75}
            >
              <Ionicons name="business-outline" size={16} color="#2563EB" />
              <Text className="flex-1 ml-2 text-sm text-text-primary font-medium" numberOfLines={1}>
                {!advCompanyId
                  ? "All companies"
                  : companies.find((c) => c.id === advCompanyId)?.name || "Select company"}
              </Text>
              {companiesLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Ionicons name={companyPickerOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748B" />
              )}
            </TouchableOpacity>
            {companyPickerOpen && (
              <View className="mt-2 max-h-48 border border-border rounded-xl bg-white overflow-hidden">
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  <TouchableOpacity
                    onPress={() => {
                      setAdvCompanyId("");
                      setCompanyPickerOpen(false);
                    }}
                    className="px-4 py-3 border-b border-border/60"
                  >
                    <Text className="text-text-secondary text-sm font-semibold">All companies</Text>
                  </TouchableOpacity>
                  {companies.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setAdvCompanyId(c.id);
                        setCompanyPickerOpen(false);
                      }}
                      className={`px-4 py-3 border-b border-border/60 ${advCompanyId === c.id ? "bg-primary-50" : ""}`}
                    >
                      <Text className="text-text-primary text-sm font-medium">{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View className="px-4 pb-4 pt-2 bg-white border-t border-border flex-row gap-3">
        <TouchableOpacity
          onPress={handleClear}
          className="flex-1 py-3 rounded-xl border border-border items-center justify-center bg-surface"
          activeOpacity={0.85}
        >
          <Text className="text-text-secondary font-bold text-sm">Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleApply}
          className="flex-1 py-3 rounded-xl bg-primary items-center justify-center border border-primary-600"
          activeOpacity={0.85}
        >
          <Text className="text-white font-bold text-sm">Apply</Text>
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
}
