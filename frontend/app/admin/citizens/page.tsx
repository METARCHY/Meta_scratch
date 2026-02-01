"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, UserPlus, Check, X, ShieldCheck } from 'lucide-react';

export default function AdminCitizensPage() {
    const [citizens, setCitizens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [editingCitizen, setEditingCitizen] = useState<any | null>(null);

    const fetchCitizens = async () => {
        try {
            const res = await fetch('/api/admin/citizens');
            if (res.ok) {
                const data = await res.json();
                setCitizens(data);
            }
        } catch (error) {
            console.error("Failed to fetch citizens", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitizens();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete citizen ID ${id}?`)) return;

        try {
            const res = await fetch(`/api/admin/citizens/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ text: 'Citizen deleted successfully', type: 'success' });
                fetchCitizens();
            } else {
                setMessage({ text: 'Failed to delete citizen', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error occurred during deletion', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCitizen) return;

        try {
            const res = await fetch(`/api/admin/citizens/${editingCitizen.citizenId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCitizen)
            });
            if (res.ok) {
                setMessage({ text: 'Citizen updated successfully', type: 'success' });
                setEditingCitizen(null);
                fetchCitizens();
            } else {
                setMessage({ text: 'Failed to update citizen', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error occurred during update', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-[#d4af37]/10 pb-6">
                <div>
                    <h2 className="text-4xl font-bold font-rajdhani text-[#d4af37] uppercase tracking-wider">Citizen Management</h2>
                    <p className="text-gray-400 font-medium tracking-widest mt-2 uppercase text-[10px]">Manage registered network participants</p>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest block">Authorized Residents</span>
                    <span className="text-3xl font-bold font-rajdhani text-white">{citizens.length}</span>
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
                            <th className="px-8 py-5">Profile</th>
                            <th className="px-8 py-5">Citizen ID</th>
                            <th className="px-8 py-5">Address</th>
                            <th className="px-8 py-5">Joined At</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-500 uppercase tracking-widest font-rajdhani animate-pulse">Scanning Bio-Database...</td>
                            </tr>
                        ) : citizens.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-500 uppercase tracking-widest font-rajdhani">No registered citizens detected</td>
                            </tr>
                        ) : (
                            citizens.map((citizen) => (
                                <tr key={citizen.citizenId} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full border border-[#d4af37]/30 overflow-hidden bg-black flex-shrink-0 group-hover:border-[#d4af37]/60 transition-colors">
                                                <img src={citizen.avatar || '/avatars/default.png'} alt={citizen.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold font-rajdhani text-white uppercase tracking-wider group-hover:text-[#d4af37] transition-colors">{citizen.name}</span>
                                                <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Resident</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[#d4af37] font-mono font-bold tracking-widest px-3 py-1 bg-[#d4af37]/10 rounded border border-[#d4af37]/20">#{citizen.citizenId}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-gray-400 font-mono text-xs opacity-60 hover:opacity-100 transition-opacity cursor-help" title={citizen.address}>
                                            {citizen.address.slice(0, 8)}...{citizen.address.slice(-6)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">
                                            {new Date(citizen.joinedAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditingCitizen(citizen)}
                                                className="p-3 text-gray-500 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-xl transition-all"
                                                title="Modify Citizen Data"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(citizen.citizenId)}
                                                className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Revoke Citizenship"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingCitizen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <form
                        onSubmit={handleUpdate}
                        className="relative w-full max-w-md bg-[#0d0d12] border border-[#d4af37]/30 rounded-2xl shadow-2xl p-8 space-y-8 animate-in zoom-in-95 duration-300"
                    >
                        <header className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-[#d4af37]" />
                                <h3 className="text-2xl font-bold font-rajdhani text-white uppercase tracking-wider">Modify Record</h3>
                            </div>
                            <button type="button" onClick={() => setEditingCitizen(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </header>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Full Name</label>
                                <input
                                    type="text"
                                    value={editingCitizen.name}
                                    onChange={(e) => setEditingCitizen({ ...editingCitizen, name: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani tracking-widest focus:border-[#d4af37]/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Avatar URL</label>
                                <input
                                    type="text"
                                    value={editingCitizen.avatar}
                                    onChange={(e) => setEditingCitizen({ ...editingCitizen, avatar: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani tracking-widest focus:border-[#d4af37]/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em]">Citizen ID (Immutable)</label>
                                <input
                                    type="text"
                                    value={editingCitizen.citizenId}
                                    readOnly
                                    className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-gray-500 font-mono tracking-widest cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setEditingCitizen(null)}
                                className="flex-1 px-6 py-4 border border-white/10 text-gray-400 font-bold font-rajdhani uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-4 bg-[#d4af37] text-black font-bold font-rajdhani uppercase tracking-widest rounded-xl hover:bg-[#ffe066] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] text-sm flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
