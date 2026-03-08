export const UI_AUTH_COOKIE_NAME = "msa_ui_password";

export const shouldProtectUi = (env: NodeJS.ProcessEnv): boolean => {
  if (env.VERCEL_ENV) {
    return env.VERCEL_ENV === "production";
  }

  return env.NODE_ENV === "production";
};

export const hasValidPasswordCookie = (params: {
  cookiePassword: string | null | undefined;
  password: string;
}): boolean => {
  const { cookiePassword, password } = params;
  if (!cookiePassword) {
    return false;
  }

  return cookiePassword === password;
};

export const normalizeNextPath = (
  value: string | null | undefined,
  fallback = "/",
): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value === "/unlock" || value.startsWith("/unlock?")) {
    return fallback;
  }

  return value;
};
