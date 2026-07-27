import {
  pick,
  types,
  keepLocalCopy,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';

/**
 * Opens the device file picker filtered to images.
 * Returns a stable local URI or null if the user cancels.
 */
export async function pickImageFile(): Promise<string | null> {
  try {
    const [file] = await pick({
      type: [types.images],
      allowMultiSelection: false,
    });

    const [copy] = await keepLocalCopy({
      files: [
        {
          uri: file.uri,
          fileName: file.name ?? 'overlay.png',
        },
      ],
      destination: 'cachesDirectory',
    });

    if (copy.status !== 'success') {
      Toast.show({ type: 'error', text1: 'Could not open image' });
      return null;
    }

    return copy.localUri;
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return null;
    }
    Toast.show({
      type: 'error',
      text1: 'Image pick failed',
      text2: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
