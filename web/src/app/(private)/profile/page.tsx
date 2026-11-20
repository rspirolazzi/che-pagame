import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { DonateSection } from "@/components/donate/DonateSection";
import { ExportButton } from "@/components/exports/ExportButton";
import { EmailChangeForm, PreferencesForm, ProfileForm } from "@/components/ProfileForms";
import { parseDonationUrl } from "@/lib/donation";

export default async function ProfilePage() {
  const [session, t, tExports, tDelete] = await Promise.all([
    auth(),
    getTranslations("profile"),
    getTranslations("exports"),
    getTranslations("deleteAccount"),
  ]);
  if (!session?.user) return null;
  const user = session.user;
  return (
    <section className="card stack">
      <h1>{t("title")}</h1>
      <ProfileForm user={user} />
      <PreferencesForm user={user} />
      <EmailChangeForm user={user} />
      <section className="stack" aria-labelledby="export-mine-title">
        <h2 id="export-mine-title">{tExports("mineTitle")}</h2>
        <p>{tExports("mineHint")}</p>
        <ExportButton endpoint="/api/exports/me" label={tExports("mineButton")} />
      </section>
      <DonateSection url={parseDonationUrl(process.env.DONATION_URL)} />
      <section className="stack" aria-labelledby="delete-account-title">
        <h2 id="delete-account-title">{tDelete("title")}</h2>
        <p>{tDelete("profileHint")}</p>
        <p>
          <Link href="/profile/delete" className="button danger">
            {tDelete("title")}
          </Link>
        </p>
      </section>
    </section>
  );
}
