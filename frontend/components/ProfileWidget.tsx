import React from 'react';
import { useGameState } from '../context/GameStateContext';

export default function ProfileWidget() {
    const { player, setPlayer } = useGameState();

    if (!player || !player.citizenId || player.citizenId === "0000") return null;

    const handleLogout = async () => {
        if (!player.address) return;

        try {
            await fetch('/api/citizen', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: player.address, status: 'offline' })
            });

            // Clear local state
            setPlayer({
                name: "",
                address: "",
                citizenId: "0000",
                avatar: ""
            });

            // Redirect or refresh
            window.location.href = '/';
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    return (
        <div className="absolute top-0 right-0 z-30 w-full pointer-events-none flex justify-end">
            {/* 
                Profile Widget Container
                Width: 571px, Height: 106px (based on SVG viewBox)
                Coordinates are local to this container (0,0 to 571,106).
            */}
            <div className="relative w-[571px] h-[106px] mr-0 mt-0 pointer-events-auto">
                <svg
                    width="571"
                    height="106"
                    viewBox="0 0 571 106"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-xl"
                >
                    <defs>
                        <linearGradient id="paint0_linear_widget" x1="572.55" y1="48.17" x2="-221.43" y2="116.53" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#23262D" />
                            <stop offset="1" stopColor="#23262D" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_widget" x1="570.11" y1="3.62" x2="32.7" y2="49.89" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#23262D" />
                            <stop offset="0.29" stopColor="#23262D" stopOpacity="0.9" />
                            <stop offset="0.61" stopColor="#23262D" stopOpacity="0.6" />
                            <stop offset="0.94" stopColor="#23262D" stopOpacity="0.1" />
                            <stop offset="1" stopColor="#23262D" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="paint2_linear_widget" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
                            <stop offset="0.72" stopColor="#A08C5C" />
                            <stop offset="1" stopColor="#A08C5C" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="paint3_linear_widget" x1="572.55" y1="48.1699" x2="-221.43" y2="116.53" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#131417" />
                            <stop offset="0.6" stopColor="#16171B" />
                            <stop offset="1" stopColor="#1D1E22" />
                        </linearGradient>
                        <radialGradient id="paint4_radial_widget" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
                            <stop stopColor="#FFDE27" />
                            <stop offset="0.99" stopColor="#FF9A47" />
                        </radialGradient>
                    </defs>

                    {/* Main Background Shapes */}
                    <path d="M570.479 0V55.1299L570.428 55.2363C569.205 83.368 546.013 105.8 517.58 105.8C495.077 105.8 475.855 91.7481 468.211 71.9404H253L165.14 0H570.479Z" fill="url(#paint0_linear_widget)" />
                    <path d="M55.31 34.28H556.2C560.987 41.6133 565.773 48.9467 570.56 56.28L570.48 34.28V0H0L55.31 34.28Z" fill="url(#paint1_linear_widget)" />

                    {/* Gold Divider Line */}
                    <path d="M474.42 34.28H79.9297" stroke="#A08C5C" strokeMiterlimit="10" />

                    {/* Avatar Circle Container */}
                    <path opacity="0.4" d="M517.58 99.3799C543.25 99.3799 564.06 78.5701 564.06 52.8999C564.06 27.2297 543.25 6.41992 517.58 6.41992C491.909 6.41992 471.1 27.2297 471.1 52.8999C471.1 78.5701 491.909 99.3799 517.58 99.3799Z" fill="url(#paint3_linear_widget)" />
                    <path d="M517.58 99.3799C543.25 99.3799 564.06 78.5701 564.06 52.8999C564.06 27.2297 543.25 6.41992 517.58 6.41992C491.909 6.41992 471.1 27.2297 471.1 52.8999C471.1 78.5701 491.909 99.3799 517.58 99.3799Z" stroke="#A08C5C" strokeMiterlimit="10" />
                    <path d="M517.579 88.1599C537.053 88.1599 552.839 72.3735 552.839 52.8999C552.839 33.4263 537.053 17.6399 517.579 17.6399C498.106 17.6399 482.319 33.4263 482.319 52.8999C482.319 72.3735 498.106 88.1599 517.579 88.1599Z" stroke="#A08C5C" strokeMiterlimit="10" />

                    {/* Coin Icon Background */}
                    <g transform="translate(-45 0)">
                        <path d="M322.34 58.8701C326.427 58.8701 329.74 55.557 329.74 51.4701C329.74 47.3832 326.427 44.0701 322.34 44.0701C318.254 44.0701 314.94 47.3832 314.94 51.4701C314.94 55.557 318.254 58.8701 322.34 58.8701Z" fill="url(#paint4_radial_widget)" />
                    </g>

                    {/* Rank Icon Placeholder (Square) */}
                    <rect x="218" y="6" width="20" height="19" fill="#1d1e22" fillOpacity="0.5" stroke="#A08C5C" strokeWidth="0.5" />
                </svg>

                {/* Overlays */}

                {/* 1. Rank & Name & Address Row (Top) */}
                <div className="absolute top-[8px] left-[265px] flex items-baseline gap-2">
                    <span className="text-white font-bold text-xl tracking-widest uppercase font-rajdhani">{player.name}</span>
                    <span className="text-gray-400 text-xs tracking-wider">
                        {player.address ? `${player.address.slice(0, 4)}...${player.address.slice(-4)}` : '0x...'}
                    </span>
                </div>

                {/* 2. Balance Row (Bottom) */}
                <div className="absolute top-[44px] left-[300px] flex items-center">
                    <span className="text-white font-bold text-base tracking-[0.1em] font-rajdhani">
                        1,234,567 GATO
                    </span>
                </div>

                {/* 3. Avatar Image */}
                <div className="absolute top-[18px] left-[482px] w-[71px] h-[71px] rounded-full overflow-hidden flex items-center justify-center z-10 transition-transform hover:scale-105">
                    {player.avatar ? (
                        <img src={player.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-[10px]">IMG</div>
                    )}
                </div>

                {/* 4. Profile Menu Button / Logout */}
                <button
                    className="absolute top-[5px] right-[5px] z-50 hover:scale-110 transition-transform cursor-pointer group"
                    onClick={handleLogout}
                    title="LOGOUT"
                >
                    <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.17 21.84C17.0629 21.84 21.84 17.0629 21.84 11.17C21.84 5.27712 17.0629 0.5 11.17 0.5C5.27712 0.5 0.5 5.27712 0.5 11.17C0.5 17.0629 5.27712 21.84 11.17 21.84Z" fill="#23262D" />
                        <path className="group-hover:stroke-red-500" d="M11.17 21.84C17.0629 21.84 21.84 17.0629 21.84 11.17C21.84 5.27712 17.0629 0.5 11.17 0.5C5.27712 0.5 0.5 5.27712 0.5 11.17C0.5 17.0629 5.27712 21.84 11.17 21.84Z" stroke="#A08C5C" strokeMiterlimit="10" />
                        <path d="M15.0003 7.42004H7.34027C7.03099 7.42004 6.78027 7.66853 6.78027 7.97504C6.78027 8.28156 7.03099 8.53004 7.34027 8.53004H15.0003C15.3096 8.53004 15.5603 8.28156 15.5603 7.97504C15.5603 7.66853 15.3096 7.42004 15.0003 7.42004Z" fill="#A08C5C" />
                        <path d="M15.0003 10.62H7.34027C7.03099 10.62 6.78027 10.8685 6.78027 11.175C6.78027 11.4815 7.03099 11.73 7.34027 11.73H15.0003C15.3096 11.73 15.5603 11.4815 15.5603 11.175C15.5603 10.8685 15.3096 10.62 15.0003 10.62Z" fill="#A08C5C" />
                        <path d="M15.0003 13.8199H7.34027C7.03099 13.8199 6.78027 14.0684 6.78027 14.3749C6.78027 14.6815 7.03099 14.9299 7.34027 14.9299H15.0003C15.3096 14.9299 15.5603 14.6815 15.5603 14.3749C15.5603 14.0684 15.3096 13.8199 15.0003 13.8199Z" fill="#A08C5C" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
