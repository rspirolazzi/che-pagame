import { auth } from "@/auth";
import { DeleteAccountFlow } from "@/components/DeleteAccountFlow";

export default async function DeleteAccountPage() {
  const session = await auth();
  if (!session?.user) return null;
  return <DeleteAccountFlow email={session.user.email} />;
}
