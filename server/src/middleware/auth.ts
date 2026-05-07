import jwt from 'jsonwebtoken';

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
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function createToken(payload: TokenPayload): string {
  const secret = process.env.NEXTAUTH_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}
