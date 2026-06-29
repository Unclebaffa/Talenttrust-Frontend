import type { Milestone } from '@/components/MilestonesList';

export function findCurrencyMismatches(
  contractCurrency: string,
  milestones: Milestone[],
): string[] {
  const normalizedContract = contractCurrency.toUpperCase();
  return milestones
    .filter((m) => m.currency.toUpperCase() !== normalizedContract)
    .map((m) => m.id);
}
