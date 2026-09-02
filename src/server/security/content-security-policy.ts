export function buildContentSecurityPolicy(input: {
  nonce: string;
  isDevelopment: boolean;
}) {
  const scriptSources = [
    "'self'",
    `'nonce-${input.nonce}'`,
    "'strict-dynamic'",
    "https://www.googletagmanager.com",
    "https://connect.facebook.net",
    input.isDevelopment ? "'unsafe-eval'" : "",
  ].filter(Boolean);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "script-src-attr 'none'",
    // The editor and public renderer currently use React style attributes.
    // Removing this requires a separate CSS refactor; it does not weaken script-src.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com",
    // Profile image previews are object URLs. Saving fetches the object URL
    // locally before posting the resulting File to the same-origin API.
    `connect-src 'self' blob: https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com${input.isDevelopment ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    input.isDevelopment ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}
