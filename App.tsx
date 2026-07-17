/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useUnistyles } from 'react-native-unistyles';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const { rt } = useUnistyles();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={rt.colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}

export default App;
