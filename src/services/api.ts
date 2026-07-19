import { getAccessToken, clearAccessToken } from './authStorage';

type AuthFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function authFetch(
  url: string,
  options: AuthFetchOptions = {},
): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await clearAccessToken();
  }

  return response;
}
