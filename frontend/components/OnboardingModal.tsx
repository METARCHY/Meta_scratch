"use client";

declare global {
    interface Window {
        ethereum?: any;
    }
}

import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { useRouter } from 'next/navigation';
import { Wallet, Check, Loader2, User } from 'lucide-react';
import ConnectWalletFrame from './ConnectWalletFrame';
import MetarchyButton from './MetarchyButton';
import { CitizenIdCard } from './CitizenIdCard';
import { WindowFrame } from './WindowFrame';
import { CompactFrame } from './CompactFrame';

export default function OnboardingModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { player, setPlayerName, setPlayerAddress, setCitizenId, setPlayer } = useGameState();
    const router = useRouter();
    const [step, setStep] = useState<'connect' | 'create' | 'minting' | 'success'>('connect');
    const [name, setName] = useState('');
    const [generatedId, setGeneratedId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // if (!isOpen) return null;

    const handleConnect = async () => {
        if (!window.ethereum) {
            setError("MetaMask not detected. Please install the extension.");
            return;
        }

        setIsLoading(true);
        setError(null);
        console.log("Initiating real wallet connection...");

        try {
            // Request accounts from MetaMask
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                setError("No accounts found. Please unlock MetaMask.");
                setIsLoading(false);
                return;
            }

            const connectedAddress = accounts[0];
            console.log("Connected address:", connectedAddress);
            setPlayerAddress(connectedAddress);

            // Check user registration
            console.log("Fetching citizen data for:", connectedAddress);
            const res = await fetch(`/api/citizen?address=${connectedAddress}`);

            if (res.ok) {
                const data = await res.json();
                console.log("Citizen found:", data);

                // Update status to online
                await fetch('/api/citizen', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: connectedAddress, status: 'online' })
                });

                setPlayer({
                    address: connectedAddress,
                    name: data.name,
                    citizenId: data.citizenId,
                    avatar: data.avatar || "/avatars/golden_avatar.png"
                });
                setGeneratedId(data.citizenId);
                setName(data.name);
                setStep('success');
            } else {
                console.log("Citizen not found, proceeding to creation.");
                setStep('create');
            }
        } catch (e: any) {
            console.error("Wallet connection failed:", e);
            if (e.code === 4001) {
                setError("Connection request rejected by user.");
            } else {
                setError("Failed to connect wallet. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name || !player.address) return;
        setStep('minting');

        try {
            const res = await fetch('/api/citizen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: player.address, name: name })
            });

            if (res.ok) {
                const data = await res.json();

                // Update status to online (Identity just minted)
                await fetch('/api/citizen', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: player.address, status: 'online' })
                });

                setGeneratedId(data.citizenId);
                setPlayer({
                    address: player.address,
                    name: data.name,
                    citizenId: data.citizenId,
                    avatar: data.avatar || "/avatars/golden_avatar.png"
                });
                setStep('success');
            } else {
                console.error("Failed to register");
                setStep('create');
            }
        } catch (e) {
            console.error("Error registering:", e);
            setStep('create');
        }
    };

    const handleEnterGame = () => {
        onClose();
        // We stay on the home page, which now shows the Lobby view because we are logged in.
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={handleBackdropClick}
                >

                    {step === 'connect' && (
                        <ConnectWalletFrame title="CONNECT WALLET">
                            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                            <MetarchyButton onClick={handleConnect} className="w-64" disabled={isLoading}>
                                {isLoading ? "CONNECTING..." : "Connect Metamask"}
                            </MetarchyButton>
                            <MetarchyButton onClick={handleConnect} className="w-64" disabled={isLoading}>
                                {isLoading ? "CONNECTING..." : "Coinbase Wallet"}
                            </MetarchyButton>
                        </ConnectWalletFrame>
                    )}

                    {step === 'create' && (
                        <CompactFrame title="WELCOME NEW CITIZEN">
                            <div className="w-full flex flex-col items-center mt-4">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="ENTER ALIAS"
                                    className="w-[280px] bg-black/50 border border-[#d4af37]/30 rounded text-center py-3 text-[#d4af37] uppercase tracking-widest focus:outline-none focus:border-[#d4af37] transition-colors mb-6 placeholder:text-[#d4af37]/30 text-sm shadow-inner"
                                />
                                <MetarchyButton onClick={handleCreate}>
                                    MINT IDENTITY
                                </MetarchyButton>
                            </div>
                        </CompactFrame>
                    )}

                    {step === 'minting' && (
                        <CompactFrame title="MINTING">
                            <div className="flex flex-col items-center justify-center h-full pb-4">
                                <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mb-4" />
                                <div className="text-center">
                                    <p className="text-[#d4af37] font-bold tracking-widest text-sm mb-2">VERIFYING...</p>
                                    <p className="text-[#d4af37]/50 text-xs uppercase">Please wait</p>
                                </div>
                            </div>
                        </CompactFrame>
                    )}

                    {step === 'success' && (
                        <CompactFrame title="SUCCESS">
                            <div className="flex flex-col items-center w-full gap-2">
                                <div className="flex flex-col items-center gap-1 mb-4">
                                    <span className="text-[#38B74C] font-mono text-2xl font-bold tracking-wider drop-shadow-md">
                                        {name.toUpperCase()}
                                    </span>
                                    <span className="text-[#d4af37] font-mono text-xs tracking-[0.2em] uppercase opacity-80">
                                        ID: {generatedId}
                                    </span>
                                </div>
                                <MetarchyButton onClick={handleEnterGame}>
                                    ENTER METARCHY
                                </MetarchyButton>
                            </div>
                        </CompactFrame>
                    )}

                </div>
            )}
        </>
    );
}
