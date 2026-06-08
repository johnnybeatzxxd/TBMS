import { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CsvRow, shareRowsAsCSV } from "@/src/utils/export";

type AnalyticsExportButtonProps = {
  buildRows: () => CsvRow[];
  fileName: string;
  color?: string;
};

export function AnalyticsExportButton({
  buildRows,
  fileName,
  color = "#2563EB",
}: AnalyticsExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      await shareRowsAsCSV(buildRows(), `${fileName}_${timestamp}`);
      Alert.alert("Success", "Current analytics data exported successfully.");
    } catch (error: any) {
      Alert.alert("Export Error", error.message || "Failed to export analytics data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleExport}
      disabled={exporting}
      activeOpacity={0.85}
      accessibilityLabel="Export current analytics data"
      className="self-end mb-3 w-10 h-10 rounded-xl border items-center justify-center bg-white shadow-sm"
      style={{ borderColor: `${color}44` }}
    >
      {exporting ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name="download-outline" size={20} color={color} />
      )}
    </TouchableOpacity>
  );
}
