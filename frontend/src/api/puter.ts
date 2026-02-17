/**
 * Puter.js integration layer — Ada's brain.
 *
 * Puter.js provides free browser-side LLM access (Claude, GPT-4o, etc.)
 * with no API keys and no backend AI infrastructure.
 *
 * Architecture:
 *   User → Newton /ask (constraint detection)
 *        → puter.ai.chat (Ada proposes, LLM generates)
 *        → Newton /verify (Newton gates the output)
 *        → Repair loop if finfr
 *        → User sees only Newton-verified content
 */

import type { Violation } from '@/api/newton';

/** Default model used for LLM generation via puter.js */
export const PUTER_MODEL = 'claude-sonnet-4-5-20250929';

/** Maximum repair attempts when Newton returns finfr */
export const MAX_REPAIRS = 2;

/**
 * Send a prompt to the puter.js LLM and return the text response as a plain string.
 *
 * Claude's API returns message.content as either a plain string OR an array of
 * content blocks: [{"type":"text","text":"..."}]. Both forms are normalised here
 * so callers always receive a string, which Newton /verify expects.
 */
export async function puterChat(
  prompt: string,
  model: string = PUTER_MODEL,
): Promise<string> {
  if (typeof puter === 'undefined') {
    throw new Error(
      'Puter.js is not available. Check your network connection or try again.',
    );
  }
  const response = await puter.ai.chat(prompt, { model });
  const raw = response.message.content;

  // Normalise: Claude returns content blocks as an array; other models return a string.
  if (Array.isArray(raw)) {
    return (raw as Array<{ type?: string; text?: string }>)
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('');
  }
  return raw;
}

/**
 * Build the Newton-constrained prompt to send to the LLM.
 * The LLM (Ada) proposes a response given detected constraints from Newton /ask.
 */
export function buildConstrainedPrompt(
  userMessage: string,
  constraints: Record<string, unknown>,
  lawsApplied: number,
): string {
  const hasConstraints = Object.keys(constraints).length > 0;

  const constraintSection = hasConstraints
    ? Object.entries(constraints)
        .map(([k, v]) => `  • ${k}: ${v}`)
        .join('\n')
    : '  (none detected)';

  return [
    'You are a helpful, precise assistant operating under Newton constraint verification.',
    'Newton has detected the following constraints for this query:',
    constraintSection,
    `Active laws applied: ${lawsApplied}`,
    '',
    'Your response MUST respect all detected constraints.',
    'Be clear, accurate, and appropriately scoped to the constraints above.',
    '',
    `User: ${userMessage}`,
  ].join('\n');
}

/**
 * Build a repair prompt when Newton returns finfr violations.
 * The LLM is given its previous response and the specific violations to fix.
 */
export function buildRepairPrompt(
  userMessage: string,
  previousResponse: string,
  violations: Violation[],
): string {
  const violationLines =
    violations.length > 0
      ? violations
          .map(
            (v) =>
              `  • [${v.constraint}] ${v.description}` +
              (v.value != null ? ` (value: ${v.value})` : ''),
          )
          .join('\n')
      : '  (unspecified constraint violations)';

  return [
    'Your previous response was rejected by Newton verification.',
    'It violated the following constraints:',
    violationLines,
    '',
    'Revise your response to fix ALL violations above.',
    `Original query: ${userMessage}`,
    `Previous response: ${previousResponse}`,
    '',
    'Revised response (constraint-compliant):',
  ].join('\n');
}

/**
 * Build a lesson prompt for the teach command.
 * Uses Newton's lesson structure (title + cards) to ground the LLM's output.
 */
export function buildTeachPrompt(
  topic: string,
  lesson: {
    title: string;
    cards: Array<{ title: string; card_type: string; content: string }>;
  },
): string {
  const sections = lesson.cards
    .map((c) => `  • [${c.card_type}] ${c.title}`)
    .join('\n');

  return [
    `You are an expert educator. Teach the topic: "${topic}"`,
    '',
    `Newton has structured this as: "${lesson.title}"`,
    'Lesson sections to cover:',
    sections || '  (general overview)',
    '',
    'Write a complete, engaging lesson. For each section use a clear ## heading.',
    'Include concrete examples, analogies, and short paragraphs.',
    'Finish with a brief ## Summary.',
    '',
    'Be accurate, educational, and engaging. Do not use placeholder text.',
  ].join('\n');
}

/**
 * Build a Newton-constrained LLM prompt for a cartridge type.
 *
 * Every prompt:
 *  1. Shows the Newton-verified spec as ground truth
 *  2. States hard output format constraints Newton will gate
 *  3. Prohibits hallucination beyond the spec
 */
export function buildCartridgePrompt(
  cartType: string,
  intent: string,
  spec: Record<string, unknown>,
): string {
  // 'auto' comes in as the user-selected tab; by the time we call this,
  // effectiveType is already resolved from payload.type, but guard anyway.
  const resolvedType =
    cartType === 'auto'
      ? ((spec['type'] as string | undefined) ?? (spec['spec_type'] as string | undefined) ?? 'rosetta')
      : cartType;

  // Omit large binary fields from the spec shown to the LLM
  const cleanSpec = { ...spec };
  delete cleanSpec['audio_b64'];
  delete cleanSpec['output_log'];
  const specJson = JSON.stringify(cleanSpec, null, 2);

  const NEWTON_GATE =
    'IMPORTANT: Newton will verify your output. Do not include unverifiable claims, ' +
    'hallucinated data, or content that contradicts the spec above. ' +
    'Violations will cause your response to be rejected.';

  switch (resolvedType) {
    case 'visual':
      return [
        `Generate inline SVG markup for: "${intent}"`,
        '',
        'Newton-verified visual spec (ground truth):',
        specJson,
        '',
        'HARD CONSTRAINTS (Newton-gated):',
        '• Output ONLY valid SVG — start with <svg, end with </svg>, nothing else',
        '• Match the viewBox and dimensions from the spec exactly',
        '• No <script> tags, no external href/src, no event handlers',
        '• Use only the shape types listed in spec.elements',
        '',
        NEWTON_GATE,
      ].join('\n');

    case 'rosetta':
      return [
        `Generate a working code skeleton for: "${intent}"`,
        '',
        'Newton-verified rosetta spec (ground truth):',
        specJson,
        '',
        'HARD CONSTRAINTS (Newton-gated):',
        `• Language: ${spec['language'] ?? 'python'} — do not switch languages`,
        `• Framework: ${spec['framework'] ?? 'fastapi'}`,
        `• Pattern: ${spec['pattern'] ?? 'rest_api'}`,
        '• Include all layers listed in spec.layers as clearly labelled sections',
        '• Add a Newton verification hook in the verification_layer section',
        '• No placeholder comments like "// TODO implement" — write real stubs',
        '',
        NEWTON_GATE,
      ].join('\n');

    case 'data':
      return [
        `Write a data analysis brief for: "${intent}"`,
        '',
        'Newton-verified data spec (ground truth):',
        specJson,
        '',
        'HARD CONSTRAINTS (Newton-gated):',
        `• Chart type is ${spec['chart_type'] ?? 'bar'} — describe accordingly`,
        '• Reference the exact series labels and values from the spec',
        '• Format: 3–5 bullet observations, then one sentence conclusion',
        '• No invented data points beyond what the spec provides',
        '',
        NEWTON_GATE,
      ].join('\n');

    case 'sound':
      return [
        `Write a musical brief for: "${intent}"`,
        '',
        'Newton-verified sound spec (ground truth):',
        specJson,
        '',
        'HARD CONSTRAINTS (Newton-gated):',
        `• Waveform is ${spec['waveform'] ?? 'sine'} — describe its sonic character accurately`,
        `• Tempo is ${spec['tempo_bpm'] ?? 120} BPM — describe the rhythmic feel this creates`,
        '• Reference the note frequencies from spec.notes in musical terms (e.g. C4, A4)',
        '• Format: mood line, then instruments/timbre, then structure, then one-line summary',
        '• Do not suggest changing the tempo or waveform — work with the spec',
        '',
        NEWTON_GATE,
      ].join('\n');

    case 'sequence':
      return [
        `Write step descriptions for this sequence: "${intent}"`,
        '',
        'Newton-verified sequence spec (ground truth):',
        specJson,
        '',
        'HARD CONSTRAINTS (Newton-gated):',
        `• Duration is ${spec['duration_s'] ?? 5}s at ${spec['fps'] ?? 30} fps`,
        '• Describe each keyframe in spec.keyframes in order, referencing its t, opacity, and scale values',
        '• Format each step as: [t=X] <description of what is visible at this moment>',
        '• Keep descriptions concrete and visual — no abstract metaphors',
        '',
        NEWTON_GATE,
      ].join('\n');

    default:
      return [
        `Generate content for: "${intent}"`,
        '',
        'Newton-verified spec (ground truth):',
        specJson,
        '',
        NEWTON_GATE,
      ].join('\n');
  }
}

/**
 * Extract inline SVG from an LLM response string.
 * Returns the SVG element or null if none found.
 */
export function extractSvg(text: string): string | null {
  const match = text.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}
