"use client";

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
    const { setPlayerName, setPlayerAddress, setCitizenId, setPlayer } = useGameState();
    const router = useRouter();
    const [step, setStep] = useState<'connect' | 'create' | 'minting' | 'success'>('connect');
    const [name, setName] = useState('');
    const [generatedId, setGeneratedId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // if (!isOpen) return null;

    const handleConnect = async () => {
        setIsLoading(true);
        setError(null);
        console.log("Initiating connection...");

        // Mock connection (replace with valid wallet login logic as needed)
        // In a real app, we'd get the address from the wallet provider
        // For now, we simulate a connection 
        const mockAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Fixed for demo, or random if desired

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 600));

        // setPlayerAddress(mockAddress);

        // Check user registration
        try {
            console.log("Fetching citizen data for:", mockAddress);
            const res = await fetch(`/api/citizen?address=${mockAddress}`);
            console.log("API Response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("User found:", data);
                // User exists!
                setPlayer({
                    address: mockAddress,
                    name: data.name,
                    citizenId: data.citizenId,
                    avatar: data.avatar || "/avatars/golden_avatar.png" // Fallback to default
                });
                setGeneratedId(data.citizenId);
                setName(data.name); // Pre-fill name state for success screen
                setStep('success');
            } else {
                console.log("User not found, proceeding to creation.");
                setPlayerAddress(mockAddress);
                // User is new
                setStep('create');
            }
        } catch (e) {
            console.error("Failed to check registration:", e);
            setError("Connection failed. Please try again.");
            // setStep('create'); // Don't auto-advance on error, let user see it
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name) return;
        setStep('minting');

        const currentAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Matching handleConnect

        try {
            const res = await fetch('/api/citizen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: currentAddress, name: name })
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedId(data.citizenId);
                setPlayer({
                    address: currentAddress,
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
