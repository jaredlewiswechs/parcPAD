import React, { useEffect, useRef } from 'react';
import { bezierPathD, sampleBezier } from '@/lib/bezier';
import type { Point } from '@/lib/bezier';

interface BezierCanvasProps {
  width?:     number;
  height?:    number;
  animated?:  boolean;
  className?: string;
}

const DEFAULT_POINTS = {
  p0: { x: 40,  y: 120 },
  h1: { x: 120, y: 20  },
  h2: { x: 220, y: 180 },
  p3: { x: 300, y: 60  },
};

/** Omega region (safe zone) as a simple rect */
const OMEGA = { x: 60, y: 30, width: 200, height: 120 };

function isInsideOmega(p: Point): boolean {
  return (
    p.x >= OMEGA.x && p.x <= OMEGA.x + OMEGA.width &&
    p.y >= OMEGA.y && p.y <= OMEGA.y + OMEGA.height
  );
}

export const BezierCanvas: React.FC<BezierCanvasProps> = ({
  width     = 340,
  height    = 160,
  animated  = true,
  className = '',
}) => {
  const { p0, h1, h2, p3 } = DEFAULT_POINTS;
  const samples = sampleBezier(p0, h1, h2, p3, 64);

  // Split into inside/outside Omega segments for colour coding
  const pathFull    = bezierPathD(p0, h1, h2, p3);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-label="Bézier curve visualization"
      role="img"
    >
      {/* Omega region */}
      <rect
        x={OMEGA.x} y={OMEGA.y}
        width={OMEGA.width} height={OMEGA.height}
        rx={12}
        fill="rgba(107,143,113,0.08)"
        stroke="rgba(107,143,113,0.25)"
        strokeWidth="1"
        strokeDasharray="5 4"
      />
      <text
        x={OMEGA.x + OMEGA.width - 6}
        y={OMEGA.y + 16}
        textAnchor="end"
        fontSize="10"
        fill="rgba(107,143,113,0.5)"
        fontFamily="monospace"
      >
        Ω
      </text>

      {/* Full curve — finfr (outside) styled dashed */}
      <path
        d={pathFull}
        stroke="#9B2D30"
        strokeWidth="2.5"
        strokeDasharray="6 4"
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />

      {/* Inside-Omega segments — sage green */}
      {samples.slice(0, -1).map((pt, i) => {
        const next = samples[i + 1];
        if (isInsideOmega(pt) && isInsideOmega(next)) {
          return (
            <line
              key={i}
              x1={pt.x}   y1={pt.y}
              x2={next.x} y2={next.y}
              stroke="#6B8F71"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        }
        return null;
      })}

      {/* Animated draw overlay */}
      {animated && (
        <path
          d={pathFull}
          stroke="#6B8F71"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset="400"
          style={{ animation: 'bezier-draw 2.4s ease forwards' }}
          opacity={0.7}
        />
      )}

      {/* Control points */}
      {[
        { pt: p0, label: 'P₀', color: '#6B8F71' },
        { pt: h1, label: 'H₁', color: '#C9A84C' },
        { pt: h2, label: 'H₂', color: '#C9A84C' },
        { pt: p3, label: 'P₃', color: '#6B8F71' },
      ].map(({ pt, label, color }) => (
        <g key={label}>
          <circle cx={pt.x} cy={pt.y} r={5} fill={color} opacity={0.9} />
          <text
            x={pt.x + 7} y={pt.y + 4}
            fontSize="9" fill={color}
            fontFamily="monospace"
          >
            {label}
          </text>
        </g>
      ))}

      {/* Control handles */}
      <line x1={p0.x} y1={p0.y} x2={h1.x} y2={h1.y} stroke="#C9A84C" strokeWidth="1" strokeDasharray="3 3" opacity={0.5} />
      <line x1={p3.x} y1={p3.y} x2={h2.x} y2={h2.y} stroke="#C9A84C" strokeWidth="1" strokeDasharray="3 3" opacity={0.5} />
    </svg>
  );
};
