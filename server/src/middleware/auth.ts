import jwt from 'jsonwebtoken';
import { query } from '../db.js';

interface TokenPayload {
  id: string;
  email: string;
  name?: string;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET not set');
      return null;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Verify user still exists in database
    const userResult = await query('SELECT id, name FROM "User" WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      console.error('User not found in database:', decoded.id);
      return null;
    }

    // Sync name from DB in case it changed
    const dbUser = userResult.rows[0];
    return {
      id: decoded.id,
      email: decoded.email,
      name: dbUser.name || decoded.name,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function createToken(payload: TokenPayload): string {
  const secret = process.env.NEXTAUTH_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}
