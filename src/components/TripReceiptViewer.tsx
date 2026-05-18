import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { downloadRemoteImage } from "@/src/utils/downloadImage";
import { getValidReceiptPicUrls, hasValidTripReceiptPic } from "@/src/utils/tripReceipt";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type TripReceiptViewerProps = {
  receiptPic?: string | null;
};

export function TripReceiptViewer({ receiptPic }: TripReceiptViewerProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  if (!hasValidTripReceiptPic(receiptPic)) return null;

  const openModal = () => {
    setLoading(true);
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const handleDownload = async () => {
    if (downloading || !receiptPic) return;
    setDownloading(true);
    try {
      await downloadRemoteImage(receiptPic);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not download image.";
      Alert.alert("Download failed", message);
    } finally {
      setDownloading(false);
    }
  };

  const imageMaxW = SCREEN_W - 32;
  const imageMaxH = SCREEN_H - insets.top - insets.bottom - 80;

  return (
    <>
      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="View trip receipt"
        style={styles.iconBtn}
      >
        <Ionicons name="image-outline" size={20} color="#2563EB" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <View style={styles.fullScreen}>
          <View style={[styles.toolbar, { top: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading || loading}
              style={styles.toolbarBtn}
              accessibilityRole="button"
              accessibilityLabel="Download image"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download-outline" size={30} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.toolbarBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.imageWrap}>
            {loading ? (
              <View style={styles.spinnerOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : null}
            <Image
              source={{ uri: receiptPic }}
              style={{ width: imageMaxW, height: imageMaxH }}
              contentFit="contain"
              transition={200}
              onLoadStart={() => setLoading(true)}
              onLoad={() => setLoading(false)}
              onLoadEnd={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  toolbar: {
    position: "absolute",
    right: 16,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolbarBtn: {
    padding: 4,
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});

type ReceiptPhotosRowProps = {
  receiptPic?: string | string[] | null;
  label?: string;
  /** Header row: icons only, no label border. */
  compact?: boolean;
};

/** One icon per receipt URL — for refuels / requests with multiple photos. */
export function ReceiptPhotosRow({
  receiptPic,
  label = "Receipts",
  compact = false,
}: ReceiptPhotosRowProps) {
  const urls = getValidReceiptPicUrls(receiptPic);
  if (urls.length === 0) return null;

  if (compact) {
    return (
      <View className="flex-row gap-1.5">
        {urls.map((url, index) => (
          <TripReceiptViewer key={`${url}-${index}`} receiptPic={url} />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between pt-2 border-t border-border/30">
      <Text className="text-text-secondary text-xs uppercase font-bold tracking-widest">{label}</Text>
      <View className="flex-row gap-2">
        {urls.map((url, index) => (
          <TripReceiptViewer key={`${url}-${index}`} receiptPic={url} />
        ))}
      </View>
    </View>
  );
}
