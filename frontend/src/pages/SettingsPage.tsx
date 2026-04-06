import { AppLayout } from "#src/components/layout/AppLayout";
import { SLASettings } from "#src/components/settings/SLASettings";
import { UserManagement } from "#src/components/settings/UserManagement";
import { useLanguage } from "#src/context/LanguageContext";
import { FcSettings } from "react-icons/fc";

export function SettingsPage() {
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div style={{ maxWidth: "960px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <FcSettings size={28} />
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>{t("settings.title")}</h1>
        </div>

        <UserManagement />

        <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: "28px" }}>
          <SLASettings />
        </div>
      </div>
    </AppLayout>
  );
}
