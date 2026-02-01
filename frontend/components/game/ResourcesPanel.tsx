import React from 'react';
import { Star, Wheat, Eye, Scroll, Ghost, Box, Zap, Recycle } from "lucide-react";

interface ResourcesPanelProps {
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

const ResourceIcon = ({ icon: Icon, count, color, label }: { icon: any, count: number, color: string, label: string }) => (
    <div className="flex flex-col items-center gap-1 min-w-[3rem]">
        <Icon size={16} className={color} />
        <span className="text-white font-bold text-sm tracking-widest">{count}</span>
        <span className="text-[9px] uppercase text-gray-500 font-mono tracking-wide">{label}</span>
    </div>
);

export default function ResourcesPanel({ resources, vp }: ResourcesPanelProps) {
    if (!resources) return null;
    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 p-2 px-6 border border-gray-600/50 bg-[#0d0d12]/90 backdrop-blur-md rounded-full shadow-2xl flex items-center gap-6 z-50">
            {/* VP & Glory */}
            <div className="flex gap-4 border-r border-white/10 pr-4">
                <ResourceIcon icon={Star} count={vp} color="text-yellow-400" label="VP" />
                <ResourceIcon icon={Wheat} count={resources.glory} color="text-yellow-600" label="Glory" />
            </div>

            {/* Intangible */}
            <div className="flex gap-4 border-r border-white/10 pr-4">
                <ResourceIcon icon={Eye} count={resources.power} color="text-red-400" label="Power" />
                <ResourceIcon icon={Scroll} count={resources.knowledge} color="text-blue-400" label="Know." />
                <ResourceIcon icon={Ghost} count={resources.art} color="text-purple-400" label="Art" />
            </div>

            {/* Material */}
            <div className="flex gap-4">
                <ResourceIcon icon={Box} count={resources.product} color="text-[#d4af37]" label="Prod." />
                <ResourceIcon icon={Zap} count={resources.energy} color="text-cyan-400" label="Energy" />
                <ResourceIcon icon={Recycle} count={resources.recycle} color="text-green-500" label="Recyc." />
            </div>
        </div>
    );
}
