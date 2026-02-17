import { useMutation, useQuery } from '@tanstack/react-query';
import * as api from '@/api/newton';

// ── Health ────────────────────────────────────────────────────────────────────
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn:  api.health,
    refetchInterval: 30_000,
  });
}

// ── Ask ───────────────────────────────────────────────────────────────────────
export function useAsk() {
  return useMutation({
    mutationFn: ({ prompt, output }: { prompt: string; output?: string }) =>
      api.ask(prompt, output),
  });
}

// ── Verify ────────────────────────────────────────────────────────────────────
export function useVerify() {
  return useMutation({
    mutationFn: ({ content, laws }: { content: string; laws?: unknown[] }) =>
      api.verify(content, laws),
  });
}

// ── Calculate ─────────────────────────────────────────────────────────────────
export function useCalculate() {
  return useMutation({
    mutationFn: (expression: string) => api.calculate(expression),
  });
}

export function useCalculateExamples() {
  return useQuery({
    queryKey: ['calculate-examples'],
    queryFn:  api.calculateExamples,
    staleTime: Infinity,
  });
}

// ── Constraint ────────────────────────────────────────────────────────────────
export function useConstraint() {
  return useMutation({
    mutationFn: (data: api.ConstraintRequest) => api.constraintCheck(data),
  });
}

// ── Ground ────────────────────────────────────────────────────────────────────
export function useGround() {
  return useMutation({
    mutationFn: ({ claim, facts }: { claim: string; facts?: string[] }) =>
      api.ground(claim, facts),
  });
}

// ── Vault ─────────────────────────────────────────────────────────────────────
export function useVaultStore() {
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      api.vaultStore(key, value),
  });
}

export function useVaultRetrieve() {
  return useMutation({
    mutationFn: (key: string) => api.vaultRetrieve(key),
  });
}

// ── Statistics ────────────────────────────────────────────────────────────────
export function useStatistics() {
  return useMutation({
    mutationFn: (values: number[]) => api.statistics(values),
  });
}

// ── Cartridges ────────────────────────────────────────────────────────────────
export function useCartridgeAuto() {
  return useMutation({
    mutationFn: (intent: string) => api.cartridgeAuto(intent),
  });
}

export function useCartridgeVisual() {
  return useMutation({ mutationFn: (intent: string) => api.cartridgeVisual(intent) });
}

export function useCartridgeSound() {
  return useMutation({ mutationFn: (intent: string) => api.cartridgeSound(intent) });
}

export function useCartridgeSequence() {
  return useMutation({ mutationFn: (intent: string) => api.cartridgeSequence(intent) });
}

export function useCartridgeData() {
  return useMutation({ mutationFn: (intent: string) => api.cartridgeData(intent) });
}

export function useCartridgeRosetta() {
  return useMutation({ mutationFn: (intent: string) => api.cartridgeRosetta(intent) });
}

export function useCartridgeInfo() {
  return useQuery({
    queryKey: ['cartridge-info'],
    queryFn:  api.cartridgeInfo,
    staleTime: Infinity,
  });
}

// ── Education ─────────────────────────────────────────────────────────────────
export function useEducationLesson() {
  return useMutation({
    mutationFn: ({ topic, grade, card_type }: { topic: string; grade?: string; card_type?: string }) =>
      api.educationLesson(topic, grade, card_type),
  });
}

export function useEducationTeks(query?: string, subject?: string, grade?: string) {
  return useQuery({
    queryKey: ['teks', query, subject, grade],
    queryFn:  () => api.educationTeks(query, subject, grade),
    enabled:  true,
  });
}

export function useEducationCmfk() {
  return useMutation({
    mutationFn: (text: string) => api.educationCmfk(text),
  });
}
