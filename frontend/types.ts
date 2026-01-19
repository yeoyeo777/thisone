
export interface BundleWallet {
  id: string;
  address: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
  status: 'idle' | 'funding' | 'ready' | 'buying' | 'selling' | 'draining';
}

export interface LaunchConfig {
  name: string;
  ticker: string;
  description: string;
  image: string;
  banner?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  totalSolToBuy: number;
  walletCount: number;
  slippage: number;
  fundOnLaunch: boolean;
  fundingMode: 'equal' | 'random';
  revokeMint: boolean;
  revokeFreeze: boolean;
  revokeUpdate: boolean;
}

export interface VolumeBotConfig {
  isActive: boolean;
  minBuy: number;
  maxBuy: number;
  intervalSec: number;
  targetVolume: number;
  sellIntervalSec: number;
  sellPercentage: number;
  counterTrade: boolean;
  totalSolBudget: number;
}

export interface StealthExitConfig {
  intervalSec: number;
  sellPercentage: number;
  randomize: boolean;
}

export interface LaunchProgress {
  step: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp: string;
}

export interface SecurityCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning';
  description: string;
  remediation?: string;
}

export interface WalletBundle {
  clusterId: number;
  wallets: string[];
  percentageSupply: number;
}

export interface AnalysisResult {
  tokenMetadata: {
    name: string;
    symbol: string;
    supply: number;
    decimals: number;
    creatorAddress: string;
  };
  riskScore: number;
  checks: SecurityCheck[];
  bundleAnalysis: {
    clustersDetected: number;
    percentageOfSupply: number;
    isSuspect: boolean;
  };
  summary: string;
}
