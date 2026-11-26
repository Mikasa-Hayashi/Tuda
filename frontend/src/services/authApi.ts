import type { PersonalData, PersonalDataWrite } from '@/src/storage/personalDataTypes';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

export type AuthUser = {
  id: number;
  username: string;
  email: string | null;
  display_name: string;
};

export type AuthResponse = { token: string; user: AuthUser };
type SyncResponse = { revision: number; data: PersonalData | null; applied: boolean };

/** Failure reasons the UI turns into messages. */
export type AuthErrorCode = 'wrong_credentials' | 'taken' | 'invalid' | 'network' | 'unknown';
export type AuthField = 'username' | 'email' | 'password';

export class AuthError extends Error {
  code: AuthErrorCode;
  field?: AuthField;
  constructor(code: AuthErrorCode, field?: AuthField) {
    super(code);
    this.code = code;
    this.field = field;
  }
}

async function registrationErrorField(response: Response): Promise<AuthField | undefined> {
  const body = await response.json().catch(() => null) as { detail?: { loc?: unknown[] }[] } | null;
  if (!Array.isArray(body?.detail)) return;
  for (const issue of body.detail) {
    if (!Array.isArray(issue?.loc) || issue.loc[0] !== 'body') continue;
    const field = issue.loc[1];
    if (field === 'username' || field === 'email' || field === 'password') return field;
  }
}

/** Without a timeout an unreachable server leaves the form hanging for a minute or more. */
const TIMEOUT_MS = 8000;

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    response = await fetch(`${API_BASE_URL}/auth${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new AuthError('network');
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    if (response.status === 401) throw new AuthError('wrong_credentials');
    if (response.status === 409) throw new AuthError('taken');
    if (response.status === 422) {
      const field = path === '/register' ? await registrationErrorField(response) : undefined;
      throw new AuthError('invalid', field);
    }
    throw new AuthError('unknown');
  }
  return (await response.json()) as T;
}

export const authApi = {
  login: (identifier: string, password: string) =>
    request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email: email || null, password }),
    }),
  me: (token: string) => request<AuthUser>('/me', {}, token),
  syncProgress: (token: string, revision: number, write: PersonalDataWrite | null) =>
    request<SyncResponse>('/progress/sync', {
      method: 'POST',
      body: JSON.stringify({ revision, write }),
    }, token),
  logout: (token: string) => request<void>('/logout', { method: 'POST' }, token),
  deleteAccount: (token: string) => request<void>('/me', { method: 'DELETE' }, token),
};
