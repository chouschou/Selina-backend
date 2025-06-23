import { Injectable } from '@nestjs/common';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class OtpService {
  private otpStore = new Map<string, OtpEntry>();

  generateOtp(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    this.otpStore.set(email, { code, expiresAt });
    return code;
  }

  verifyOtp(email: string, code: string): boolean {
    const entry = this.otpStore.get(email);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(email);
      return false;
    }
    const isValid = entry.code === code;
    if (isValid) this.otpStore.delete(email);
    return isValid;
  }
}
