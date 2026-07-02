import { create } from 'zustand';

export type MarketStatus =
  | 'OPEN'
  | 'FROZEN_BETTING'
  | 'AWAITING_CONSENSUS'
  | 'DISPUTED_FROZEN'
  | 'CLOSED'
  | 'GRACE_PERIOD'
  | 'DISPUTED';

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
  frozen_at?: number | null;      // Set when status → FROZEN_BETTING
  resolved_at: number | null;    // Set when status → AWAITING_CONSENSUS
  grace_period_at?: number | null; // Set when status → GRACE_PERIOD
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
  markets: MarketState[];
  bets: BetRecord[];
  cumulativePnl: number;         // All-time PnL bandar, bertambah saat pasar CLOSED
  walletConnected: boolean;
  walletBalance: number;
  punterAddress: string;

  // ── Actions ──
  addMarket: (
    marketId: string,
    matchInfo: MatchInfo,
    incidentType: string,
    incidentDescription: string,
    qvacOdds: { YES: number; NO: number },
    bandarStake: number,
    creatorPubkey: string
  ) => void;

  updateMarketStatus: (id: string, status: MarketStatus) => void;
  freezeMarketById: (id: string) => void;
  emergencyFreezeById: (id: string) => void;
  addBetToMarket: (marketId: string, choice: 'YES' | 'NO', amountUsdt: number, punterPubkey: string) => void;
  resolveMarketById: (id: string, outcome: 'YES' | 'NO') => void;
  disputeMarketById: (id: string) => void;
  closeMarketById: (id: string) => void;
  resetStore: () => void;
  connectWallet: () => void;

  // ── Legacy single-market aliases (used by punter page) ──
  /** @deprecated Use addMarket */
  openMarket: (
    marketId: string,
    matchInfo: MatchInfo,
    incidentType: string,
    incidentDescription: string,
    qvacOdds: { YES: number; NO: number },
    bandarStake: number,
    creatorPubkey: string
  ) => void;
  /** @deprecated Use freezeMarketById */
  freezeMarket: () => void;
  /** @deprecated Use emergencyFreezeById */
  emergencyFreeze: () => void;
  /** @deprecated Use addBetToMarket */
  addBet: (choice: 'YES' | 'NO', amountUsdt: number, punterPubkey: string) => void;
  /** @deprecated Use resolveMarketById */
  resolveMarket: (outcome: 'YES' | 'NO') => void;
  /** @deprecated Use disputeMarketById */
  disputeMarket: () => void;
  /** @deprecated Use closeMarketById */
  closeMarket: () => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  markets: [],
  bets: [],
  cumulativePnl: 0,
  walletConnected: false,
  walletBalance: 100,
  punterAddress: '0xPUNTER_' + Math.random().toString(36).slice(2, 8).toUpperCase(),

  // ─────────────────────────────────────────────
  //  Core array-based actions
  // ─────────────────────────────────────────────

  addMarket: (marketId, matchInfo, incidentType, incidentDescription, qvacOdds, bandarStake, creatorPubkey) =>
    set((state) => ({
      markets: [
        ...state.markets,
        {
          market_id: marketId,
          creator_pubkey: creatorPubkey,
          match_info: matchInfo,
          incident_type: incidentType,
          incident_description: incidentDescription,
          qvac_odds: qvacOdds,
          status: 'OPEN',
          created_timestamp: Date.now(),
          frozen_at: null,
          resolved_at: null,
          total_pool: bandarStake,
          bandar_stake: bandarStake,
          resolution_outcome: null,
          emergency_freeze_count: 0,
        },
      ],
    })),

  updateMarketStatus: (id, status) =>
    set((state) => ({
      markets: state.markets.map((m) =>
        m.market_id === id
          ? {
              ...m,
              status,
              ...(status === 'GRACE_PERIOD' ? { grace_period_at: Date.now() } : {}),
            }
          : m
      ),
    })),

  freezeMarketById: (id) =>
    set((state) => ({
      markets: state.markets.map((m) =>
        m.market_id === id && m.status === 'OPEN'
          ? { ...m, status: 'FROZEN_BETTING', frozen_at: Date.now() }
          : m
      ),
    })),

  emergencyFreezeById: (id) =>
    set((state) => ({
      markets: state.markets.map((m) => {
        if (m.market_id !== id || m.status !== 'OPEN') return m;
        const newCount = m.emergency_freeze_count + 1;
        return {
          ...m,
          emergency_freeze_count: newCount,
          ...(newCount >= 3
            ? { status: 'FROZEN_BETTING' as MarketStatus, frozen_at: Date.now() }
            : {}),
        };
      }),
    })),

  addBetToMarket: (marketId, choice, amountUsdt, punterPubkey) =>
    set((state) => {
      const market = state.markets.find((m) => m.market_id === marketId);
      if (!market || market.status !== 'OPEN') {
        console.warn('Bet rejected: Market not open or not found.', marketId);
        return {};
      }
      const newBet: BetRecord = {
        bet_id: `bet_${Math.random().toString(36).substring(2, 11)}`,
        market_id: marketId,
        punter_pubkey: punterPubkey,
        choice,
        amount_usdt: amountUsdt,
        timestamp: Date.now(),
      };
      return {
        bets: [...state.bets, newBet],
        markets: state.markets.map((m) =>
          m.market_id === marketId
            ? { ...m, total_pool: m.total_pool + amountUsdt }
            : m
        ),
      };
    }),

  resolveMarketById: (id, outcome) =>
    set((state) => ({
      markets: state.markets.map((m) =>
        m.market_id === id
          ? { ...m, status: 'AWAITING_CONSENSUS', resolution_outcome: outcome, resolved_at: Date.now() }
          : m
      ),
    })),

  disputeMarketById: (id) =>
    set((state) => ({
      markets: state.markets.map((m) =>
        m.market_id === id ? { ...m, status: 'DISPUTED_FROZEN' } : m
      ),
    })),

  closeMarketById: (id) =>
    set((state) => {
      const market = state.markets.find((m) => m.market_id === id);
      // Idempotent guard: prevents double-close race condition when both tabs
      // hit the end of the 15s consensus countdown at the same millisecond.
      if (!market || market.status === 'CLOSED') return {};

      // Calculate fee earned by bandar on close
      const marketBets = state.bets.filter((b) => b.market_id === id);
      const punterPool = marketBets.reduce((a, b) => a + b.amount_usdt, 0);
      const fee = punterPool * 0.1;

      return {
        markets: state.markets.map((m) =>
          m.market_id === id ? { ...m, status: 'CLOSED' } : m
        ),
        cumulativePnl: state.cumulativePnl + fee,
      };
    }),

  resetStore: () => set({ markets: [], bets: [], cumulativePnl: 0, walletConnected: false, walletBalance: 100 }),

  connectWallet: () => set({ walletConnected: true }),

  // ─────────────────────────────────────────────
  //  Legacy aliases (backward-compat with punter page)
  //  These operate on the FIRST OPEN market found
  // ─────────────────────────────────────────────

  openMarket: (marketId, matchInfo, incidentType, incidentDescription, qvacOdds, bandarStake, creatorPubkey) =>
    get().addMarket(marketId, matchInfo, incidentType, incidentDescription, qvacOdds, bandarStake, creatorPubkey),

  freezeMarket: () => {
    const openMarket = get().markets.find((m) => m.status === 'OPEN');
    if (openMarket) get().freezeMarketById(openMarket.market_id);
  },

  emergencyFreeze: () => {
    const openMarket = get().markets.find((m) => m.status === 'OPEN');
    if (openMarket) get().emergencyFreezeById(openMarket.market_id);
  },

  addBet: (choice, amountUsdt, punterPubkey) => {
    const openMarket = get().markets.find((m) => m.status === 'OPEN');
    if (openMarket) get().addBetToMarket(openMarket.market_id, choice, amountUsdt, punterPubkey);
  },

  resolveMarket: (outcome) => {
    const m = get().markets.find((m) => m.status === 'FROZEN_BETTING' || m.status === 'OPEN');
    if (m) get().resolveMarketById(m.market_id, outcome);
  },

  disputeMarket: () => {
    const m = get().markets.find(
      (m) => m.status === 'FROZEN_BETTING' || m.status === 'AWAITING_CONSENSUS' || m.status === 'GRACE_PERIOD'
    );
    if (m) get().disputeMarketById(m.market_id);
  },

  closeMarket: () => {
    const m = get().markets.find(
      (m) => m.status === 'AWAITING_CONSENSUS' || m.status === 'DISPUTED_FROZEN' || m.status === 'GRACE_PERIOD'
    );
    if (m) get().closeMarketById(m.market_id);
  },
}));

// ─────────────────────────────────────────────
//  Cross-Tab BroadcastChannel Sync (P2P Simulation)
//  Simulates the Pears mesh network between Bandar & Punter tabs.
// ─────────────────────────────────────────────

/** Unique ID per browser tab — used to filter out own broadcast echoes. */
const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).slice(2) : 'ssr';

/** BroadcastChannel for cross-tab state sync (undefined on SSR). */
const channel = typeof window !== 'undefined' ? new BroadcastChannel('p2p_network_sync') : null;

/**
 * Guard flag: set to `true` while we are applying a received message.
 * Prevents the subscribe() broadcaster from re-sending state that originated
 * from another tab, which would create an infinite broadcast loop.
 */
let _isReceiving = false;

// ── Listener: receive broadcasted state from other tabs ──
if (channel) {
  channel.onmessage = (event: MessageEvent) => {
    if (event.data.source === TAB_ID) return; // Ignore echoes from this tab
    _isReceiving = true;
    useMarketStore.setState({
      markets: event.data.markets,
      bets: event.data.bets,
      cumulativePnl: event.data.cumulativePnl,
      walletConnected: event.data.walletConnected,
      walletBalance: event.data.walletBalance,
    });
    _isReceiving = false;
  };
}

// ── Broadcaster: auto-send on every store change via Zustand subscribe ──
// Using subscribe() means we capture ALL actions automatically without
// modifying individual action functions.
if (typeof window !== 'undefined' && channel) {
  useMarketStore.subscribe((state) => {
    if (_isReceiving) return; // Don't re-broadcast state received from another tab
    channel.postMessage({
      source: TAB_ID,
      markets: state.markets,
      bets: state.bets,
      cumulativePnl: state.cumulativePnl,
      walletConnected: state.walletConnected,
      walletBalance: state.walletBalance,
    });
  });
}
