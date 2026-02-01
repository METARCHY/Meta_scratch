"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Gamepad2, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Games', icon: Gamepad2, path: '/admin/games' },
        { name: 'Citizens', icon: Users, path: '/admin/citizens' },
    ];

    return (
        <main className="relative w-full h-screen overflow-hidden bg-black text-white font-sans flex text-xs tracking-widest">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img src="/backgrounds/verified_bg.jpg" alt="Background" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            </div>

            {/* Sidebar Navigation */}
            <aside className="relative z-10 w-72 h-full border-r border-[#d4af37]/20 bg-[#0d0d12]/60 backdrop-blur-xl flex flex-col p-8 select-none">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold font-rajdhani text-[#d4af37] tracking-[0.2em] uppercase italic">ADMIN</h1>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-medium mt-1">Metarchy OS v1.0</p>
                </div>

                <nav className="flex-1 space-y-6">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-4 px-6 py-4 rounded-lg transition-all border ${isActive
                                        ? 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                        : 'border-transparent text-gray-400 hover:text-white hover:border-white/10'
                                    } group`}
                            >
                                <Icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                                <span className="font-bold font-rajdhani text-lg uppercase tracking-widest">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-8 border-t border-[#d4af37]/10">
                    <Link href="/" className="flex items-center gap-4 px-6 py-4 text-gray-500 hover:text-red-400 transition-colors uppercase font-bold font-rajdhani text-sm tracking-widest">
                        <LogOut size={18} />
                        <span>Exit Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <section className="relative z-10 flex-1 h-full overflow-y-auto bg-[#0d0d12]/20">
                <div className="p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </section>
        </main>
    );
}
