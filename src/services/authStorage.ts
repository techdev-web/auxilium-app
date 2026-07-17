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

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const json = globalThis.atob(padded);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export async function resolveAuthDestination(): Promise<'Login' | 'MainTabs'> {
  const token = await getAccessToken();

  if (!token) {
    return 'Login';
  }

  if (isAccessTokenExpired(token)) {
    await clearAccessToken();
    return 'Login';
  }

  return 'MainTabs';
}
