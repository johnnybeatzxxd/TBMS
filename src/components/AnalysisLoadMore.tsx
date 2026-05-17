import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface AnalysisLoadMoreProps {
  loadedCount: number;
  totalCount: number;
  loading: boolean;
  onLoadMore: () => void;
}

export const ANALYSIS_PAGE_SIZE = 10;

export function hasMoreAnalysisPages(page: number, total: number, limit = ANALYSIS_PAGE_SIZE) {
  return page * limit < total;
}

export function AnalysisLoadMore({ loadedCount, totalCount, loading, onLoadMore }: AnalysisLoadMoreProps) {
  if (totalCount <= loadedCount) return null;

  return (
    <View className="mt-4 items-center">
      <Text className="text-text-secondary text-xs mb-2">
        Showing {loadedCount} of {totalCount}
      </Text>
      <TouchableOpacity
        onPress={onLoadMore}
        disabled={loading}
        className="bg-primary rounded-xl px-6 py-3 flex-row items-center gap-2"
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-bold text-sm">Load more</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
