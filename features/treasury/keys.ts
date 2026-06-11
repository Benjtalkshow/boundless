export const treasuryKeys = {
  all: ['treasury'] as const,
  wallets: (organizationId: string) =>
    ['treasury', 'wallets', organizationId] as const,
  balance: (organizationId: string, walletId: string) =>
    ['treasury', 'balance', organizationId, walletId] as const,
  policy: (organizationId: string) =>
    ['treasury', 'policy', organizationId] as const,
  spends: (organizationId: string, status?: string) =>
    ['treasury', 'spends', organizationId, status ?? 'all'] as const,
  audit: (organizationId: string, page: number) =>
    ['treasury', 'audit', organizationId, page] as const,
};
