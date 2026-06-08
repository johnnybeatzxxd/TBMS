import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert } from 'react-native';

/**
 * Saves a CSV string to the device's Downloads folder AND opens the share dialog.
 * On Android: saves to Downloads via SAF, then shares.
 * On iOS: writes to documentDirectory, then shares (user can save via the share sheet).
 */
export const shareCSV = async (csvContent: string, fileName: string): Promise<void> => {
  const fullFileName = `${fileName}.csv`;
  const tempUri = `${FileSystem.documentDirectory}${fullFileName}`;

  // Write the CSV to a temp file first (needed for sharing on both platforms)
  await FileSystem.writeAsStringAsync(tempUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // --- Save to device storage ---
  if (Platform.OS === 'android') {
    try {
      // Use SAF to save to Downloads
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fullFileName,
          'text/csv'
        );
        await FileSystem.writeAsStringAsync(safUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        Alert.alert('Saved', `"${fullFileName}" has been saved to your selected folder.`);
      }
    } catch (saveErr: any) {
      console.warn('SAF save failed, falling back to share only:', saveErr?.message);
    }
  }

  // --- Share dialog ---
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    // If sharing isn't available but we already saved on Android, that's fine
    if (Platform.OS !== 'android') {
      throw new Error("Sharing is not available on this device.");
    }
    return;
  }

  await Sharing.shareAsync(tempUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Report',
    UTI: 'public.comma-separated-values-text',
  });
};

type CsvPrimitive = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvPrimitive>;

const escapeCsvCell = (value: CsvPrimitive): string => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const rowsToCSV = (rows: CsvRow[]): string => {
  if (rows.length === 0) return "";

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(",")),
  ].join("\n");
};

export const shareRowsAsCSV = async (rows: CsvRow[], fileName: string): Promise<void> => {
  if (rows.length === 0) {
    throw new Error("No data available to export.");
  }
  await shareCSV(rowsToCSV(rows), fileName);
};
