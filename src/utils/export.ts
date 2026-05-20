import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Saves a CSV string to a temp file and opens the share dialog.
 */
export const shareCSV = async (csvContent: string, fileName: string): Promise<void> => {
  const fileUri = `${FileSystem.documentDirectory}${fileName}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
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
