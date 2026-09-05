type ContentSecurityPolicyOptions = {
  isDevelopment: boolean;
};

export function buildContentSecurityPolicy(
  input: ContentSecurityPolicyOptions & { nonce: string },
) {
  const scriptSources = [
    "'self'",
    `'nonce-${input.nonce}'`,
    "'strict-dynamic'",
    "https://www.googletagmanager.com",
    "https://connect.facebook.net",
    input.isDevelopment ? "'unsafe-eval'" : "",
  ].filter(Boolean);

  return buildPolicy({
    scriptSources,
    connectSources: [
      "'self'",
      "blob:",
      "https://www.google-analytics.com",
      "https://region1.google-analytics.com",
      "https://www.facebook.com",
      input.isDevelopment ? "ws:" : "",
      input.isDevelopment ? "wss:" : "",
    ],
    frameSources: [
      "'self'",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://open.spotify.com",
    ],
    isDevelopment: input.isDevelopment,
  });
}

/**
 * The application-host marketing page is intentionally static and has no
 * browser-side behavior that requires JavaScript. Blocking scripts entirely
 * avoids weakening the CSP just to hydrate a page whose links and anchors work
 * natively. Navigating into /login therefore performs a full document request
 * and re-enters the strict nonce policy used by the application surfaces.
 */
export function buildStaticMarketingContentSecurityPolicy(
  input: ContentSecurityPolicyOptions,
) {
  return buildPolicy({
    scriptSources: ["'none'"],
    connectSources: ["'self'"],
    frameSources: ["'self'"],
    isDevelopment: input.isDevelopment,
  });
}

function buildPolicy(input: {
  scriptSources: string[];
  connectSources: string[];
  frameSources: string[];
  isDevelopment: boolean;
}) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${input.scriptSources.join(" ")}`,
    "script-src-attr 'none'",
    // The editor and public renderer currently use React style attributes.
    // Removing this requires a separate CSS refactor; it does not weaken script-src.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `frame-src ${input.frameSources.join(" ")}`,
    `connect-src ${input.connectSources.filter(Boolean).join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    input.isDevelopment ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}
