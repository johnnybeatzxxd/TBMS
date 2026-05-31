/** Backend uses "-" when no receipt image is attached. */
export function isValidReceiptPicUrl(url?: string | null): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "-") return false;
  return true;
}

export function hasValidTripReceiptPic(receiptPic?: string | null): receiptPic is string {
  return isValidReceiptPicUrl(receiptPic);
}

export function getValidReceiptPicUrls(receiptPic?: string | string[] | null): string[] {
  if (!receiptPic) return [];
  const urls = Array.isArray(receiptPic) ? receiptPic : [receiptPic];
  return urls.filter(isValidReceiptPicUrl);
}

/** Remote URLs suitable for full-screen image viewer (not local file URIs). */
export function isViewableImageUrl(url?: string | null): url is string {
  if (!isValidReceiptPicUrl(url)) return false;
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

/** Collect receipt + form image field URLs from a service request / expense row. */
export function getRequestImageUrls(req: {
  values?: Record<string, unknown>;
  receiptPic?: string | string[] | null;
}): string[] {
  const urls = [...getValidReceiptPicUrls(req.receiptPic)];
  Object.values(req.values || {}).forEach((v) => {
    if (typeof v === "string" && isViewableImageUrl(v) && !urls.includes(v)) {
      urls.push(v);
    }
  });
  return urls;
}

export function getRequestDisplayName(req: {
  templateName?: string;
  tag?: string;
}): string {
  // Tag takes priority over the generic "Other" / "Unknown" fallback names
  if (req.tag?.trim()) return req.tag.trim();
  const name = req.templateName?.trim() || "";
  if (name && name !== "Unknown" && name !== "Other") return name;
  return "Other";
}
