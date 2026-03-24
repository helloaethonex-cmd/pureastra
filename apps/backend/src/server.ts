(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import "dotenv/config";
import app from "./app";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";

const PORT = env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
});
