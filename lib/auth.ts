import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_Super_SECRET || "no_secret_provided";
export function generateToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export async function comparePassword(plain: string, hash: string) {
  return await bcrypt.compare(plain, hash);
}