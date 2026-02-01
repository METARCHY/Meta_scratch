import React from 'react';
import { Wallet } from 'lucide-react';

interface WindowFrameProps {
    title?: string;
    children?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export function WindowFrame({
    title = "WINDOW",
    children,
    icon,
    className = ""
}: WindowFrameProps) {
    return (
        <div className={`relative w-[397px] h-[435px] flex flex-col items-center justify-center ${className}`}>
            {/* The Background SVG LAYER */}
            <div className="absolute inset-0 z-0">
                <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 397 435" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.5" filter="url(#filter0_d_0_1)">
                        <path d="M382 1H15C9.47715 1 5 5.47715 5 11V416C5 421.523 9.47716 426 15 426H382C387.523 426 392 421.523 392 416V11C392 5.47715 387.523 1 382 1Z" fill="url(#paint0_linear_0_1)" />
                        <path d="M382 1H15C9.47715 1 5 5.47715 5 11V416C5 421.523 9.47716 426 15 426H382C387.523 426 392 421.523 392 416V11C392 5.47715 387.523 1 382 1Z" stroke="#A08C5C" strokeWidth="2" />
                    </g>
                    {/* Metarchy Logo/Emblem paths */}
                    <path opacity="0.4" d="M199.52 251.04C250.065 251.04 291.04 210.065 291.04 159.52C291.04 108.975 250.065 68 199.52 68C148.975 68 108 108.975 108 159.52C108 210.065 148.975 251.04 199.52 251.04Z" fill="url(#paint1_linear_0_1)" />
                    <path d="M199.52 251.04C250.065 251.04 291.04 210.065 291.04 159.52C291.04 108.975 250.065 68 199.52 68C148.975 68 108 108.975 108 159.52C108 210.065 148.975 251.04 199.52 251.04Z" stroke="#A08C5C" strokeMiterlimit="10" />
                    <path d="M199.54 246C247.313 246 286.04 207.273 286.04 159.5C286.04 111.727 247.313 73 199.54 73C151.767 73 113.04 111.727 113.04 159.5C113.04 207.273 151.767 246 199.54 246Z" stroke="#A08C5C" strokeMiterlimit="10" />

                    {/* Header Decoration */}
                    <path d="M57 1H342V9C342 20.0457 333.046 29 322 29H77C65.9543 29 57 20.0457 57 9V1Z" fill="url(#paint3_linear_0_1)" />
                    <path d="M338.093 1.5V7C338.093 17.7696 329.362 26.5 318.593 26.5H79.2705C68.501 26.5 59.7705 17.7695 59.7705 7V1.5H338.093Z" stroke="#47423A" />

                    <defs>
                        <filter id="filter0_d_0_1" x="0" y="0" width="397" height="435" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset dy="4" />
                            <feGaussianBlur stdDeviation="2" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1" />
                            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape" />
                        </filter>
                        <linearGradient id="paint0_linear_0_1" x1="198.5" y1="421.997" x2="198.5" y2="6.3138" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#131417" />
                            <stop offset="0.6" stopColor="#16171B" />
                            <stop offset="1" stopColor="#1D1E22" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_0_1" x1="91.283" y1="150.207" x2="1654.64" y2="284.809" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#131417" />
                            <stop offset="0.6" stopColor="#16171B" />
                            <stop offset="1" stopColor="#1D1E22" />
                        </linearGradient>
                        <linearGradient id="paint2_linear_0_1" x1="108.876" y1="297.867" x2="285.13" y2="372.4" gradientUnits="userSpaceOnUse">
                            <stop offset="0.11" stopColor="#8A7F53" />
                            <stop offset="0.41" stopColor="#A89365" />
                            <stop offset="0.7" stopColor="#8A7F53" />
                            <stop offset="1" stopColor="#6E5F42" />
                        </linearGradient>
                        <linearGradient id="paint3_linear_0_1" x1="82.5171" y1="-0.993411" x2="236.898" y2="130.708" gradientUnits="userSpaceOnUse">
                            <stop offset="0.11" stopColor="#8A7F53" />
                            <stop offset="0.41" stopColor="#A89365" />
                            <stop offset="0.7" stopColor="#8A7F53" />
                            <stop offset="1" stopColor="#6E5F42" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* CONTENT LAYER */}
            <div className="relative z-10 w-full h-full flex flex-col pt-12">
                {/* Header Title */}
                <div className="absolute top-2 w-full flex justify-center">
                    <span className="text-[#d4af37] font-bold text-xs tracking-[0.2em] uppercase opacity-80">
                        {title}
                    </span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-end pb-12 px-8 gap-6">

                    {/* Icon Section */}
                    <div className="absolute top-[135px] left-1/2 transform -translate-x-1/2 p-4 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                        {icon ? icon : <Wallet className="w-8 h-8 text-[#d4af37]" />}
                    </div>

                    {/* Children */}
                    <div className="w-full flex flex-col gap-4 items-center mt-32">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
