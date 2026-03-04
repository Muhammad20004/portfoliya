import "dotenv/config";
import dns from "node:dns";

import { buildApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { seedHeadIfNotExists } from "./utils/seedHead.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function bootstrap() {
  const PORT = process.env.PORT || 8000;

  await connectDB(process.env.MONGO_URI);

  await seedHeadIfNotExists();

  const app = buildApp();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("BOOTSTRAP ERROR:", err);
  process.exit(1);
});
