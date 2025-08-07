import React from 'react';

interface VaultIconProps {
  size?: number;
  className?: string;
  unlocking?: boolean;
}

const VaultIcon: React.FC<VaultIconProps> = ({ 
  size = 24, 
  className = '', 
  unlocking = false 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`vault-icon ${unlocking ? 'unlocking' : ''} ${className}`}
    >
      {/* Vault Door */}
      <rect
        x="3"
        y="8"
        width="18"
        height="12"
        rx="2"
        ry="2"
      />
      
      {/* Vault Handle */}
      <circle
        cx="15"
        cy="14"
        r="2"
      />
      
      {/* Vault Latch/Lock Mechanism */}
      <path
        d="M15 12v4"
      />
      
      {/* Vault Top Security Bar */}
      <path
        d="M6 8V6a6 6 0 0 1 12 0v2"
      />
      
      {/* Radial Security Lines */}
      <path
        d="M9 14h1"
        opacity="0.6"
      />
      <path
        d="M11 12h1"
        opacity="0.6"
      />
      <path
        d="M11 16h1"
        opacity="0.6"
      />
      <path
        d="M19 14h1"
        opacity="0.4"
      />
    </svg>
  );
};

export default VaultIcon;