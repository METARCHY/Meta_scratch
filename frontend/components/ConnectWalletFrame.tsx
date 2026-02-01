import React from 'react';
import { CompactFrame } from './CompactFrame';

interface PremiumFrameProps {
    title?: string;
    children?: React.ReactNode;
    icon?: React.ReactNode;
}

export default function ConnectWalletFrame({
    title = "CONNECT WALLET",
    children,
    icon
}: PremiumFrameProps) {
    return (
        <CompactFrame title={title}>
            {children}
        </CompactFrame>
    );
}



