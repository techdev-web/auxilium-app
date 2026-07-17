import { TextInput } from 'react-native';
import { withUnistyles } from 'react-native-unistyles';

/** TextInput with themed placeholder color */
export const UniTextInput = withUnistyles(TextInput, theme => ({
  placeholderTextColor: theme.colors.placeholder,
}));
