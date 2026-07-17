import React, { useEffect } from 'react';
import { Image, ImageBackground, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native-unistyles';
import type { RootStackParamList } from '../navigation/types';
import { resolveAuthDestination } from '../services/authStorage';
import bg from '../assets/bg3.png';
import logo from '../assets/logo.png';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const MIN_SPLASH_MS = 900;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      const startedAt = Date.now();

      try {
        const destination = await resolveAuthDestination();
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

        if (remaining > 0) {
          await new Promise<void>(resolve => setTimeout(resolve, remaining));
        }

        if (!isActive) {
          return;
        }

        navigation.replace(destination);
      } catch {
        if (isActive) {
          navigation.replace('Login');
        }
      }
    };

    bootstrap();

    return () => {
      isActive = false;
    };
  }, [navigation]);

  return (
    <ImageBackground source={bg} style={styles.root} resizeMode="cover">
      <View style={styles.center}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.gap(4),
  },
  logo: {
    width: 260,
    height: 96,
  },
}));
