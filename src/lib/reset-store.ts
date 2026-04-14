interface ResetRecord {
  email: string;
  expiresAt: number;
}

const globalForReset = globalThis as unknown as {
  resetStore: Map<string, ResetRecord>;
};

export const resetStore = globalForReset.resetStore || new Map<string, ResetRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForReset.resetStore = resetStore;
}
