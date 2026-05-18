import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

function extensionFromUrl(url: string): string {
  const match = url.match(/\.(jpe?g|png|webp|gif)(\?|#|$)/i);
  if (!match) return ".jpg";
  const ext = match[1].toLowerCase();
  return ext === "jpeg" ? ".jpg" : `.${ext}`;
}

function mimeFromExtension(ext: string): string {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

async function saveOnWeb(imageUrl: string, fileName: string): Promise<void> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Could not download image");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Download a remote image and save to the device gallery (or open share sheet as fallback).
 */
export async function downloadRemoteImage(imageUrl: string): Promise<void> {
  const ext = extensionFromUrl(imageUrl);
  const fileName = `receipt-${Date.now()}${ext}`;

  if (Platform.OS === "web") {
    await saveOnWeb(imageUrl, fileName);
    return;
  }

  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error("File storage is not available on this device.");
  }

  const localUri = `${baseDir}${fileName}`;
  const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);

  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status === "granted") {
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Saved", "Image saved to your photo library.");
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: mimeFromExtension(ext),
      dialogTitle: "Save image",
    });
    return;
  }

  Alert.alert(
    "Permission needed",
    "Allow photo library access to save images, or use the share option when available."
  );
}
