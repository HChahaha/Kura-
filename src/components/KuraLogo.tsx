import React from 'react';

interface KuraLogoProps {
 className?: string;
 strokeWidth?: number;
 strokeColor?: string;
}

export default function KuraLogo({
 className = "w-12 h-12",
 strokeWidth = 2.5,
 strokeColor = "currentColor"
}: KuraLogoProps) {
 return (
 <svg 
 viewBox="0 0 100 100" 
 className={className}
 fill="none" 
 xmlns="http://www.w3.org/2000/svg"
 >
 {/* Curved left-hand depth/dimension line */}
 <path 
 d="M 32 10 C 15 25, 15 75, 32 90" 
 stroke={strokeColor} 
 strokeWidth={strokeWidth} 
 strokeLinecap="round" 
 strokeLinejoin="round"
 />
 {/* Refrigerator rounded right chassis outline */}
 <path 
 d="M 32 10 L 68 10 C 74 10, 78 14, 78 20 L 78 80 C 78 86, 74 90, 68 90 L 32 90" 
 stroke={strokeColor} 
 strokeWidth={strokeWidth} 
 strokeLinecap="round" 
 strokeLinejoin="round"
 />
 {/* Left straight vertical spine line */}
 <line 
 x1="32" 
 y1="10" 
 x2="32" 
 y2="90" 
 stroke={strokeColor} 
 strokeWidth={strokeWidth} 
 strokeLinecap="round" 
 strokeLinejoin="round"
 />
 {/* Top diagonal branch */}
 <line 
 x1="32" 
 y1="45" 
 x2="72" 
 y2="16" 
 stroke={strokeColor} 
 strokeWidth={strokeWidth} 
 strokeLinecap="round" 
 strokeLinejoin="round"
 />
 {/* Bottom diagonal branch */}
 <line 
 x1="32" 
 y1="45" 
 x2="78" 
 y2="86" 
 stroke={strokeColor} 
 strokeWidth={strokeWidth} 
 strokeLinecap="round" 
 strokeLinejoin="round"
 />
 {/* Vertical connecting line closing the geometric triangle/wedge */}
 <line 
 x1="58" 
 y1="26" 
 x2="58" 
 y2="68" 
 stroke={strokeColor} 
 strokeWidth={strokeWidth} 
 strokeLinecap="round" 
 strokeLinejoin="round"
 />
 </svg>
 );
}
