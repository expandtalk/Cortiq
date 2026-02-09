import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  variant?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DashboardCard({ title, children, variant = 1, className = "" }: DashboardCardProps) {
  const getCardClass = () => {
    switch (variant) {
      case 1: return 'card-variant-1';
      case 2: return 'card-variant-2';
      case 3: return 'card-variant-3';
      case 4: return 'card-variant-4';
      default: return 'card-variant-1';
    }
  };

  return (
    <div className={`${getCardClass()} rounded-lg hover-lift hover-glow ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="font-mono-bold text-lg tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {children}
      </CardContent>
    </div>
  );
}