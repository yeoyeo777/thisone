
import React from 'react';
import { SecurityCheck } from '../types';

interface SecurityCardProps {
  check: SecurityCheck;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ check }) => {
  const statusColors = {
    passed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    failed: 'text-rose-400 bg-rose-400/10 border-rose-400/20'
  };

  const statusIcons = {
    passed: '✓',
    warning: '!',
    failed: '✕'
  };

  return (
    <div className={`p-4 rounded-xl border ${statusColors[check.status]} transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 flex items-center justify-center rounded-full border border-current font-bold text-sm shrink-0 mt-0.5">
          {statusIcons[check.status]}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{check.name}</h4>
          <p className="text-sm opacity-90 leading-relaxed mb-3">{check.description}</p>
          {check.remediation && (
            <div className="text-xs font-mono py-2 px-3 bg-black/20 rounded border border-white/10">
              <span className="font-bold block mb-1">MITIGATION:</span>
              {check.remediation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityCard;
