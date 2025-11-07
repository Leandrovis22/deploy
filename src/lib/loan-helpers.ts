import { apiFetch } from "@/lib/api-client";

// Helper to get user IDs with active loans
type Loan = {
  status: string;
  userId: string;
  // add other properties if needed
};

export async function getUserIdsWithActiveLoans() {
  const res = await apiFetch('/api/loans');
  if (!res.ok) return [];
  const loans: Loan[] = await res.json();
  return loans.filter((l: Loan) => l.status === 'active').map((l: Loan) => l.userId);
}
