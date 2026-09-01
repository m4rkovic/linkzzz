import "dotenv/config";

import { assertProductionEnvironment } from "../src/server/config/production-environment";

try {
  assertProductionEnvironment(process.env);
  console.log("Production environment configuration is ready.");
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Production environment validation failed.",
  );
  process.exitCode = 1;
}
