import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import type { CMFKVector } from '@/api/newton';
import { cmfkPercent } from '@/lib/formatters';
import { clsx } from '@/lib/clsx';

interface CMFKShapeProps {
  cmfk:       CMFKVector;
  shape?:     string;
  size?:      'sm' | 'md' | 'lg';
  className?: string;
}

const shapeColors: Record<string, string> = {
  CLEAR:         '#6B8F71',
  MISCONCEPTION: '#9B2D30',
  FOG:           '#C9A84C',
  OVERCONFIDENT: '#D4845A',
  DEVELOPING:    '#6BA3BE',
};

const shapeLabels: Record<string, string> = {
  CLEAR:         'Clear understanding',
  MISCONCEPTION: 'Misconception detected',
  FOG:           'Foggy — needs clarification',
  OVERCONFIDENT: 'Overconfident',
  DEVELOPING:    'Developing knowledge',
};

export const CMFKShape: React.FC<CMFKShapeProps> = ({
  cmfk,
  shape     = cmfk.shape ?? 'DEVELOPING',
  size      = 'md',
  className,
}) => {
  const data = [
    { axis: 'C — Correct',      value: cmfk.c },
    { axis: 'M — Misconception', value: cmfk.m },
    { axis: 'F — Fog',           value: cmfk.f },
    { axis: 'K — Knowing',       value: cmfk.k },
  ];

  const color    = shapeColors[shape] ?? '#6BA3BE';
  const label    = shapeLabels[shape] ?? shape;
  const chartH   = size === 'sm' ? 160 : size === 'lg' ? 280 : 220;

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Radar chart */}
      <div style={{ height: chartH }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(0,0,0,0.1)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: '#78716c' }}
            />
            <Radar
              name="CMFK"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Shape label */}
      <div className="text-center space-y-1">
        <p
          className="text-xl font-heading font-semibold tracking-wide"
          style={{ color }}
        >
          {shape}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      </div>

      {/* CMFK values */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { key: 'C', val: cmfk.c, color: '#6B8F71' },
          { key: 'M', val: cmfk.m, color: '#9B2D30' },
          { key: 'F', val: cmfk.f, color: '#C9A84C' },
          { key: 'K', val: cmfk.k, color: '#6BA3BE' },
        ].map(({ key, val, color: c }) => (
          <div key={key} className="glass-panel p-2 rounded-xl">
            <p className="text-xs text-stone-400 font-mono">{key}</p>
            <p className="text-sm font-semibold" style={{ color: c }}>
              {cmfkPercent(val)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
