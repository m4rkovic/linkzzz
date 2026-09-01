export type OriginCheckInput = {
  origin: string | null;
  host: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  allowLocalhost?: boolean;
};

function normalizeHost(value: string | null | undefined) {
  return value?.split(",")[0]?.trim().toLowerCase() || null;
}

export function isSameOriginRequest({
  origin,
  host,
  forwardedHost,
  forwardedProto,
  allowLocalhost = process.env.NODE_ENV !== "production",
}: OriginCheckInput) {
  if (!origin) {
    return false;
  }

  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  const requestHost = normalizeHost(forwardedHost) ?? normalizeHost(host);

  if (!requestHost) {
    return false;
  }

  if (allowLocalhost && ["localhost", "127.0.0.1"].includes(parsed.hostname)) {
    return parsed.host.toLowerCase() === requestHost;
  }

  const expectedProto = forwardedProto?.split(",")[0]?.trim().toLowerCase();

  if (expectedProto && parsed.protocol !== `${expectedProto}:`) {
    return false;
  }

  return parsed.host.toLowerCase() === requestHost;
}
