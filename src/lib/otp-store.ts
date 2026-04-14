interface OTPRecord {
  otp: string;
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as {
  otpStore: Map<string, OTPRecord>;
};

export const otpStore = globalForOtp.otpStore || new Map<string, OTPRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.otpStore = otpStore;
}
