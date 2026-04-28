import * as Sharing from 'expo-sharing';
import { writeAsStringAsync, documentDirectory, EncodingType } from 'expo-file-system';

/**
 * Downloads a CSV from the backend (or mock) and shares it via the platform sharing dialog.
 * In real usage, replace `mockFetchReportCSV` with a real API call that returns CSV text.
 */

/**
 * Saves a CSV string to a temp file and opens the share dialog.
 */
export const shareCSV = async (csvContent: string, fileName: string): Promise<void> => {
  const fileUri = `${documentDirectory}${fileName}.csv`;

  await writeAsStringAsync(fileUri, csvContent, {
    encoding: EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Report',
    UTI: 'public.comma-separated-values-text',
  });
};
