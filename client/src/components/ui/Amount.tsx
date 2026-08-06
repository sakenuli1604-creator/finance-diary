import React from 'react';
import { usePrivacyStore } from '../../store/privacyStore';

interface AmountProps {
  children: React.ReactNode;
  className?: string;
  mask?: string; // чем заменять при скрытии, по умолчанию — точки
}

export const Amount: React.FC<AmountProps> = ({ children, className, mask = '• • • •' }) => {
  const hidden = usePrivacyStore((s) => s.hidden);

  return <span className={className}>{hidden ? mask : children}</span>;
};
