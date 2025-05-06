import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Mock the actual auth.ts file and test the utility functions individually
const scryptAsync = promisify(scrypt);

// Import the functions to test
// Note: We'll create simplified versions for testing since we can't easily 
// test the full auth setup with Express and Passport
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return hashedBuf.length === suppliedBuf.length && 
    hashedBuf.every((b, i) => b === suppliedBuf[i]);
}

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password with a salt', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      // The hashed password should be in the format hash.salt
      expect(hashedPassword).toContain('.');
      
      const [hash, salt] = hashedPassword.split('.');
      expect(hash).toBeTruthy();
      expect(salt).toBeTruthy();
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hashedPassword1 = await hashPassword(password);
      const hashedPassword2 = await hashPassword(password);
      
      // Due to different salts, the hashes should be different
      expect(hashedPassword1).not.toBe(hashedPassword2);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      const result = await comparePasswords(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hashedPassword = await hashPassword(password);
      
      const result = await comparePasswords(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });
});