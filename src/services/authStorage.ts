import * as Keychain from 'react-native-keychain';

const AUTH_SERVICE = 'auxilium.auth';
const TOKEN_USERNAME = 'access_token';

export async function saveAccessToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(TOKEN_USERNAME, token, {
    service: AUTH_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getAccessToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: AUTH_SERVICE,
  });

  if (!credentials) {
    return null;
  }

  return credentials.password;
}

export async function clearAccessToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: AUTH_SERVICE });
}
