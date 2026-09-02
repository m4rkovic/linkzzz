/**
 * Returns the request-time timestamp used to seed scheduled public rendering.
 * This stays outside React component bodies so the render remains lint-pure while
 * SSR and hydration still share one authoritative timestamp.
 */
export function getServerRenderTimestamp() {
  return Date.now();
}
