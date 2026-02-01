"use client";

import React, { useState, useEffect } from 'react';
import { Game } from '@/lib/types';
import { Trash2, Edit2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function AdminGamesPage() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/games');
            if (res.ok) {
                const data = await res.json();
                setGames(data);
            }
        } catch (error) {
            console.error("Failed to fetch games", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this game? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ text: 'Game deleted successfully', type: 'success' });
                fetchGames();
            } else {
                setMessage({ text: 'Failed to delete game', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error occurred during deletion', type: 'error' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/games/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setMessage({ text: `Status updated to ${newStatus}`, type: 'success' });
                fetchGames();
            } else {
                setMessage({ text: 'Failed to update status', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error occurred during update', type: 'error' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting': return <Clock size={14} className="text-blue-400" />;
            case 'starting': return <AlertCircle size={14} className="text-yellow-400 animate-pulse" />;
            case 'playing': return <AlertCircle size={14} className="text-green-400" />;
            case 'finished': return <CheckCircle2 size={14} className="text-gray-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-[#d4af37]/10 pb-6">
                <div>
                    <h2 className="text-4xl font-bold font-rajdhani text-[#d4af37] uppercase tracking-wider">Game Management</h2>
                    <p className="text-gray-400 font-medium tracking-widest mt-2 uppercase text-[10px]">Oversee and control active game sessions</p>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest block">Total Games</span>
                    <span className="text-3xl font-bold font-rajdhani text-white">{games.length}</span>
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded border font-rajdhani uppercase tracking-widest text-sm flex items-center justify-between transition-all ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="text-lg">&times;</button>
                </div>
            )}

            <div className="bg-[#0d0d12]/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-[#d4af37] text-[10px] uppercase tracking-[0.2em] font-bold font-rajdhani">
                            <th className="px-8 py-5">Game Details</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5 text-center">Players</th>
                            <th className="px-8 py-5 text-center">Privacy</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-500 uppercase tracking-widest font-rajdhani animate-pulse">Scanning Neural Network...</td>
                            </tr>
                        ) : games.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-500 uppercase tracking-widest font-rajdhani">No active game sessions detected</td>
                            </tr>
                        ) : (
                            games.map((game) => (
                                <tr key={game.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold font-rajdhani text-white uppercase tracking-wider group-hover:text-[#d4af37] transition-colors">{game.roomId}</span>
                                            <span className="text-[10px] text-gray-500 font-mono tracking-tight mt-1 opacity-50">{game.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {getStatusIcon(game.status)}
                                            <select
                                                value={game.status}
                                                onChange={(e) => updateStatus(game.id, e.target.value)}
                                                className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] uppercase tracking-widest font-bold font-rajdhani text-gray-400 focus:text-white focus:border-[#d4af37]/50 outline-none cursor-pointer"
                                            >
                                                <option value="waiting">Waiting</option>
                                                <option value="starting">Starting</option>
                                                <option value="playing">Playing</option>
                                                <option value="finished">Finished</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-white font-mono font-bold text-lg">{game.players.length} / {game.maxPlayers}</span>
                                            <div className="flex -space-x-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                {game.players.map((p, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border border-[#d4af37]/30 overflow-hidden bg-black" title={p.name}>
                                                        <img src={p.avatar || '/avatars/default.png'} alt={p.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${game.isPrivate ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                            {game.isPrivate ? 'Private' : 'Public'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => handleDelete(game.id)}
                                            className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Terminate Game"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
