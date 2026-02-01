'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-[#d4af37] p-8">
            <h2 className="text-2xl font-bold mb-4 tracking-widest">SOMETHING WENT WRONG!</h2>
            <div className="bg-[#1a1a1c] border border-red-500/50 p-4 rounded-lg max-w-2xl overflow-auto mb-6">
                <p className="font-mono text-red-400 mb-2">{error.toString()}</p>
                {error.digest && <p className="text-xs text-gray-500">Digest: {error.digest}</p>}
            </div>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-6 py-2 bg-[#d4af37] text-black font-bold rounded hover:bg-[#b5952f] transition-colors"
            >
                TRY AGAIN
            </button>
        </div>
    );
}
