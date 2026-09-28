import { execSync } from "child_process";
import { config } from "dotenv";

export default function setup() {
  config({ path: ".env.test", override: true });

  // Safety check: never wipe a database that isn't the test one
  if (!process.env.DATABASE_URL?.includes("_test")) {
    throw new Error("Refusing to reset a non-test database. Check .env.test");
  }

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });
}
