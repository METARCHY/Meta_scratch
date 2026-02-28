"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin root page.
 * Since /admin itself doesn't have content, we redirect to the first dashboard section (Citizens).
 */
export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/citizens');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-[#d4af37] animate-pulse font-rajdhani text-xl tracking-[0.3em] uppercase">
                Loading Admin OS...
            </div>
        </div>
    );
}
