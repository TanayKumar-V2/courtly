import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  /**
   * OWASP recommended minimum configuration for Argon2id
   * memoryCost: 19456 KiB
   * timeCost: 2
   * parallelism: 1
   */
  private readonly argonOptions: argon2.HashOptions = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, this.argonOptions);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
