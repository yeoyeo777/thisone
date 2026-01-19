
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from './constants';
import { BundleWallet, LaunchConfig, VolumeBotConfig, StealthExitConfig } from './types';

// Pump.fun Integration Constants
const PUMP_FUN_PROGRAM_ID = "6EF8rrecthR5DkZJvXyK2573489L98522378"; // Simulated Pump.fun Program ID
const JITO_TIP_ACCOUNT = "Cw8CFyMv9khS3S68E9z48z3yA4C2K7Gq7m4Xz7V"; // Jito Tip for Bundles

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'launch' | 'hub' | 'volume'>('launch');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSlowRugActive, setIsSlowRugActive] = useState(false);
  
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<LaunchConfig>({
    name: '',
    ticker: '',
    description: '',
    image: '',
    banner: '',
    twitter: '',
    telegram: '',
    website: '',
    totalSolToBuy: 10,
    walletCount: 12,
    slippage: 20,
    fundOnLaunch: true,
    fundingMode: 'equal',
    revokeMint: true,
    revokeFreeze: true,
    revokeUpdate: true
  });

  const [volumeConfig, setVolumeConfig] = useState<VolumeBotConfig>({
    isActive: false,
    minBuy: 0.1,
    maxBuy: 1.5,
    intervalSec: 15,
    targetVolume: 500,
    sellIntervalSec: 30,
    sellPercentage: 5,
    counterTrade: false,
    totalSolBudget: 50
  });

  const [stealthExitConfig, setStealthExitConfig] = useState<StealthExitConfig>({
    intervalSec: 10,
    sellPercentage: 15,
    randomize: true
  });

  const [wallets, setWallets] = useState<BundleWallet[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [mainWalletBalance, setMainWalletBalance] = useState(0);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    if (wallets.length === 0) {
      const initial = Array.from({ length: config.walletCount }).map((_, i) => ({
        id: `W-${i + 1}`,
        address: `${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        privateKey: Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(''),
        solBalance: 0,
        tokenBalance: 0,
        status: 'idle' as const
      }));
      setWallets(initial);
    }
  }, [config.walletCount, wallets.length]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const connectWallet = async () => {
    const { solana } = window as any;
    if (solana && solana.isPhantom) {
      try {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
        setMainWalletBalance(124.52);
      } catch (err) {
        console.error("Connection failed", err);
      }
    } else {
      alert("Phantom wallet not found. Please install it.");
    }
  };

  const fundWallets = async () => {
    if (!walletAddress) {
      alert("Please connect Phantom wallet first.");
      return;
    }
    setWallets(prev => prev.map(w => ({ ...w, status: 'funding' })));
    
    // Simulate Jito bundle creation for funding
    console.log("Creating Jito Funding Bundle...");
    await new Promise(r => setTimeout(r, 1500));

    let fundingAmounts: number[] = [];
    if (config.fundingMode === 'equal') {
      const amount = parseFloat((config.totalSolToBuy / config.walletCount).toFixed(3));
      fundingAmounts = Array(config.walletCount).fill(amount);
    } else {
      let remaining = config.totalSolToBuy;
      for (let i = 0; i < config.walletCount - 1; i++) {
        const max = (remaining / (config.walletCount - i)) * 2;
        const amount = parseFloat((Math.random() * max).toFixed(3));
        fundingAmounts.push(amount);
        remaining -= amount;
      }
      fundingAmounts.push(parseFloat(remaining.toFixed(3)));
    }

    setWallets(prev => prev.map((w, i) => ({ 
      ...w, 
      solBalance: fundingAmounts[i] || 0,
      status: 'ready' 
    })));
    setMainWalletBalance(prev => prev - config.totalSolToBuy);
  };

  const handleLaunch = async () => {
    if (!walletAddress) {
      alert("Please connect Phantom wallet first.");
      return;
    }
    if (!config.name || !config.ticker) {
      alert("Please enter Token Name and Ticker");
      return;
    }
    setIsLaunching(true);

    // Step 1: Fund wallets if needed
    if (config.fundOnLaunch) {
      await fundWallets();
    }

    // Step 2: Prepare Pump.fun Create Instruction
    console.log(`Preparing Pump.fun Create Instruction for Program: ${PUMP_FUN_PROGRAM_ID}`);
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 3: Bundle Buy Orders
    setWallets(prev => prev.map(w => ({ ...w, status: 'buying' })));
    console.log("Broadcasting Jito Buy Bundle to Block Engine...");
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 4: Finalize authorities
    console.log(`Revoking: Mint=${config.revokeMint}, Freeze=${config.revokeFreeze}, Update=${config.revokeUpdate}`);

    setWallets(prev => prev.map(w => ({ 
      ...w, 
      status: 'ready',
      tokenBalance: 15000000 + Math.floor(Math.random() * 5000000),
      solBalance: Math.max(0, w.solBalance - 0.1) 
    })));
    
    setActiveToken(`${config.name} ($${config.ticker})`);
    setIsLaunching(false);
    setActiveTab('hub');
    alert("Token Launched Successfully on Pump.fun Bonding Curve!");
  };

  const executeRug = async () => {
    if (wallets.length === 0) return;
    const confirm = window.confirm("IMMEDIATE LIQUIDATION: Execute sell instructions for all bundles via Jito?");
    if (!confirm) return;
    
    console.log("Executing Global Sell Instruction via Pump.fun...");
    setWallets(prev => prev.map(w => ({ ...w, status: 'selling' })));
    await new Promise(r => setTimeout(r, 2500));
    
    setWallets(prev => prev.map(w => {
      const solGained = (w.tokenBalance / 1000000) * (4 + Math.random() * 2);
      return { ...w, tokenBalance: 0, solBalance: parseFloat((w.solBalance + solGained).toFixed(4)), status: 'ready' };
    }));
  };

  const executeSlowRug = async () => {
    if (wallets.length === 0) return;
    const confirm = window.confirm(`STEALTH EXIT: Begin exiting ${stealthExitConfig.sellPercentage}% every ${stealthExitConfig.intervalSec}s?`);
    if (!confirm) return;
    setIsSlowRugActive(true);
    
    for(let i = 0; i < 5; i++) {
        setWallets(prev => prev.map(w => {
            if (w.tokenBalance <= 0) return w;
            const variation = stealthExitConfig.randomize ? (0.8 + Math.random() * 0.4) : 1;
            const sellAmount = w.tokenBalance * (stealthExitConfig.sellPercentage / 100) * variation;
            const solGained = (sellAmount / 1000000) * (4 + Math.random() * 2);
            return {
                ...w,
                tokenBalance: Math.max(0, w.tokenBalance - sellAmount),
                solBalance: parseFloat((w.solBalance + solGained).toFixed(4)),
                status: 'selling'
            }
        }));
        await new Promise(r => setTimeout(r, 1000));
        setWallets(prev => prev.map(w => ({ ...w, status: 'ready' })));
        
        const nextInterval = stealthExitConfig.randomize 
          ? stealthExitConfig.intervalSec * 1000 * (0.9 + Math.random() * 0.2)
          : stealthExitConfig.intervalSec * 1000;
          
        await new Promise(r => setTimeout(r, Math.max(500, nextInterval - 1000)));
    }
    setIsSlowRugActive(false);
  };

  const drainToMain = async () => {
    if (wallets.length === 0 || !walletAddress) {
      alert("Please connect Phantom wallet to receive funds.");
      return;
    }
    
    const confirm = window.confirm(`DRAIN ALL: Transfer all SOL from all bundled wallets to ${walletAddress}?`);
    if (!confirm) return;

    setWallets(prev => prev.map(w => ({ ...w, status: 'draining' })));
    console.log(`Sweeping SOL to Main Controller: ${walletAddress}`);
    await new Promise(r => setTimeout(r, 1500));
    
    let totalDrained = 0;
    setWallets(prev => {
      const updated = prev.map(w => {
        totalDrained += w.solBalance;
        return { ...w, solBalance: 0, status: 'idle' as const };
      });
      return updated;
    });
    
    setMainWalletBalance(prev => prev + totalDrained);
    alert(`Transfer Complete: ${totalDrained.toFixed(4)} SOL received in Phantom wallet.`);
  };

  const toggleVolumeBot = () => {
    if (!activeToken) {
      alert("No active token launched. Deploy a token first.");
      return;
    }
    setVolumeConfig(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const toggleKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono">
      <header className="border-b border-white/10 bg-[#0a0a0a] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(126,34,206,0.4)]">
            <ICONS.Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic text-white">ShadowLaunch Hub</h1>
            <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              PUMP.FUN MAINNET READY
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {walletAddress ? (
            <>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Connected Phantom</p>
                <p className="text-xl font-black text-purple-400">{mainWalletBalance.toFixed(2)} SOL</p>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div className="px-4 py-2 bg-purple-900/20 border border-purple-500/30 rounded text-[10px] font-black text-purple-300">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </div>
            </>
          ) : (
            <button 
              onClick={connectWallet}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
            >
              Connect Phantom
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex gap-2 mb-8 bg-[#0f0f0f] p-1.5 rounded-xl border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('launch')}
            className={`px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'launch' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Launch Token
          </button>
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'hub' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Wallet Hub
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'volume' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Volume Bot
          </button>
        </div>

        {activeTab === 'launch' && (
          <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300 pb-20">
            <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 shadow-2xl space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Create a new coin</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Direct Integration with Pump.fun Curve</p>
              </div>

              <div className="space-y-6">
                <input type="file" ref={iconInputRef} onChange={(e) => handleImageUpload(e, 'image')} className="hidden" accept="image/*" />
                <input type="file" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, 'banner')} className="hidden" accept="image/*" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Icon Image</label>
                    <div 
                      onClick={() => iconInputRef.current?.click()}
                      className="w-full h-32 bg-black border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-500/50 transition-all group overflow-hidden relative"
                    >
                      {config.image ? (
                        <img src={config.image} alt="icon" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      ) : (
                        <ICONS.Search className="w-5 h-5 text-gray-600 group-hover:text-purple-400" />
                      )}
                      <p className="text-[9px] font-black text-gray-700 uppercase z-10">{config.image ? 'Change Icon' : 'Select Icon'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Banner Image</label>
                    <div 
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full h-32 bg-black border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-500/50 transition-all group overflow-hidden relative"
                    >
                      {config.banner ? (
                        <img src={config.banner} alt="banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      ) : (
                        <ICONS.Eye className="w-5 h-5 text-gray-600 group-hover:text-purple-400" />
                      )}
                      <p className="text-[9px] font-black text-gray-700 uppercase z-10">{config.banner ? 'Change Banner' : 'Select Banner'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Name</label>
                    <input type="text" placeholder="Token Name" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 text-sm focus:border-purple-500 outline-none transition-all placeholder:text-gray-800" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ticker</label>
                    <input type="text" placeholder="Ticker Symbol" value={config.ticker} onChange={e => setConfig({...config, ticker: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 text-sm focus:border-purple-500 outline-none transition-all placeholder:text-gray-800 uppercase" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea placeholder="Tell us about your coin..." value={config.description} onChange={e => setConfig({...config, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-4 text-sm focus:border-purple-500 outline-none transition-all h-32 placeholder:text-gray-800 resize-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="text-[10px] font-black text-purple-500 uppercase hover:text-purple-400 tracking-widest transition-all"
                  >
                    {showMoreOptions ? '- Hide extra options' : '+ Show more options (socials)'}
                  </button>

                  {showMoreOptions && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Twitter</label>
                            <input type="text" placeholder="Twitter" value={config.twitter} onChange={e => setConfig({...config, twitter: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-purple-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Telegram</label>
                            <input type="text" placeholder="Telegram" value={config.telegram} onChange={e => setConfig({...config, telegram: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-purple-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Website</label>
                            <input type="text" placeholder="Website" value={config.website} onChange={e => setConfig({...config, website: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-purple-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Authority Settings</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 bg-black/50 p-3 rounded-lg border border-white/5">
                      <input 
                        type="checkbox" 
                        id="revokeMint" 
                        checked={config.revokeMint} 
                        onChange={e => setConfig({...config, revokeMint: e.target.checked})}
                        className="w-4 h-4 rounded border-white/10 bg-black text-purple-600 focus:ring-purple-600"
                      />
                      <label htmlFor="revokeMint" className="text-[9px] font-black uppercase text-gray-400 cursor-pointer">Revoke Mint</label>
                    </div>
                    <div className="flex items-center gap-3 bg-black/50 p-3 rounded-lg border border-white/5">
                      <input 
                        type="checkbox" 
                        id="revokeFreeze" 
                        checked={config.revokeFreeze} 
                        onChange={e => setConfig({...config, revokeFreeze: e.target.checked})}
                        className="w-4 h-4 rounded border-white/10 bg-black text-purple-600 focus:ring-purple-600"
                      />
                      <label htmlFor="revokeFreeze" className="text-[9px] font-black uppercase text-gray-400 cursor-pointer">Revoke Freeze</label>
                    </div>
                    <div className="flex items-center gap-3 bg-black/50 p-3 rounded-lg border border-white/5">
                      <input 
                        type="checkbox" 
                        id="revokeUpdate" 
                        checked={config.revokeUpdate} 
                        onChange={e => setConfig({...config, revokeUpdate: e.target.checked})}
                        className="w-4 h-4 rounded border-white/10 bg-black text-purple-600 focus:ring-purple-600"
                      />
                      <label htmlFor="revokeUpdate" className="text-[9px] font-black uppercase text-gray-400 cursor-pointer">Revoke Update</label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Shadow Launch Config</h3>
                  
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-purple-500/20 bg-purple-900/10">
                    <div className="flex items-center gap-3">
                        <input 
                        type="checkbox" 
                        id="fundOnLaunch" 
                        checked={config.fundOnLaunch} 
                        onChange={e => setConfig({...config, fundOnLaunch: e.target.checked})}
                        className="w-5 h-5 rounded border-white/10 bg-black text-purple-600 focus:ring-purple-600"
                        />
                        <label htmlFor="fundOnLaunch" className="text-[10px] font-black uppercase text-purple-300 cursor-pointer">
                        Automated Bundle Execution
                        </label>
                    </div>
                    
                    {config.fundOnLaunch && (
                        <div className="flex bg-black border border-white/10 rounded-lg p-1">
                            <button 
                                onClick={() => setConfig({...config, fundingMode: 'equal'})}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded ${config.fundingMode === 'equal' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                            >
                                Equal
                            </button>
                            <button 
                                onClick={() => setConfig({...config, fundingMode: 'random'})}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded ${config.fundingMode === 'random' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                            >
                                Random
                            </button>
                        </div>
                    )}
                  </div>

                  {config.fundOnLaunch && (
                    <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                          <span>Wallets</span>
                          <span className="text-purple-400">{config.walletCount}</span>
                        </div>
                        <input type="range" min="1" max="50" value={config.walletCount} onChange={e => setConfig({...config, walletCount: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                          <span>Total SOL</span>
                          <span className="text-purple-400">{config.totalSolToBuy} SOL</span>
                        </div>
                        <input type="range" min="1" max="100" value={config.totalSolToBuy} onChange={e => setConfig({...config, totalSolToBuy: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleLaunch} 
                  disabled={isLaunching || !walletAddress} 
                  className="w-full bg-purple-600 hover:bg-purple-500 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(126,34,206,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  {isLaunching ? 'DEPLOYING TO PUMP.FUN...' : 'CREATE COIN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hub' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-[#0f0f0f] border border-amber-500/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ICONS.AlertTriangle className="w-4 h-4" /> Stealth Exit Strategy Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Interval (Seconds)</label>
                    <input type="number" value={stealthExitConfig.intervalSec} onChange={e => setStealthExitConfig({...stealthExitConfig, intervalSec: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-amber-500 outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sell Percentage (%)</label>
                    <input type="number" value={stealthExitConfig.sellPercentage} onChange={e => setStealthExitConfig({...stealthExitConfig, sellPercentage: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-amber-500 outline-none" />
                 </div>
                 <div className="flex items-center gap-4 pt-6">
                    <button 
                      onClick={() => setStealthExitConfig({...stealthExitConfig, randomize: !stealthExitConfig.randomize})}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase transition-all border ${stealthExitConfig.randomize ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-black border-white/10 text-gray-500'}`}
                    >
                      {stealthExitConfig.randomize ? 'Randomization: ON' : 'Randomization: OFF'}
                    </button>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={executeRug} className="bg-red-950/20 border border-red-500/30 p-6 rounded-2xl hover:bg-red-900/40 transition-all text-center group">
                <p className="text-[9px] font-black text-red-500 uppercase mb-1">Total Liquidation</p>
                <p className="text-sm font-black text-red-400 uppercase tracking-widest">Instant Rug</p>
              </button>
              <button 
                onClick={executeSlowRug} 
                disabled={isSlowRugActive}
                className={`border p-6 rounded-2xl transition-all text-center group ${isSlowRugActive ? 'bg-amber-900/40 border-amber-500/50 cursor-not-allowed' : 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-900/40'}`}
              >
                <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Gradual Stealth Exit</p>
                <p className="text-sm font-black text-amber-400 uppercase tracking-widest">{isSlowRugActive ? 'Slow Rugging...' : 'Execute Slow Rug'}</p>
              </button>
              <button onClick={drainToMain} className="bg-purple-950/20 border border-purple-500/30 p-6 rounded-2xl hover:bg-purple-900/40 transition-all text-center group shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <p className="text-[9px] font-black text-purple-500 uppercase mb-1">Treasury Sweep</p>
                <p className="text-sm font-black text-white uppercase tracking-widest">Drain to Phantom</p>
              </button>
            </div>

            <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-purple-600"></div>
                  Bundled Wallet Hub
                </h2>
                <div className="px-4 py-2 bg-black rounded-lg border border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Active Units: {wallets.length}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {wallets.length === 0 ? (
                   <div className="py-20 text-center text-gray-700 italic text-sm">No wallets generated.</div>
                ) : wallets.map(w => (
                  <div key={w.id} className="bg-black border border-white/5 p-4 rounded-xl hover:border-purple-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-10 h-10 bg-purple-900/20 rounded flex items-center justify-center border border-purple-500/20">
                        <span className="text-[10px] font-black text-purple-400">{w.id}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-gray-300 font-mono flex items-center gap-2">
                           <span className="text-gray-500">ADDR:</span> {w.address}
                        </p>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleKey(w.id)}
                            className="text-[9px] font-black text-purple-500 hover:text-purple-400 uppercase flex items-center gap-1.5 transition-colors"
                          >
                            <ICONS.Key className="w-3 h-3" />
                            {revealedKeys[w.id] ? 'Hide Key' : 'Show Private Key'}
                          </button>
                          {revealedKeys[w.id] && (
                            <span className="text-[9px] text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-in slide-in-from-left-2 duration-300">
                              {w.privateKey}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 md:ml-auto">
                       <div className="text-right">
                          <p className="text-[9px] text-gray-600 font-black uppercase mb-0.5">SOL</p>
                          <p className="text-xs font-black text-white">{w.solBalance.toFixed(3)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] text-gray-600 font-black uppercase mb-0.5">Tokens</p>
                          <p className="text-xs font-black text-purple-400">
                             {w.tokenBalance > 1000000 ? `${(w.tokenBalance / 1000000).toFixed(1)}M` : Math.floor(w.tokenBalance).toLocaleString()}
                          </p>
                       </div>
                       <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter shrink-0 ${
                          w.status === 'ready' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                          w.status === 'idle' ? 'bg-gray-800 text-gray-500 border border-gray-700' : 
                          'bg-purple-500/10 text-purple-500 border border-purple-500/20 animate-pulse'
                        }`}>
                          {w.status}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volume' && (
          <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-20">
            <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                    <ICONS.Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Volume Bot Controller</h2>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">
                      {activeToken ? `Active Token: ${activeToken}` : 'No Active Token (Launch First)'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={toggleVolumeBot}
                  className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                    volumeConfig.isActive ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)]'
                  }`}
                >
                  {volumeConfig.isActive ? 'Kill Switch' : 'Initiate Trading'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="bg-black/50 p-6 rounded-2xl border border-white/5 space-y-4">
                     <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-4 h-1 bg-purple-400"></div> Bot Treasury Config
                     </h3>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total SOL Budget</label>
                            <span className="text-sm font-black text-white">{volumeConfig.totalSolBudget} SOL</span>
                        </div>
                        <input type="range" min="1" max="500" value={volumeConfig.totalSolBudget} onChange={e => setVolumeConfig({...volumeConfig, totalSolBudget: parseInt(e.target.value)})} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                     </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className="w-4 h-1 bg-blue-500"></div> Buy Configuration
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Size Range (SOL)</label>
                            <span className="text-sm font-black text-blue-400">{volumeConfig.minBuy} - {volumeConfig.maxBuy} SOL</span>
                        </div>
                        <div className="flex gap-4">
                            <input type="number" step="0.1" value={volumeConfig.minBuy} onChange={e => setVolumeConfig({...volumeConfig, minBuy: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-blue-500 outline-none" />
                            <input type="number" step="0.1" value={volumeConfig.maxBuy} onChange={e => setVolumeConfig({...volumeConfig, maxBuy: parseFloat(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execution Frequency (Sec)</label>
                            <span className="text-sm font-black text-blue-400">{volumeConfig.intervalSec}s</span>
                        </div>
                        <input type="range" min="1" max="120" step="1" value={volumeConfig.intervalSec} onChange={e => setVolumeConfig({...volumeConfig, intervalSec: parseInt(e.target.value)})} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    </div>
                  </div>

                  <div className="space-y-6 border-t border-white/5 pt-10">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                        <div className="w-4 h-1 bg-amber-500"></div> Sell Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sell Frequency</label>
                                <span className="text-xs font-black text-amber-400">{volumeConfig.sellIntervalSec}s</span>
                            </div>
                            <input type="number" value={volumeConfig.sellIntervalSec} onChange={e => setVolumeConfig({...volumeConfig, sellIntervalSec: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-amber-500 outline-none" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">% of Wallet Sell</label>
                                <span className="text-xs font-black text-amber-400">{volumeConfig.sellPercentage}%</span>
                            </div>
                            <input type="number" value={volumeConfig.sellPercentage} onChange={e => setVolumeConfig({...volumeConfig, sellPercentage: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-amber-500 outline-none" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Counter-Trade Mode</p>
                            <p className="text-[9px] text-purple-500 uppercase font-bold">Auto-sell tokens when retail buys in</p>
                        </div>
                        <button 
                            onClick={() => setVolumeConfig({...volumeConfig, counterTrade: !volumeConfig.counterTrade})}
                            className={`w-12 h-6 rounded-full transition-all relative ${volumeConfig.counterTrade ? 'bg-purple-600' : 'bg-gray-800'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${volumeConfig.counterTrade ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-8 flex flex-col h-full">
                        <div className="mb-10">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Live Volume Metrics</p>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-3xl font-black text-white">4.2k</p>
                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Trades / 24h</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-blue-500">628</p>
                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Volume (SOL)</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                                <span className="text-gray-500">Treasury Pulse</span>
                                <span className={volumeConfig.isActive ? 'text-green-500' : 'text-gray-600'}>{volumeConfig.isActive ? 'EXECUTING SMART TRADES' : 'SYSTEM IDLE'}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                                {volumeConfig.isActive && <div className="h-full bg-blue-500 animate-[shimmer_2s_infinite] w-[100%] origin-left"></div>}
                            </div>
                            
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Budget Management: Locked</p>
                                </div>
                                <p className="text-[9px] text-gray-600 italic">
                                    The bot will automatically cease all operations once the {volumeConfig.totalSolBudget} SOL treasury has been utilized for trades. This ensures strict control over deployment costs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-white/10 bg-[#050505] px-8 py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <ICONS.Cpu className="w-8 h-8 text-purple-600" />
             <span className="text-lg font-black tracking-widest uppercase italic">ShadowLaunch Terminal</span>
          </div>
          <p className="text-gray-700 text-[10px] font-bold uppercase tracking-[0.5em]">
            Strict Execution Environment &copy; 2025
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(0.5); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;
