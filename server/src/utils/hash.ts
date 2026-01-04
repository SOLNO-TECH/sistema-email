import bcrypt from "bcryptjs";

export async function hashPassword(plain: string) {
  return await bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string) {
  return await bcrypt.compare(plain, hash);
}
