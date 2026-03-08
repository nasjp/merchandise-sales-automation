const BASIC_PREFIX = "Basic ";

export const shouldProtectUi = (env: NodeJS.ProcessEnv): boolean => {
  if (env.VERCEL_ENV) {
    return env.VERCEL_ENV === "production";
  }

  return env.NODE_ENV === "production";
};

const decodeBase64 = (value: string): string | null => {
  try {
    if (typeof atob === "function") {
      return atob(value);
    }

    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
};

export const isAuthorizedByPassword = (params: {
  authorizationHeader: string | null;
  password: string;
}): boolean => {
  const { authorizationHeader, password } = params;
  if (!authorizationHeader?.startsWith(BASIC_PREFIX)) {
    return false;
  }

  const encodedCredentials = authorizationHeader.slice(BASIC_PREFIX.length).trim();
  if (!encodedCredentials) {
    return false;
  }

  const decodedCredentials = decodeBase64(encodedCredentials);
  if (!decodedCredentials) {
    return false;
  }

  const separatorIndex = decodedCredentials.indexOf(":");
  if (separatorIndex < 0) {
    return false;
  }

  const providedPassword = decodedCredentials.slice(separatorIndex + 1);
  return providedPassword === password;
};

