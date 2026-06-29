import { create } from 'zustand';

export type MarketStatus = 'OPEN' | 'FROZEN_BETTING' | 'AWAITING_CONSENSUS' | 'DISPUTED_FROZEN' | 'CLOSED';

export interface MatchInfo {
  tournament: string;
  match: string;
}

export interface MarketState {
  market_id: string;
  creator_pubkey: string;
  match_info: MatchInfo;
  incident_type: string;
  incident_description: string;
  qvac_odds: {
    YES: number;
    NO: number;
  };
  status: MarketStatus;
  created_timestamp: number;
  total_pool: number;
  bandar_stake: number;
  resolution_outcome?: 'YES' | 'NO' | null;
  emergency_freeze_count: number;
}

export interface BetRecord {
  bet_id: string;
  market_id: string;
  punter_pubkey: string;
  choice: 'YES' | 'NO';
  amount_usdt: number;
  timestamp: number;
}

interface MarketStore {
  market: MarketState | null;
  bets: BetRecord[];

  // Actions
  openMarket: (
    marketId: string,
    matchInfo: MatchInfo,
    incidentType: string,
    incidentDescription: string,
    qvacOdds: { YES: number; NO: number },
    bandarStake: number,
    creatorPubkey: string
  ) => void;
  freezeMarket: () => void;
  emergencyFreeze: () => void;
  addBet: (choice: 'YES' | 'NO', amountUsdt: number, punterPubkey: string) => void;
  resolveMarket: (outcome: 'YES' | 'NO') => void;
  disputeMarket: () => void;
  closeMarket: () => void;
  resetStore: () => void;
}

export const useMarketStore = create<MarketStore>((set) => ({
  market: null,
  bets: [],

  openMarket: (marketId, matchInfo, incidentType, incidentDescription, qvacOdds, bandarStake, creatorPubkey) => set({
    market: {
      market_id: marketId,
      creator_pubkey: creatorPubkey,
      match_info: matchInfo,
      incident_type: incidentType,
      incident_description: incidentDescription,
      qvac_odds: qvacOdds,
      status: 'OPEN',
      created_timestamp: Date.now(),
      total_pool: bandarStake,
      bandar_stake: bandarStake,
      resolution_outcome: null,
      emergency_freeze_count: 0,
    },
    bets: [],
  }),

  freezeMarket: () => set((state) => {
    if (!state.market) return {};
    return {
      market: {
        ...state.market,
        status: 'FROZEN_BETTING',
      },
    };
  }),

  emergencyFreeze: () => set((state) => {
    if (!state.market || state.market.status !== 'OPEN') return {};
    const newCount = state.market.emergency_freeze_count + 1;
    // Circuit Breaker: 3+ emergency votes auto-freezes
    if (newCount >= 3) {
      return {
        market: {
          ...state.market,
          status: 'FROZEN_BETTING',
          emergency_freeze_count: newCount,
        },
      };
    }
    return {
      market: {
        ...state.market,
        emergency_freeze_count: newCount,
      },
    };
  }),

  addBet: (choice, amountUsdt, punterPubkey) => set((state) => {
    if (!state.market) return {};
    if (state.market.status !== 'OPEN') {
      console.warn("Bet rejected: Market is not open for betting.");
      return {};
    }

    const newBet: BetRecord = {
      bet_id: `bet_${Math.random().toString(36).substring(2, 11)}`,
      market_id: state.market.market_id,
      punter_pubkey: punterPubkey,
      choice,
      amount_usdt: amountUsdt,
      timestamp: Date.now(),
    };

    const updatedBets = [...state.bets, newBet];
    const newTotalPool = state.market.total_pool + amountUsdt;

    return {
      bets: updatedBets,
      market: {
        ...state.market,
        total_pool: newTotalPool,
      },
    };
  }),

  resolveMarket: (outcome) => set((state) => {
    if (!state.market) return {};
    return {
      market: {
        ...state.market,
        status: 'AWAITING_CONSENSUS',
        resolution_outcome: outcome,
      },
    };
  }),

  disputeMarket: () => set((state) => {
    if (!state.market) return {};
    return {
      market: {
        ...state.market,
        status: 'DISPUTED_FROZEN',
      },
    };
  }),

  closeMarket: () => set((state) => {
    if (!state.market) return {};
    return {
      market: {
        ...state.market,
        status: 'CLOSED',
      },
    };
  }),

  resetStore: () => set({
    market: null,
    bets: [],
  }),
}));
