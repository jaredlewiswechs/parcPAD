import React from 'react';
import { BarChart2 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/GlassPanel';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { CartridgePayload } from '@/api/newton';

interface DataCartridgeProps {
  payload: CartridgePayload;
}

export const DataCartridge: React.FC<DataCartridgeProps> = ({ payload }) => {
  // Try to extract chart-friendly data
  const rawData = (payload.data ?? payload.values ?? payload.rows) as unknown[] | undefined;
  const chartData = Array.isArray(rawData)
    ? rawData.map((item, i) => {
        if (typeof item === 'number') return { name: String(i), value: item };
        if (typeof item === 'object' && item !== null) return item;
        return { name: String(i), value: item };
      })
    : null;

  return (
    <div className="space-y-4">
      <GlassPanel padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <BarChart2 size={22} className="text-sequoia-cedar" />
          <h3 className="heading-lg">Data Cartridge</h3>
        </div>

        {chartData && chartData.length > 0 && (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData as Record<string, unknown>[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="transparent" />
                <YAxis tick={{ fontSize: 11 }} stroke="transparent" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(245,240,235,0.9)',
                    border: '1px solid rgba(107,143,113,0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#6B8F71" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassPanel>

      <GlassPanel padding="sm" variant="inset">
        <p className="text-xs text-stone-400 mb-2">Raw Payload</p>
        <pre className="font-mono text-xs text-stone-600 dark:text-stone-300 overflow-auto max-h-48 whitespace-pre-wrap">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </GlassPanel>
    </div>
  );
};
