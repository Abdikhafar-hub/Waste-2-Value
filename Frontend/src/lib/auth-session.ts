import { type LoginResult } from "@/types/platform";

const AUTH_SESSION_KEY = "w2v_auth_session";

interface StoredAuthSession {
  token: string;
  userId: string;
  role: LoginResult["user"]["role"];
  email: string;
  rememberMe: boolean;
  signedInAt: string;
}

export function persistAuthSession(result: LoginResult, rememberMe: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredAuthSession = {
    token: result.token,
    userId: result.user.id,
    role: result.user.role,
    email: result.user.email,
    rememberMe,
    signedInAt: new Date().toISOString(),
  };

  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);

  const serialized = JSON.stringify(payload);

  if (rememberMe) {
    localStorage.setItem(AUTH_SESSION_KEY, serialized);
    return;
  }

  sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}
