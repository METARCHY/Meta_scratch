import Image from 'next/image';
import { useTooltip } from '@/context/TooltipContext';

interface GameResourcesProps {
    resources: {
        power: number;
        knowledge: number;
        art: number;
        glory: number;
        product: number;
        energy: number;
        recycle: number;
    };
    vp: number;
}

export default function GameResources({ resources, vp }: GameResourcesProps) {
    const { showTooltip, hideTooltip } = useTooltip();
    if (!resources) return null;

    // Helper to render a resource slot
    const renderSlot = (x: number, y: number, iconPath: string, count: number, label: string) => (
        <div
            className="absolute flex items-center justify-center gap-1 z-10 pointer-events-auto cursor-help"
            style={{ left: `${x}px`, top: `${y}px`, width: '30px', height: '30px' }}
            onMouseEnter={() => showTooltip(label)}
            onMouseLeave={hideTooltip}
        >
            {/* Icon */}
            <div className="relative w-full h-full">
                <Image src={iconPath} layout="fill" objectFit="contain" alt={label} />
            </div>

            {/* Count - positioned to the right of the icon */}
            <div className="absolute left-[32px] flex flex-col justify-center h-full w-[40px]">
                <span className="text-white font-bold text-sm leading-none drop-shadow-md">{count}</span>
            </div>
        </div>
    );

    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
            <div className="relative w-[632px] h-[45px]">
                {/* SVG Background */}
                <svg width="632" height="45" viewBox="0 0 632 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full">
                    <g filter="url(#filter0_d_81_250_res)">
                        <path d="M4 0H628V17C628 28.0457 619.046 37 608 37H24C12.9543 37 4 28.0457 4 17V0Z" fill="url(#paint0_linear_81_250_res)" />
                    </g>
                    <path d="M22.2399 0.149902H20.6699V37.0699H22.2399V0.149902Z" fill="#514D44" />
                    <path d="M106.98 0.149902H105.41V37.0699H106.98V0.149902Z" fill="#514D44" />
                    <path d="M392.121 0.149902H390.551V37.0699H392.121V0.149902Z" fill="#514D44" />
                    <path d="M610.22 0H608.65V36.92H610.22V0Z" fill="#514D44" />

                    <defs>
                        <filter id="filter0_d_81_250_res" x="0" y="0" width="632" height="45" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset dy="4" />
                            <feGaussianBlur stdDeviation="2" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_81_250" />
                            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_81_250" result="shape" />
                        </filter>
                        <linearGradient id="paint0_linear_81_250_res" x1="316" y1="2.09453" x2="316" y2="36.6492" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#171B21" />
                            <stop offset="0.59" stopColor="#1C1F26" />
                            <stop offset="1" stopColor="#23262D" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Resource Slots - Positioned based on user provided coords */}

                {/* VP (White) x=35.15 y=3.5 - NOW STAR/FAME */}
                {renderSlot(35.15, 3.5, "/intangibles/resource_VP.png", vp, "VP")}

                {/* Glory (Yellow) x=118.15 y=3.5 - NOW VICTORY */}
                {renderSlot(118.15, 3.5, "/intangibles/resource_Glory.png", resources.glory, "Glory")}

                {/* Power (Orange) x=189.15 y=4.5 */}
                {renderSlot(189.15, 4.5, "/intangibles/resource_power.png", resources.power, "Power")}

                {/* Art (Magenta) x=260.15 y=4.5 */}
                {renderSlot(260.15, 4.5, "/intangibles/resource_Art.png", resources.art, "Art")}

                {/* Wisdom (Light Blue) x=331.15 y=4.5 */}
                {renderSlot(331.15, 4.5, "/intangibles/resource_wisdom.png", resources.knowledge, "Wisdom")}

                {/* Product (Red) x=404.15 y=3.5 */}
                {renderSlot(404.15, 3.5, "/resources/resource_product.png", resources.product, "Product")}

                {/* Energy (Blue) x=475.15 y=3.5 */}
                {renderSlot(475.15, 3.5, "/resources/resource_energy.png", resources.energy, "Energy")}

                {/* Recycle (Green) x=545.15 y=3.5 */}
                {renderSlot(545.15, 3.5, "/resources/resource_Recycle.png", resources.recycle, "Recycle")}

            </div>
        </div>
    );
}
