import { useEffect } from 'react';

// Wallet definitions
const WALLETS = [
    {
        id: 'trust',
        name: 'Trust Wallet',
        sub: 'RECOMMENDED',
        icon: <img src="/trustwallet.svg" alt="Trust Wallet" width="52" height="52" style={{ borderRadius: 14, display: 'block' }} />,
    },
    {
        id: 'metamask',
        name: 'MetaMask',
        sub: '',
        icon: <img src="/metamask.svg" alt="MetaMask" width="52" height="52" style={{ borderRadius: 14, display: 'block' }} />,
    },
];

const WCLogo = () => (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 3.5C7.8 0.2 13.2 0.2 16.5 3.5L17 4C17.2 4.2 17.2 4.5 17 4.7L15.7 6C15.6 6.1 15.3 6.1 15.2 6L14.5 5.3C12.2 3 8.8 3 6.5 5.3L5.8 6C5.7 6.1 5.4 6.1 5.3 6L4 4.7C3.8 4.5 3.8 4.2 4 4L4.5 3.5ZM19 6L20.1 7.1C20.3 7.3 20.3 7.6 20.1 7.8L14.8 13.1C14.6 13.3 14.3 13.3 14.1 13.1L10.5 9.5C10.4 9.4 10.3 9.4 10.2 9.5L6.6 13.1C6.4 13.3 6.1 13.3 5.9 13.1L0.6 7.8C0.4 7.6 0.4 7.3 0.6 7.1L1.7 6C1.9 5.8 2.2 5.8 2.4 6L6 9.6C6.1 9.7 6.2 9.7 6.3 9.6L9.9 6C10.1 5.8 10.4 5.8 10.6 6L14.2 9.6C14.3 9.7 14.4 9.7 14.5 9.6L18.3 6C18.5 5.8 18.8 5.8 19 6Z" fill="white" />
    </svg>
);

const Spinner = ({ size = 44 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTopColor: '#3B99FC',
        animation: 'wcSpin 0.8s linear infinite',
        margin: '0 auto 20px',
    }} />
);

// ── WalletModal ──────────────────────────────────────────────────────────────
// Props:
//   state        — 'wallet-list' | 'connecting' | 'open-wallet' | 'approve-prompt'
//   activeWallet — 'trust' | 'metamask'
//   walletName   — display name
//   deepLink     — URL to open wallet (changes between states)
//   onClose      — close handler (disabled during connect/approve states)
//   onConnect    — called with wallet id
export default function WalletModal({ state, activeWallet, walletName, deepLink, onClose, onConnect }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape' && state === 'wallet-list') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, state]);

    // Prevent closing mid-flow (connecting / signing)
    const canClose = state === 'wallet-list';
    const walletObj = WALLETS.find(w => w.id === activeWallet);

    return (
        <div
            className="wcm-overlay"
            onClick={(e) => { if (e.target === e.currentTarget && canClose) onClose(); }}
        >
            <div className="wcm-sheet">

                {/* Header */}
                <div className="wcm-header">
                    <div className="wcm-header-left">
                        <WCLogo />
                        <span className="wcm-brand">WalletConnect</span>
                    </div>
                    {canClose && (
                        <button className="wcm-close" onClick={onClose}>✕</button>
                    )}
                </div>

                {/* ── wallet-list ── */}
                {state === 'wallet-list' && (
                    <div className="wcm-body">
                        <div className="wcm-body-title">Connect your wallet</div>
                        <div className="wcm-body-sub">On mobile, your wallet app will open automatically.</div>
                        <div className="wcm-wallets">
                            {WALLETS.map((w) => (
                                <button key={w.id} className="wcm-wallet-btn" onClick={() => onConnect(w.id)}>
                                    <div className="wcm-wallet-icon">{w.icon}</div>
                                    <div className="wcm-wallet-name">{w.name}</div>
                                    {w.sub && <div className="wcm-wallet-sub">{w.sub}</div>}
                                </button>
                            ))}
                        </div>
                        <div className="wcm-footer-note">🔒 Secured by WalletConnect v2</div>
                    </div>
                )}

                {/* ── connecting (generating URI) ── */}
                {state === 'connecting' && (
                    <div className="wcm-body" style={{ textAlign: 'center', padding: '36px 20px 44px' }}>
                        <Spinner />
                        <div className="wcm-body-title">Connecting to {walletName}…</div>
                        <div className="wcm-body-sub" style={{ marginBottom: 0 }}>
                            Preparing a secure session, please wait.
                        </div>
                    </div>
                )}

                {/* ── open-wallet (WC URI ready, user must tap to open app) ── */}
                {state === 'open-wallet' && (
                    <div className="wcm-body" style={{ textAlign: 'center', padding: '28px 20px 36px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                            {walletObj?.icon}
                        </div>
                        <div className="wcm-body-title">Open {walletName}</div>
                        <div className="wcm-body-sub">
                            Tap the button below — your wallet app will open.<br />
                            Connect your wallet, then come back here.
                        </div>
                        <a href={deepLink} className="wcm-open-btn" rel="noopener noreferrer">
                            Open {walletName}
                        </a>
                        <div className="wcm-wait-note">Waiting for you to connect in {walletName}…</div>
                    </div>
                )}

                {/* ── approve-prompt (connected! now user must approve tx) ── */}
                {state === 'approve-prompt' && (
                    <div className="wcm-body" style={{ textAlign: 'center', padding: '28px 20px 36px' }}>
                        {/* Green check + wallet icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <span style={{ fontSize: '1.6rem' }}>✅</span>
                            {walletObj?.icon}
                        </div>

                        <div className="wcm-body-title" style={{ color: '#4ade80' }}>
                            Wallet Connected!
                        </div>
                        <div className="wcm-body-sub">
                            <strong style={{ color: '#fff' }}>Now please go back to {walletName}</strong><br />
                            and approve the swap transaction.
                        </div>

                        {/* Open wallet for approval */}
                        <a href={deepLink} className="wcm-open-btn" rel="noopener noreferrer">
                            Go to {walletName} →
                        </a>

                        {/* Pulsing indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#3B99FC',
                                animation: 'wcPulse 1.4s ease-in-out infinite',
                            }} />
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.72rem' }}>
                                Waiting for approval in {walletName}…
                            </span>
                        </div>

                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '.67rem', marginTop: 10 }}>
                            If you rejected, come back here — it will retry automatically.
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
