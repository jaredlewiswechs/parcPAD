/** Newton v2.0 API client — all 20 endpoints */

// In local dev, set VITE_NEWTON_API_URL=http://localhost:8000 in frontend/.env.local
// In production (Vercel), leave unset or set to '' — the API lives on the same origin.
const API_BASE = (): string =>
  (import.meta.env.VITE_NEWTON_API_URL as string | undefined) ?? '';

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE()}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Newton ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE()}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Newton ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type NewtonResult = 'fin' | 'finfr' | 'pending';

export interface Violation {
  constraint:  string;
  value?:      number;
  description: string;
}

export interface Witness {
  result:        string;
  timestamp?:    number;
  state_hash:    string;
  violations:    Violation[];
  curve_samples?: number;
}

export interface NewtonResponse<T = unknown> {
  result:       NewtonResult;
  payload:      T;
  witness:      Witness;
  ledger_step?: number | null;
}

export interface HealthResponse {
  status:          string;
  version:         string;
  ledger_entries:  number;
}

export interface AskPayload {
  prompt:        string;
  output:        string;
  constraints:   unknown[];
  laws_applied:  number;
}

export interface VerifyPayload {
  content: string;
}

export interface CalculatePayload {
  expression: string;
  result:     number;
}

export interface CalculateExample {
  expression: string;
  result:     number;
}

export interface ConstraintPayload {
  name:  string;
  f:     number;
  g:     number;
  ratio: number;
}

export interface GroundPayload {
  claim:         string;
  grounded:      boolean;
  matched_facts: string[];
  total_facts:   number;
}

export interface VaultPayload {
  key:     string;
  stored?: boolean;
  value?:  unknown;
}

export interface StatisticsPayload {
  count:    number;
  min:      number;
  max:      number;
  mean:     number;
  median:   number;
  std_dev:  number;
  variance: number;
}

export interface CartridgePayload {
  type?:   string;
  [key: string]: unknown;
}

export interface CartridgeInfo {
  name:        string;
  description: string;
}

export interface CMFKVector {
  c:      number;
  m:      number;
  f:      number;
  k:      number;
  shape?: string;
}

export interface Card {
  id:        string;
  title:     string;
  content:   string;
  card_type: string;
  metadata?: Record<string, unknown>;
  cmfk_target?: CMFKVector;
}

export interface LessonPayload {
  id:              string;
  title:           string;
  cards:           Card[];
  teks_alignment?: string[];
}

export interface TEKSStandard {
  code:        string;
  description: string;
  subject?:    string;
  grade?:      string;
  keywords?:   string[];
}

export interface TEKSPayload {
  query:   string;
  results: TEKSStandard[];
}

export interface CMFKDiagnosisPayload {
  text:  string;
  cmfk:  CMFKVector;
  shape: string;
  steps: string[];
}

export interface LedgerEntry {
  step:          number;
  timestamp:     number;
  intent:        string;
  payload_hash:  string;
  entry_hash:    string;
  prev_hash:     string;
  result?:       string;
}

export interface LedgerExport {
  entries:  LedgerEntry[];
  count:    number;
  version?: string;
}

export interface LedgerVerifyPayload {
  valid:           boolean;
  entries:         number;
  first_bad_step?: number | null;
}

export interface ConstraintRequest {
  f:     number;
  g:     number;
  name?: string;
}

// ─── Endpoint Functions ───────────────────────────────────────────────────────

// 1. Health
export const health = () =>
  get<HealthResponse>('/health');

// 2. Ask
export const ask = (prompt: string, output?: string) =>
  post<NewtonResponse<AskPayload>>('/ask', { prompt, output });

// 3. Verify
export const verify = (content: string, laws?: unknown[]) =>
  post<NewtonResponse<VerifyPayload>>('/verify', { content, laws });

// 4. Calculate
export const calculate = (expression: string) =>
  post<NewtonResponse<CalculatePayload>>('/calculate', { expression });

// 5. Calculate Examples
export const calculateExamples = () =>
  get<{ examples: CalculateExample[] }>('/calculate/examples');

// 6. Constraint
export const constraintCheck = (data: ConstraintRequest) =>
  post<NewtonResponse<ConstraintPayload>>('/constraint', data);

// 7. Ground
export const ground = (claim: string, facts: string[] = []) =>
  post<NewtonResponse<GroundPayload>>('/ground', { claim, facts });

// 8. Vault Store
export const vaultStore = (key: string, value: unknown) =>
  post<NewtonResponse<VaultPayload>>('/vault/store', { key, value });

// 9. Vault Retrieve
export const vaultRetrieve = (key: string) =>
  post<NewtonResponse<VaultPayload>>('/vault/retrieve', { key });

// 10. Statistics
export const statistics = (values: number[]) =>
  post<NewtonResponse<StatisticsPayload>>('/statistics', { values });

// 11. Cartridge Visual
export const cartridgeVisual = (intent: string) =>
  post<NewtonResponse<CartridgePayload>>('/cartridge/visual', { intent });

// 12. Cartridge Sound
export const cartridgeSound = (intent: string) =>
  post<NewtonResponse<CartridgePayload>>('/cartridge/sound', { intent });

// 13. Cartridge Sequence
export const cartridgeSequence = (intent: string) =>
  post<NewtonResponse<CartridgePayload>>('/cartridge/sequence', { intent });

// 14. Cartridge Data
export const cartridgeData = (intent: string) =>
  post<NewtonResponse<CartridgePayload>>('/cartridge/data', { intent });

// 15. Cartridge Rosetta
export const cartridgeRosetta = (intent: string) =>
  post<NewtonResponse<CartridgePayload>>('/cartridge/rosetta', { intent });

// 16. Cartridge Auto
export const cartridgeAuto = (intent: string) =>
  post<NewtonResponse<CartridgePayload>>('/cartridge/auto', { intent });

// 17. Cartridge Info
export const cartridgeInfo = () =>
  get<{ cartridges: CartridgeInfo[] }>('/cartridge/info');

// 18. Education Lesson
export const educationLesson = (topic: string, grade?: string, card_type?: string) =>
  post<NewtonResponse<LessonPayload>>('/education/lesson', { topic, grade, card_type });

// 19. Education TEKS
export const educationTeks = (query?: string, subject?: string, grade?: string) => {
  const params = new URLSearchParams();
  if (query)   params.set('query',   query);
  if (subject) params.set('subject', subject);
  if (grade)   params.set('grade',   grade);
  const qs = params.toString();
  return get<NewtonResponse<TEKSPayload>>(`/education/teks${qs ? `?${qs}` : ''}`);
};

// 20. Education CMFK
export const educationCmfk = (text: string) =>
  post<NewtonResponse<CMFKDiagnosisPayload>>('/education/cmfk', { text });

// Ledger
export const ledgerExport = () =>
  get<LedgerExport>('/ledger');

export const ledgerVerify = () =>
  get<NewtonResponse<LedgerVerifyPayload>>('/ledger/verify');
