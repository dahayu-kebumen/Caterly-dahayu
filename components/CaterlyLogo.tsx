import React from 'react';

interface CaterlyLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
  textClassName?: string;
}

/**
 * Caterly Official Logo Mark:
 * Displays the authentic Caterly emblem featuring the orange 'C' cupping hand,
 * sleek black cloche food cover with steam, and white highlight.
 */
export const CaterlyLogoIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xs ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src="/logo.jpg" 
        alt="Caterly Logo" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

/**
 * Caterly Full Logo:
 * Includes the logo mark paired with high-contrast typography
 */
export const CaterlyLogo: React.FC<CaterlyLogoProps> = ({
  size = 42,
  className = '',
  showText = true,
  subtitle = 'Smart Catering OS',
  textClassName = ''
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CaterlyLogoIcon size={size} />
      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <span className="text-xl font-black tracking-tight text-slate-950 leading-none">
            caterly
          </span>
          {subtitle && (
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-600 mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CaterlyLogo;
