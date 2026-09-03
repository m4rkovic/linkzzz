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
