import type { Instrumentation } from "next";

import {
  getRequestCorrelationId,
  logServerError,
} from "@/server/observability/server-logger";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const isProductionDeployment = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.NODE_ENV === "production";
  if (!isProductionDeployment) return;

  const { assertProductionEnvironment } = await import(
    "@/server/config/production-environment"
  );
  assertProductionEnvironment(process.env);
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  logServerError("next.request.unhandled", error, {
    requestId: getRequestCorrelationId(request.headers),
    method: request.method,
    path: request.path.split("?", 1)[0],
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  });
};
