import React from 'react';
/**
 * Animated Pulse Indicator for running/streaming sessions matching DSH design.
 */
export declare const RunningDot: React.FC<{
    size?: number;
    style?: React.CSSProperties;
}>;
/**
 * Amber Dot for sessions waiting on user interaction (questions/approvals).
 */
export declare const PendingDot: React.FC<{
    size?: number;
    style?: React.CSSProperties;
}>;
/**
 * Green Dot for completed/unread sessions (finished in background, waiting to be read).
 */
export declare const CompletedDot: React.FC<{
    size?: number;
    style?: React.CSSProperties;
}>;
