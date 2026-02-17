/** Client-side Bézier math for animations */

export interface Point {
  x: number;
  y: number;
}

/** Evaluate cubic Bézier at parameter t ∈ [0,1] */
export function cubicBezier(
  p0: Point, h1: Point, h2: Point, p3: Point, t: number
): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * h1.x + 3 * mt * t * t * h2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * h1.y + 3 * mt * t * t * h2.y + t * t * t * p3.y,
  };
}

/** Sample a cubic Bézier into N points */
export function sampleBezier(
  p0: Point, h1: Point, h2: Point, p3: Point, samples = 64
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    pts.push(cubicBezier(p0, h1, h2, p3, i / samples));
  }
  return pts;
}

/** Build SVG path string from an array of points */
export function pointsToPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  const [first, ...rest] = pts;
  return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(' ');
}

/** Build a cubic Bézier SVG path directive */
export function bezierPathD(p0: Point, h1: Point, h2: Point, p3: Point): string {
  return `M ${p0.x} ${p0.y} C ${h1.x} ${h1.y}, ${h2.x} ${h2.y}, ${p3.x} ${p3.y}`;
}
