import crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, 'hex');
    const storedHashBuffer = Buffer.from(hashHex, 'hex');
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');

    return crypto.timingSafeEqual(hash, storedHashBuffer);
  } catch {
    return false;
  }
}
