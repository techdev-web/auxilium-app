import { pick, types, keepLocalCopy, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import { parseCsvCoordinates } from '../../utils/csvCoordinates';
import type { LngLat } from '../../utils/csvCoordinates';

async function readLocalFileText(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to read file (${response.status})`);
  }
  return response.text();
}

/**
 * Opens a document picker, reads CSV/text, and returns lng/lat positions.
 * Returns null if the user cancels or nothing valid is found.
 */
export async function pickAndParseCsvCoordinates(): Promise<LngLat[] | null> {
  try {
    const [file] = await pick({
      type: [types.csv, types.plainText, types.allFiles],
      allowMultiSelection: false,
    });

    const [copy] = await keepLocalCopy({
      files: [
        {
          uri: file.uri,
          fileName: file.name ?? 'import.csv',
        },
      ],
      destination: 'cachesDirectory',
    });

    if (copy.status !== 'success') {
      Toast.show({
        type: 'error',
        text1: 'Could not open file',
      });
      return null;
    }

    const text = await readLocalFileText(copy.localUri);
    const { positions, skippedRows } = parseCsvCoordinates(text);

    if (positions.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No valid coordinates',
        text2: 'CSV needs longitude,latitude columns or rows',
      });
      return null;
    }

    if (skippedRows > 0) {
      Toast.show({
        type: 'info',
        text1: `Imported ${positions.length} point(s)`,
        text2: `Skipped ${skippedRows} invalid row(s)`,
      });
    }

    return positions;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    Toast.show({
      type: 'error',
      text1: 'CSV import failed',
      text2: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
