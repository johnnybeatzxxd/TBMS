import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { formatFirebaseError } from "@/src/utils/firebaseUpload";

type UploadStatus = "uploading" | "success" | "failed";

type ImageSlot = {
  id: string;
  localUri: string;
  remoteUrl: string | null;
  status: UploadStatus;
};

type ReceiptImageUploaderProps = {
  maxImages?: number;
  uploadImage: (localUri: string) => Promise<string>;
  onUrlsChange?: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onIncompleteChange?: (incomplete: boolean) => void;
  sectionTitle?: string;
  fieldLabel?: string;
};

const SLOT_SIZE = 96;

let slotCounter = 0;
function nextSlotId() {
  slotCounter += 1;
  return `receipt-${slotCounter}`;
}

export function ReceiptImageUploader({
  maxImages = 1,
  uploadImage,
  onUrlsChange,
  onUploadingChange,
  onIncompleteChange,
  sectionTitle = "Receipt",
  fieldLabel = "Receipt Photo (Optional)",
}: ReceiptImageUploaderProps) {
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [statusMessage, setStatusMessage] = useState("");

  const isUploading = slots.some((s) => s.status === "uploading");
  const hasIncomplete = slots.some((s) => s.status !== "success");
  const uploadedUrls = slots
    .filter((s) => s.status === "success" && s.remoteUrl)
    .map((s) => s.remoteUrl as string);
  const canAddMore = slots.length < maxImages;

  useEffect(() => {
    onUrlsChange?.(uploadedUrls);
  }, [uploadedUrls.join("|"), onUrlsChange]);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  useEffect(() => {
    onIncompleteChange?.(hasIncomplete);
  }, [hasIncomplete, onIncompleteChange]);

  const syncStatusMessage = useCallback((nextSlots: ImageSlot[]) => {
    if (nextSlots.length === 0) {
      setStatusMessage("");
      return;
    }
    if (nextSlots.some((s) => s.status === "uploading")) {
      setStatusMessage("Uploading receipt…");
      return;
    }
    if (nextSlots.some((s) => s.status === "failed")) {
      setStatusMessage("Upload failed — tap photo to retry");
      return;
    }
    if (nextSlots.every((s) => s.status === "success")) {
      setStatusMessage("Receipt uploaded ✓");
    }
  }, []);

  const uploadSlotNow = useCallback(
    async (slotId: string, localUri: string) => {
      setSlots((prev) => {
        const next = prev.map((s) =>
          s.id === slotId ? { ...s, status: "uploading" as const, remoteUrl: null } : s
        );
        syncStatusMessage(next);
        return next;
      });

      try {
        const url = await uploadImage(localUri);
        setSlots((prev) => {
          const next = prev.map((s) =>
            s.id === slotId ? { ...s, status: "success" as const, remoteUrl: url } : s
          );
          syncStatusMessage(next);
          return next;
        });
      } catch (uploadError) {
        setSlots((prev) => {
          const next = prev.map((s) =>
            s.id === slotId ? { ...s, status: "failed" as const, remoteUrl: null } : s
          );
          syncStatusMessage(next);
          return next;
        });
        Alert.alert("Upload Failed", formatFirebaseError(uploadError));
      }
    },
    [uploadImage, syncStatusMessage]
  );

  const pickImage = async () => {
    if (slots.length >= maxImages) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to upload receipts.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const slotId = nextSlotId();
        setSlots((prev) => {
          const next = [
            ...prev,
            { id: slotId, localUri: uri, remoteUrl: null, status: "uploading" as const },
          ];
          syncStatusMessage(next);
          return next;
        });
        await uploadSlotNow(slotId, uri);
      }
    } catch (error) {
      Alert.alert("Error", formatFirebaseError(error));
    }
  };

  const removeSlot = (slotId: string) => {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== slotId);
      syncStatusMessage(next);
      return next;
    });
  };

  const retrySlot = (slot: ImageSlot) => {
    if (slot.status === "failed") {
      uploadSlotNow(slot.id, slot.localUri);
    }
  };

  const statusTone =
    statusMessage.includes("failed")
      ? "text-red-600"
      : statusMessage.includes("✓")
        ? "text-emerald-600"
        : statusMessage.includes("Uploading")
          ? "text-primary"
          : "text-text-secondary";

  return (
    <View className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <View className="flex-row items-center gap-2 px-4 pt-4 pb-3 border-b border-border bg-primary-50">
        <Ionicons name="camera-outline" size={16} color="#2563EB" />
        <Text className="text-primary font-semibold text-xs tracking-widest uppercase">
          {sectionTitle}
        </Text>
      </View>
      <View className="p-4">
        <Text className="text-text-secondary text-xs font-semibold tracking-widest uppercase mb-2">
          {fieldLabel}
          {maxImages > 1 ? ` (${slots.length}/${maxImages})` : ""}
        </Text>
        {statusMessage ? (
          <Text className={`text-xs font-medium mb-2 ${statusTone}`}>{statusMessage}</Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {slots.map((slot) =>
            slot.status === "failed" ? (
              <TouchableOpacity
                key={slot.id}
                activeOpacity={0.85}
                onPress={() => retrySlot(slot)}
                style={[styles.slot, { borderColor: "#EF4444" }]}
              >
                <Image source={slot.localUri} style={styles.slotImage} contentFit="cover" />
                <View style={styles.overlay}>
                  <View style={styles.failedBadge}>
                    <Ionicons name="cloud-offline-outline" size={26} color="#fff" />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeSlot(slot.id)}
                  style={styles.removeBtn}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ) : (
              <View
                key={slot.id}
                style={[
                  styles.slot,
                  {
                    borderColor:
                      slot.status === "success"
                        ? "#10B981"
                        : slot.status === "uploading"
                          ? "#3B82F6"
                          : "#E2E8F0",
                  },
                ]}
              >
                <Image source={slot.localUri} style={styles.slotImage} contentFit="cover" />
                {slot.status === "uploading" && (
                  <View style={styles.overlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
                {slot.status === "success" && (
                  <>
                    <View style={styles.successBadge}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </View>
                    <TouchableOpacity
                      onPress={() => removeSlot(slot.id)}
                      style={styles.removeBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )
          )}

          {canAddMore && (
            <TouchableOpacity
              onPress={pickImage}
              style={styles.addBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={28} color="#94A3B8" />
              <Text className="text-text-secondary text-xs font-bold mt-1">Add Image</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
  },
  slotImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  failedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  successBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
