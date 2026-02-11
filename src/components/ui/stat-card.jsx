import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  accentColor = 'blue',
  className 
}) {
  const colorClasses = {
    blue: {
      border: 'border-l-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trendUp: 'text-blue-600',
      trendDown: 'text-blue-600'
    },
    emerald: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trendUp: 'text-emerald-600',
      trendDown: 'text-emerald-600'
    },
    amber: {
      border: 'border-l-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trendUp: 'text-amber-600',
      trendDown: 'text-amber-600'
    },
    purple: {
      border: 'border-l-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trendUp: 'text-purple-600',
      trendDown: 'text-purple-600'
    }
  };

  const colors = colorClasses[accentColor] || colorClasses.blue;

  return (
    <Card className={cn(
      'border-l-4 hover-lift glass-card overflow-hidden relative',
      colors.border,
      className
    )}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-transparent via-white/50 to-transparent" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {value}
            </p>
            {trend && trendValue && (
              <p className={cn(
                'text-xs font-medium mt-2 flex items-center gap-1',
                trend === 'up' ? 'text-emerald-600' : 'text-slate-600'
              )}>
                {trend === 'up' ? '↑' : '↓'}
                <span>{trendValue}</span>
              </p>
            )}
          </div>
          <div className={cn('p-4 rounded-2xl transition-transform hover:scale-110', colors.iconBg)}>
            {Icon && <Icon className={cn('w-7 h-7', colors.iconColor)} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}