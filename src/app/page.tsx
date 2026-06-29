"use client";

import React, { useState, useEffect } from 'react';
import { 
  useMarketStore, 
  MarketStatus, 
  BetRecord 
} from '../store/marketStore';
import { 
  Tv, 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  Flame, 
  RotateCcw, 
  WifiOff, 
  Users, 
  DollarSign, 
  Cpu, 
  Wallet, 
  Clock, 
  Terminal, 
  Globe 
} from 'lucide-react';

export default function BandarDashboard() {
  // Client-side hydration safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Zustand Store hooks
  const { 
    market, 
    bets, 
    openMarket, 
    freezeMarket, 
    addBet, 
    resolveMarket, 
    disputeMarket, 
    closeMarket, 
    resetStore 
  } = useMarketStore();

  // Local Form states
  const [incidentType, setIncidentType] = useState('VAR Penalty Check');
  const [customIncident, setCustomIncident] = useState('');
  const [probYes, setProbYes] = useState(60); // Percentage for YES
  const [bandarStake, setBandarStake] = useState(10);
  const [hostAddress, setHostAddress] = useState('0xWDK_Host_0xcHu1o');
  
  // Simulation states
  const [isSimulatingOdds, setIsSimulatingOdds] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[SYSTEM] Node started offline mesh mode.',
    '[PEARS] Offline mesh network initialized via Wi-Fi Local.',
    '[WDK] Host wallet initialized: 0xWDK_Host_0xcHu1o (Balance: 120.00 USDT)'
  ]);

  // Derived variables
  const probNo = 100 - probYes;
  // Calculate QVAC decimal odds (Odds = 1 / probability)
  const qvacOddsYes = Number((1 / (probYes / 100)).toFixed(2));
  const qvacOddsNo = Number((1 / (probNo / 100)).toFixed(2));

  // Helper to add mock terminal logs
  const logMessage = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Run mock QVAC local AI rules processing
  const runMockQVAC = () => {
    setIsSimulatingOdds(true);
    logMessage('[QVAC] Analyzing FIFA rule documents locally...');
    
    setTimeout(() => {
      const randomYesProb = Math.floor(Math.random() * 60) + 20; // 20% to 80%
      setProbYes(randomYesProb);
      setIsSimulatingOdds(false);
      logMessage(`[QVAC] Inference finished: YES Prob: ${randomYesProb}%, NO Prob: ${100 - randomYesProb}%`);
      logMessage(`[QVAC] Suggested Odds computed: YES: ${(1 / (randomYesProb/100)).toFixed(2)}x, NO: ${(1 / ((100 - randomYesProb)/100)).toFixed(2)}x`);
    }, 1200);
  };

  // Handle open market form submission
  const handleOpenMarket = (e: React.FormEvent) => {
    e.preventDefault();
    const finalIncident = incidentType === 'custom' ? customIncident : incidentType;
    if (!finalIncident) return;

    const marketId = `MKT_${Date.now().toString().slice(-6)}`;
    const odds = {
      YES: qvacOddsYes,
      NO: qvacOddsNo
    };

    openMarket(marketId, finalIncident, odds, bandarStake, hostAddress);
    logMessage(`[WDK] Staking escrow: Locked ${bandarStake} USDT as Bandar Guarantee.`);
    logMessage(`[PEARS] Broadcasted New Market: ${marketId} - "${finalIncident}"`);
  };

  // Handle freeze market action
  const handleFreezeMarket = () => {
    freezeMarket();
    logMessage('[PEARS] Broadcasted FREEZE MARKET. Betting locked for all Punters!');
    logMessage('[SYSTEM] Anti-frontrunning protection active.');
  };

  // Simulate a punter placing a bet
  const simulatePunterBet = () => {
    if (!market || market.status !== 'OPEN') {
      logMessage('[WARNING] Cannot simulate bet. Market is not OPEN.');
      return;
    }

    const punterNumber = Math.floor(Math.random() * 100) + 10;
    const punterAddress = `0xWDK_Punter_${punterNumber}`;
    const choice = Math.random() > 0.4 ? 'YES' : 'NO';
    const amount = Math.floor(Math.random() * 15) + 5; // 5 to 20 USDT

    addBet(choice, amount, punterAddress);
    logMessage(`[PEARS] Received Punter Bet: ${punterAddress} placed ${amount} USDT on ${choice}`);
    logMessage(`[WDK] Local Escrow: Locked ${amount} USDT from ${punterAddress}`);
  };

  // Bandar submits resolution
  const handleResolveMarket = (outcome: 'YES' | 'NO') => {
    resolveMarket(outcome);
    logMessage(`[SYSTEM] Bandar input resolution: "${outcome}". Awaiting punter consensus (60s timer)...`);
  };

  // Simulate Punter consensus acceptance
  const simulateConsensusSuccess = () => {
    if (!market || market.status !== 'AWAITING_CONSENSUS') {
      logMessage('[WARNING] Cannot simulate consensus. Market is not awaiting consensus.');
      return;
    }

    closeMarket();
    logMessage('[PEARS] Consensus reached: 100% Punters accepted Bandar decision.');
    
    // Distribute rewards simulation
    const winChoice = market.resolution_outcome;
    const totalWinnings = market.total_pool;
    logMessage(`[WDK] Escrow Unlocked. Distributed ${totalWinnings} USDT offline to winners of "${winChoice}".`);
    logMessage('[SYSTEM] Market status: CLOSED.');
  };

  // Simulate Punter dispute
  const simulatePunterDispute = () => {
    if (!market || market.status !== 'AWAITING_CONSENSUS') {
      logMessage('[WARNING] Cannot simulate dispute. Market is not awaiting consensus.');
      return;
    }

    disputeMarket();
    logMessage('[PEARS] CRITICAL: 3+ Punters submitted DISPUTE! Consensus failed.');
    logMessage('[WDK] Escrow Frozen: Funds locked in Local Vault. Awaiting internet connection for Oracle Resolution.');
  };

  // Simulate internet connection and Oracle resolving dispute with slashing
  const simulateOracleResolution = (fakeTruth: 'YES' | 'NO') => {
    if (!market || market.status !== 'DISPUTED_FROZEN') {
      logMessage('[WARNING] Oracle can only resolve DISPUTED_FROZEN markets.');
      return;
    }

    logMessage('[ORACLE] Internet connection re-established. Fetching official sports API...');
    
    setTimeout(() => {
      const bandarLied = market.resolution_outcome !== fakeTruth;
      logMessage(`[ORACLE] Official Result: "${fakeTruth}". Bandar Outcome Input: "${market.resolution_outcome}".`);

      if (bandarLied) {
        logMessage('[SLASHING] VERDICT: Bandar lied! Slashing active.');
        logMessage(`[WDK] Slashing: Bandar stake (${market.bandar_stake} USDT) confiscated and distributed to Punters.`);
      } else {
        logMessage('[SLASHING] VERDICT: Bandar was honest. Punters disputed maliciously!');
        logMessage('[WDK] Slashing: Disputing punters penalized. 10% of their staked balance slashed.');
      }
      
      closeMarket();
      logMessage('[SYSTEM] Oracle resolved dispute. Escrow released. Market status: CLOSED.');
    }, 1500);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Activity className="animate-spin mr-2 h-5 w-5" /> Inisialisasi Dashboard...
      </div>
    );
  }

  // Calculate pool visual split
  const yesBetsSum = bets.filter(b => b.choice === 'YES').reduce((acc, b) => acc + b.amount_usdt, 0);
  const noBetsSum = bets.filter(b => b.choice === 'NO').reduce((acc, b) => acc + b.amount_usdt, 0);
  const totalPunterBets = yesBetsSum + noBetsSum;
  const yesPercent = totalPunterBets > 0 ? (yesBetsSum / totalPunterBets) * 100 : 50;
  const noPercent = totalPunterBets > 0 ? (noBetsSum / totalPunterBets) * 100 : 50;

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col justify-center items-center p-3 sm:p-6 font-sans antialiased bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
      
      {/* Simulated Phone Container */}
      <div className="w-full max-w-[420px] bg-[#0d0d12]/95 border border-zinc-800/80 rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col h-[880px] max-h-[95vh]">
        
        {/* Mobile Mock Notch & Status Bar */}
        <div className="bg-[#09090d] text-[11px] px-6 py-2.5 flex justify-between items-center text-zinc-500 font-semibold border-b border-zinc-900 select-none">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>14:05</span>
          </div>
          <div className="h-4 w-24 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 border border-zinc-800/30 flex items-center justify-center">
            <span className="h-1.5 w-6 bg-zinc-800 rounded-full"></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-rose-500 bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-900/30">
              <WifiOff className="w-3 h-3 animate-pulse" />
              <span>Offline Mesh Node</span>
            </div>
            <span className="h-3 w-5 bg-zinc-800 rounded-sm border border-zinc-700 relative overflow-hidden">
              <span className="absolute top-0 left-0 bottom-0 w-[80%] bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Header App */}
        <header className="px-5 py-4 bg-[#0d0d12]/40 backdrop-blur-md border-b border-zinc-800/40 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <Tv className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">VAR-Street Bets</h1>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                Bandar Console
              </p>
            </div>
          </div>
          <button 
            onClick={resetStore} 
            className="p-1.5 hover:bg-zinc-800/80 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Reset Store"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </header>

        {/* Scrollable Inner Panel */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-32 scrollbar-none">
          
          {/* Active Market Dashboard */}
          {market ? (
            <div className="space-y-4">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                market.status === 'OPEN' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
                market.status === 'FROZEN_BETTING' ? 'bg-red-950/20 border-red-500/30 text-red-300' :
                market.status === 'AWAITING_CONSENSUS' ? 'bg-violet-950/20 border-violet-500/30 text-violet-300' :
                market.status === 'DISPUTED_FROZEN' ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' :
                'bg-zinc-950/40 border-zinc-800 text-zinc-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider">Status Pasar</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      market.status === 'OPEN' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' :
                      market.status === 'FROZEN_BETTING' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' :
                      market.status === 'AWAITING_CONSENSUS' ? 'bg-violet-400 animate-bounce' :
                      market.status === 'DISPUTED_FROZEN' ? 'bg-amber-500 animate-ping' :
                      'bg-zinc-500'
                    }`}></span>
                    <span className="text-xs font-black uppercase">
                      {market.status === 'OPEN' ? 'Terbuka' :
                       market.status === 'FROZEN_BETTING' ? 'Kunci Taruhan' :
                       market.status === 'AWAITING_CONSENSUS' ? 'Konsensus' :
                       market.status === 'DISPUTED_FROZEN' ? 'Sengketa' : 'Selesai'}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-extrabold text-white mb-0.5">{market.incident_type}</h3>
                <p className="text-[10px] text-zinc-500 font-mono tracking-wide">ID: {market.market_id}</p>
              </div>

              {/* GIGANTIC RED FREEZE BUTTON */}
              {market.status === 'OPEN' && (
                <button
                  onClick={handleFreezeMarket}
                  className="w-full py-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-lg tracking-widest uppercase hover:brightness-110 active:scale-[0.98] transition-all border border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse flex items-center justify-center gap-2"
                >
                  <Flame className="w-5 h-5 fill-white animate-bounce" />
                  FREEZE MARKET
                </button>
              )}

              {/* Pool Status Visualizer */}
              <div className="bg-[#12121a] border border-zinc-800/80 rounded-2xl p-4 space-y-3.5 shadow-md">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-400">Distribusi Taruhan ({bets.length} Petaruh)</h4>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    Total Pool: <span className="text-indigo-400 font-bold">{market.total_pool} USDT</span>
                  </div>
                </div>

                {/* Progress bar split */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full overflow-hidden bg-zinc-800 flex">
                    <div 
                      style={{ width: `${yesPercent}%` }} 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                    ></div>
                    <div 
                      style={{ width: `${noPercent}%` }} 
                      className="bg-gradient-to-l from-rose-500 to-red-500 h-full transition-all duration-500"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      YES: {yesPercent.toFixed(0)}% <span className="text-[10px] text-zinc-500 font-normal">({yesBetsSum} USDT)</span>
                    </span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500 font-normal">({noBetsSum} USDT)</span> NO: {noPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Market Parameters Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#12121a] border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">QVAC Odds AI</span>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-bold">YES</span>
                      <span className="text-white font-mono">{market.qvac_odds.YES.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-rose-400 font-bold">NO</span>
                      <span className="text-white font-mono">{market.qvac_odds.NO.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#12121a] border border-zinc-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Host Stake</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-black text-indigo-400 font-mono">{market.bandar_stake}</span>
                    <span className="text-[10px] text-zinc-500">USDT</span>
                  </div>
                  <span className="text-[8px] text-zinc-600 truncate">{market.creator_pubkey}</span>
                </div>
              </div>

              {/* Resolution Panel for Bandar (Host) */}
              {market.status === 'FROZEN_BETTING' && (
                <div className="bg-[#12121a] border border-red-950/40 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Input Hasil Resmi</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Masukkan hasil keputusan wasit TV untuk memulai konsensus lokal.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleResolveMarket('YES')}
                      className="py-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 font-bold text-xs active:scale-95 transition-all"
                    >
                      Insiden Terjadi (YES)
                    </button>
                    <button
                      onClick={() => handleResolveMarket('NO')}
                      className="py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/40 text-rose-400 font-bold text-xs active:scale-95 transition-all"
                    >
                      Batal / Tidak (NO)
                    </button>
                  </div>
                </div>
              )}

              {/* Consensus Awaiting Indicator */}
              {market.status === 'AWAITING_CONSENSUS' && (
                <div className="bg-[#12121a] border border-violet-900/40 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex justify-center">
                    <Users className="w-6 h-6 text-violet-400 animate-bounce" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Menunggu Konsensus Petaruh</h4>
                  <p className="text-[10px] text-zinc-400">
                    Bandar telah menginput hasil <span className="text-violet-400 font-bold">"{market.resolution_outcome}"</span>. Petaruh lokal memiliki waktu 60 detik untuk menerima hasil atau mengajukan sengketa.
                  </p>
                </div>
              )}

              {/* Disputed State Indicator */}
              {market.status === 'DISPUTED_FROZEN' && (
                <div className="bg-[#12121a] border border-amber-900/40 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">PASAR DISENGKETAKAN</h4>
                  <p className="text-[10px] text-zinc-400">
                    Dana taruhan dibekukan di local vault. Hubungkan node ke jaringan internet publik untuk memanggil Oracle API.
                  </p>
                </div>
              )}

            </div>
          ) : (
            // No Active Market - Render Creation Form
            <form onSubmit={handleOpenMarket} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Buka Pasar Taruhan Baru</h2>
              </div>

              {/* Incident Type Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Jenis Insiden</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'VAR Penalty Check',
                    'Red Card Review',
                    'Offside Review'
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setIncidentType(type);
                        setCustomIncident('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                        incidentType === type
                          ? 'bg-indigo-950/20 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                          : 'bg-[#12121a] border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIncidentType('custom')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      incidentType === 'custom'
                        ? 'bg-indigo-950/20 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                        : 'bg-[#12121a] border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    Ketik Kustom...
                  </button>
                </div>

                {incidentType === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Handsball Penalti Check"
                    value={customIncident}
                    onChange={(e) => setCustomIncident(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-[#12121a] border border-zinc-800/80 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                )}
              </div>

              {/* QVAC Odds Calculator Section */}
              <div className="bg-[#12121a] border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Otak AI Lokal (QVAC SDK)</span>
                  </div>
                  <button
                    type="button"
                    onClick={runMockQVAC}
                    disabled={isSimulatingOdds}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-[10px] font-black rounded-lg text-white transition-colors active:scale-95 flex items-center gap-1.5"
                  >
                    {isSimulatingOdds ? (
                      <>
                        <Activity className="w-3 h-3 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      'Inference Rules'
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 font-semibold">Probabilitas YES:</span>
                    <span className="text-indigo-300 font-bold">{probYes}%</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="90"
                    value={probYes}
                    onChange={(e) => setProbYes(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  
                  {/* Odds computation result banner */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
                    <div className="text-center p-2 rounded-xl bg-zinc-950 border border-zinc-900">
                      <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide mb-0.5">Odds YES</p>
                      <p className="text-sm font-black text-emerald-400 font-mono">{qvacOddsYes.toFixed(2)}x</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-zinc-950 border border-zinc-900">
                      <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wide mb-0.5">Odds NO</p>
                      <p className="text-sm font-black text-rose-400 font-mono">{qvacOddsNo.toFixed(2)}x</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stake & Wallet Config */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Jaminan Bandar</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="5"
                      value={bandarStake}
                      onChange={(e) => setBandarStake(Math.max(5, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121a] border border-zinc-800/80 text-xs text-white font-bold font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-500">USDT</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Alamat Wallet</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={hostAddress}
                      onChange={(e) => setHostAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12121a] border border-zinc-800/80 text-[10px] text-zinc-400 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <Wallet className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(79,70,229,0.35)] mt-2"
              >
                STAKE & SIARKAN PASAR
              </button>
            </form>
          )}

          {/* Transactions Bet List */}
          <div className="bg-[#12121a]/60 border border-zinc-800/40 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Taruhan (P2P Mesh)</span>
              <span className="text-[10px] font-mono text-zinc-600">{bets.length} Bets</span>
            </h4>
            
            {bets.length === 0 ? (
              <div className="py-6 text-center text-zinc-600 text-[11px] border border-dashed border-zinc-900 rounded-xl">
                Belum ada taruhan masuk dari Punter sekitar.
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-850">
                {bets.slice().reverse().map((bet) => (
                  <div 
                    key={bet.bet_id}
                    className="p-2.5 bg-zinc-950/70 border border-zinc-900 rounded-xl flex items-center justify-between hover:border-zinc-800 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-zinc-300 font-mono truncate max-w-[120px]">
                        {bet.punter_pubkey}
                      </p>
                      <p className="text-[9px] text-zinc-600">
                        {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${
                        bet.choice === 'YES' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' 
                          : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                      }`}>
                        {bet.choice}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">{bet.amount_usdt} USDT</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Console Log */}
          <div className="bg-black/80 border border-zinc-900 rounded-xl p-3.5 font-mono text-[9px] text-zinc-400 space-y-2">
            <div className="flex items-center justify-between text-zinc-600 border-b border-zinc-950 pb-1.5 mb-1">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3" /> NODE LOGS (Mesh Debug)
              </span>
              <button 
                onClick={() => setConsoleLogs([])} 
                className="hover:text-zinc-400 hover:underline transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-none">
              {consoleLogs.slice(-10).map((log, i) => (
                <div key={i} className="leading-relaxed truncate hover:text-white transition-colors">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SIMULATION PANEL (Sticky / Collapsible bottom panel) */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0d0d12]/95 border-t border-zinc-800/80 px-4 py-3 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Simulation Console
            </span>
            <span className="text-[8px] text-zinc-500 font-mono">P2P Network Mock</span>
          </div>

          {/* Grid buttons to trigger mock events */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            
            {/* Bet simulation */}
            <button
              type="button"
              onClick={simulatePunterBet}
              disabled={!market || market.status !== 'OPEN'}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Punter Bet
            </button>

            {/* Dispute Simulation */}
            <button
              type="button"
              onClick={simulatePunterDispute}
              disabled={!market || market.status !== 'AWAITING_CONSENSUS'}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Dispute Punter
            </button>

            {/* Consensus Success Simulation */}
            <button
              type="button"
              onClick={simulateConsensusSuccess}
              disabled={!market || market.status !== 'AWAITING_CONSENSUS'}
              className="py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-white font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Accept Consensus
            </button>

            {/* Oracle Dispute Solver */}
            {market?.status === 'DISPUTED_FROZEN' ? (
              <div className="col-span-2 grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900 mt-1">
                <button
                  type="button"
                  onClick={() => simulateOracleResolution('YES')}
                  className="py-1.5 px-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-lg text-indigo-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Globe className="w-3 h-3 animate-spin" /> Oracle: YES
                </button>
                <button
                  type="button"
                  onClick={() => simulateOracleResolution('NO')}
                  className="py-1.5 px-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-lg text-indigo-400 font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Globe className="w-3 h-3 animate-spin" /> Oracle: NO
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="py-1.5 px-2 bg-zinc-950 border border-zinc-900/40 rounded-lg text-zinc-700 font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Globe className="w-3 h-3" />
                Oracle Inactive
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
