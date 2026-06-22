import { signInWithCustomToken } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { apiFetch } from "@/src/api/config";
import { firebaseAuth, firebaseStorage } from "@/src/lib/firebase";
import { ensureImageUnderMaxBytes } from "@/src/utils/imageCompress";

const LOG = "[FirebaseUpload]";

/** Storage path segment: pictures/{uid}/{type}/{filename} */
export type PictureUploadType = "refule" | "credit" | "expense" | "transfer";

function mimeToExtension(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  return ".jpg";
}

function log(message: string, detail?: unknown) {
  if (detail !== undefined) {
    console.log(LOG, message, detail);
  } else {
    console.log(LOG, message);
  }
}

export function formatFirebaseError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { code?: string; message?: string };
    if (e.code === "auth/invalid-custom-token") {
      return `${e.code}: Backend custom token is invalid or expired. Log in again or ask backend to fix token signing.`;
    }
    if (e.code === "auth/configuration-not-found") {
      return `${e.code}: Enable Firebase Authentication in Firebase Console for geames-finder.`;
    }
    const code = e.code ? `${e.code}: ` : "";
    return `${code}${e.message || "Unknown Firebase error"}`;
  }
  return String(error);
}

function newUploadId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

async function getCustomTokenFromBackend(): Promise<string> {
  log("Fetching custom token from /firebase/get-firebase-token …");
  const res = await apiFetch("/firebase/get-firebase-token");
  log("Token response", { status: res.status, ok: res.ok });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ||
        `Failed to get Firebase token (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  const firebaseToken = data.firebaseToken as string | undefined;
  if (!firebaseToken) {
    log("Missing firebaseToken in response", data);
    throw new Error("No firebaseToken in server response");
  }
  return firebaseToken;
}

function uriToBlobViaXhr(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error("XHR failed to load image URI"));
    xhr.responseType = "blob";
    xhr.open("GET", uri);
    xhr.send();
  });
}

async function uriToBlob(uri: string): Promise<Blob> {
  log("Reading local image", { uri });
  try {
    const response = await fetch(uri);
    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 0) {
        log("Blob via fetch", { size: blob.size, type: blob.type });
        return blob;
      }
    }
  } catch (e) {
    log("fetch failed, trying XHR", formatFirebaseError(e));
  }
  const blob = await uriToBlobViaXhr(uri);
  if (!blob?.size) throw new Error("Could not read image file (empty blob)");
  return blob;
}

/**
 * Same flow as backend Node script:
 * get token → signInWithCustomToken → pictures/{uid}/{type}/{id}.{ext} → uploadBytes → getDownloadURL
 *
 * RN Blobs often lack `arrayBuffer()` — upload the Blob as-is with the correct MIME.
 */
export async function uploadPicture(
  imageBlob: Blob,
  type: PictureUploadType = "credit"
): Promise<string> {
  log("uploadPicture START", { type, bytes: imageBlob.size, blobType: imageBlob.type });

  try {
    const customToken = await getCustomTokenFromBackend();

    log("Connecting to Firebase…");
    const userCredential = await signInWithCustomToken(firebaseAuth, customToken);
    const uid = userCredential.user.uid;
    log("SUCCESS! Logged in as user UID:", uid);

    const contentType =
      imageBlob.type && imageBlob.type !== ""
        ? imageBlob.type
        : "image/jpeg";
    const ext = mimeToExtension(contentType.toLowerCase());
    const uniqueId = newUploadId();
    const filePath = `pictures/${uid}/${type}/${uniqueId}${ext}`;
    log("Storage path", { filePath, contentType });

    const storageRef = ref(firebaseStorage, filePath);

    const snapshot = await uploadBytes(storageRef, imageBlob, {
      contentType,
    });
    log("Uploaded successfully!");

    const downloadURL = await getDownloadURL(snapshot.ref);
    log("Download url:", downloadURL);
    return downloadURL;
  } catch (error) {
    log("--- FIREBASE ERROR ---", {
      code: (error as { code?: string })?.code,
      message: formatFirebaseError(error),
    });
    throw error;
  }
}

export async function uploadPictureFromUri(
  localUri: string,
  type: PictureUploadType = "credit"
): Promise<string> {
  const preparedUri = await ensureImageUnderMaxBytes(localUri);
  if (preparedUri !== localUri) {
    log("Using compressed image URI for upload");
  }
  const blob = await uriToBlob(preparedUri);
  return uploadPicture(blob, type);
}

/** Credit trip → pictures/{uid}/credit/{uuid}.{ext} */
export async function uploadCreditTripReceipt(localUri: string): Promise<string> {
  return uploadPictureFromUri(localUri, "credit");
}

/** Refuel → pictures/{uid}/refule/{uuid}.{ext} */
export async function uploadRefuelReceipt(localUri: string): Promise<string> {
  return uploadPictureFromUri(localUri, "refule");
}

export async function uploadRefuelReceipts(localUris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of localUris) {
    urls.push(await uploadRefuelReceipt(uri));
  }
  return urls;
}

/** General expense / other request → pictures/{uid}/expense/{uuid}.{ext} */
export async function uploadExpenseReceipt(localUri: string): Promise<string> {
  return uploadPictureFromUri(localUri, "expense");
}

/** Money transfer proof → pictures/{uid}/transfer/{uuid}.{ext} */
export async function uploadTransferReceipt(localUri: string): Promise<string> {
  return uploadPictureFromUri(localUri, "transfer");
}
