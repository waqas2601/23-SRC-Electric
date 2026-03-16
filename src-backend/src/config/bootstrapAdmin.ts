import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function bootstrapAdminUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!adminEmail || !adminPassword) {
    console.warn(
      "Admin bootstrap skipped (ADMIN_EMAIL or ADMIN_PASSWORD missing)",
    );
    return;
  }

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    return;
  }

  const password_hash = await bcrypt.hash(adminPassword, 12);

  await User.create({
    name: adminName,
    email: adminEmail,
    password_hash,
    role: "admin",
    is_active: true,
  });

  console.log(`Bootstrap admin created: ${adminEmail}`);
}
