import { describe, expect, it } from '@jest/globals';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('should hash a password using Argon2id', async () => {
    const password = 'StrongPassword123!';
    const hash = await service.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
    expect(hash).toContain('m=19456,t=2,p=1');
  });

  it('should verify a correct password against its Argon2id hash', async () => {
    const password = 'CorrectHorseBatteryStaple!';
    const hash = await service.hashPassword(password);

    const isValid = await service.verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'CorrectPassword!';
    const hash = await service.hashPassword(password);

    const isValid = await service.verifyPassword('WrongPassword!', hash);
    expect(isValid).toBe(false);
  });

  it('should return false gracefully on corrupted hash format', async () => {
    const isValid = await service.verifyPassword('Password123!', 'corrupted_hash_string');
    expect(isValid).toBe(false);
  });
});
