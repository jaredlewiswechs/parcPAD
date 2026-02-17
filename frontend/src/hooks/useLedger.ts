import { useQuery, useMutation } from '@tanstack/react-query';
import { ledgerExport, ledgerVerify } from '@/api/newton';

export function useLedger() {
  return useQuery({
    queryKey: ['ledger'],
    queryFn:  ledgerExport,
    refetchInterval: 15_000,
  });
}

export function useLedgerVerify() {
  return useMutation({ mutationFn: ledgerVerify });
}
