import { Image } from "react-native";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const LOG = "[ImageCompress]";

/** 5 MB — compress only when file is larger than this */
export const MAX_UPLOAD_IMAGE_BYTES = 4 * 1024 * 1024;

const MAX_STEPS = 10;
const MIN_EDGE_PX = 480;

function log(message: string, detail?: unknown) {
  if (detail !== undefined) console.log(LOG, message, detail);
  else console.log(LOG, message);
}

async function getUriSizeBytes(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (info.exists && typeof info.size === "number") {
      return info.size;
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(uri);
    if (res.ok) {
      const blob = await res.blob();
      return blob.size > 0 ? blob.size : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err)
    );
  });
}

/**
 * If the file at `localUri` is over {@link MAX_UPLOAD_IMAGE_BYTES}, resize + JPEG re-encode
 * until it fits or we exhaust steps. Leaves small files untouched.
 */
export async function ensureImageUnderMaxBytes(localUri: string): Promise<string> {
  const initialSize = await getUriSizeBytes(localUri);
  if (initialSize === null) {
    log("Could not read file size — uploading without compression");
    return localUri;
  }
  if (initialSize <= MAX_UPLOAD_IMAGE_BYTES) {
    return localUri;
  }

  log("Image over 5 MB, compressing…", {
    bytes: initialSize,
    mb: (initialSize / (1024 * 1024)).toFixed(2),
  });

  let workingUri = localUri;

  for (let step = 0; step < MAX_STEPS; step++) {
    const sizeNow = await getUriSizeBytes(workingUri);
    if (sizeNow !== null && sizeNow <= MAX_UPLOAD_IMAGE_BYTES) {
      log("Under 5 MB", {
        bytesBefore: initialSize,
        bytesAfter: sizeNow,
        stepsUsed: step,
      });
      return workingUri;
    }

    let w = 2000;
    let h = 2000;
    try {
      const dim = await getImageDimensions(workingUri);
      w = Math.max(1, dim.width);
      h = Math.max(1, dim.height);
    } catch {
      log("getImageDimensions failed — using resize + quality only");
    }

    const longEdge = Math.max(w, h);
    const shrink = 0.74;
    const nextLongEdge = Math.max(MIN_EDGE_PX, Math.floor(longEdge * shrink));

    let actions: { resize: { width?: number; height?: number } }[] = [];
    if (nextLongEdge < longEdge) {
      if (w >= h) {
        const newW = Math.max(1, Math.round((w * nextLongEdge) / longEdge));
        actions = [{ resize: { width: newW } }];
      } else {
        const newH = Math.max(1, Math.round((h * nextLongEdge) / longEdge));
        actions = [{ resize: { height: newH } }];
      }
    }

    const quality = Math.max(0.28, 0.82 - step * 0.06);

    try {
      const out = await manipulateAsync(workingUri, actions, {
        compress: quality,
        format: SaveFormat.JPEG,
      });

      workingUri = out.uri;
      const after = await getUriSizeBytes(workingUri);

      log("Compress step", {
        step: step + 1,
        resized: actions.length > 0,
        longEdgeWas: longEdge,
        quality,
        bytesAfter: after,
      });

      if (after === null) continue;

      const prev = sizeNow ?? initialSize;
      if (step >= 2 && after >= prev * 0.98 && actions.length === 0) {
        log("Size barely changing — stopping (quality-only path exhausted)");
        return workingUri;
      }
    } catch (e) {
      log("manipulateAsync failed", String(e));
      throw e;
    }
  }

  const finalSize = await getUriSizeBytes(workingUri);
  log("Max compression steps reached", { bytes: finalSize });
  return workingUri;
}
