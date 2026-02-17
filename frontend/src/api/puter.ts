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
 * Send a prompt to the puter.js LLM and return the text response.
 * Throws if puter.js is not loaded or the call fails.
 */
export async function puterChat(
  prompt: string,
  model: string = PUTER_MODEL,
): Promise<string> {
  if (typeof puter === 'undefined' || !puter?.ai?.chat) {
    throw new Error(
      'Puter.js is not available. Check your network connection or try again.',
    );
  }
  const response = await puter.ai.chat(prompt, { model });
  return response.message.content;
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
 * Build a cartridge-specific LLM prompt based on cartridge type and Newton spec.
 */
export function buildCartridgePrompt(
  cartType: string,
  intent: string,
  spec: Record<string, unknown>,
): string {
  const specJson = JSON.stringify(spec, null, 2);

  switch (cartType) {
    case 'visual':
      return [
        `Generate inline SVG markup for: "${intent}"`,
        '',
        'Newton-verified visual spec:',
        specJson,
        '',
        'Requirements:',
        '- Output ONLY valid SVG starting with <svg and ending with </svg>',
        '- Use the viewBox and dimensions from the spec',
        '- Create a clear, aesthetic visual representation',
        '- Use clean SVG elements (no scripts, no external resources)',
      ].join('\n');

    case 'rosetta':
      return [
        `Generate a working code blueprint for: "${intent}"`,
        '',
        'Newton-verified rosetta spec:',
        specJson,
        '',
        'Provide a concise, practical code skeleton.',
        'Include comments explaining each section.',
        'Make it immediately usable by a developer.',
      ].join('\n');

    case 'data':
      return [
        `Provide structured data analysis for: "${intent}"`,
        '',
        'Newton-verified data spec:',
        specJson,
        '',
        'Describe: data structure, key fields, relationships, and analysis approach.',
        'Be specific and actionable.',
      ].join('\n');

    case 'sound':
      return [
        `Compose audio parameters for: "${intent}"`,
        '',
        'Newton-verified sound spec:',
        specJson,
        '',
        'Provide: tempo (BPM), key/scale, instruments, mood, structure, and any notable techniques.',
        'Format as a clear musical brief.',
      ].join('\n');

    case 'sequence':
      return [
        `Elaborate this sequence for: "${intent}"`,
        '',
        'Newton-verified sequence spec:',
        specJson,
        '',
        'Provide clear, step-by-step descriptions for each element.',
        'Explain the purpose and outcome of each step.',
      ].join('\n');

    default:
      return [
        `Generate enhanced content for: "${intent}"`,
        '',
        'Newton-verified spec:',
        specJson,
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
