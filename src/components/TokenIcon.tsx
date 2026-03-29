import React from 'react';
import { PlayerToken } from '../gameData';

export const TokenIcon = ({ token, color, className }: { token: PlayerToken, color: string, className?: string }) => {
  const gradientId = `metal-${token}-${color.replace('#', '')}`;
  
  const paths: Record<PlayerToken, string> = {
    car: "M4 16c0 1.1.9 2 2 2s2-.9 2-2h8c0 1.1.9 2 2 2s2-.9 2-2v-4l-3-4H7L4 12v4zm3-4h10l1.5 2H5.5L7 12z",
    dog: "M19 8h-2V6c0-1.1-.9-2-2-2H9C7.9 4 7 4.9 7 6v2H5c-1.1 0-2 .9-2 2v6h2v4h2v-4h6v4h2v-4h2c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2z",
    ship: "M2 16h20l-2 4H4l-2-4zm4-2V8h4v6H6zm6 0V6h4v8h-4z",
    hat: "M3 18h18v2H3v-2zm4-2V8c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8H7z",
    shoe: "M19 18H5c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h2l2-4h4l-2 4h4c1.1 0 2 .9 2 2v6z",
    iron: "M19 16v-6c0-2.2-1.8-4-4-4H7c-1.1 0-2 .9-2 2v8H3v2h18v-2h-2zm-4-8c1.1 0 2 .9 2 2v4H7V8h8z",
    thimble: "M7 20h10v-8c0-2.8-2.2-5-5-5s-5 2.2-5 5v8zm2-8h6v2H9v-2zm0 4h6v2H9v-2z",
    wheelbarrow: "M3 10h2l2 6h10l2-6h2v2h-1.5l-1.5 4.5c-.3.8-1 1.5-1.9 1.5H8.9c-.9 0-1.6-.7-1.9-1.5L5.5 12H3v-2z M10 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
  };

  return (
    <svg viewBox="0 0 24 24" className={className} style={{ filter: `drop-shadow(0 4px 4px ${color}80)` }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <path 
        fill={`url(#${gradientId})`} 
        stroke={color} 
        strokeWidth="0.5" 
        strokeLinejoin="round" 
        d={paths[token]} 
      />
    </svg>
  );
};
