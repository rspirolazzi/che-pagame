import { notFound } from "next/navigation";

import { SettlementDetail } from "@/components/balances/SettlementDetail";
import { getAccount } from "@/lib/accountsServer";
import { ApiError } from "@/lib/api/errors";
import { getSettlement } from "@/lib/expensesServer";

export const dynamic = "force-dynamic";

interface SettlementPageProps {
  params: Promise<{ accountId: string; settlementId: string }>;
}

async function load(accountId: string, settlementId: string) {
  try {
    return await Promise.all([getAccount(accountId), getSettlement(accountId, settlementId)]);
  } catch (error) {
    // Deleted by another member, or not a member: the same "not found" (feature 012, R4).
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function SettlementPage({ params }: SettlementPageProps) {
  const { accountId, settlementId } = await params;
  const loaded = await load(accountId, settlementId);
  if (!loaded) notFound();
  const [account, settlement] = loaded;
  return <SettlementDetail account={account} settlement={settlement} />;
}
