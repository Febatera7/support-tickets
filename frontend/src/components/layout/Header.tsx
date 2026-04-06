import { useAuth } from "#src/context/AuthContext";
import { useLanguage } from "#src/context/LanguageContext";
import { LanguageSelector } from "#src/components/ui/LanguageSelector";
import logoSup from "#src/assets/logo_sup.png";
import "#src/components/layout/Header.css";

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="header">
      <div className="header-logo">
        <img src={logoSup} alt="Support Tickets" className="header-logo-img" />
      </div>

      <div className="header-right">
        <LanguageSelector />

        {user && (
          <div className="header-user">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">{user.role}</span>
          </div>
        )}

        {user && (
          <button className="header-logout" onClick={logout} title={t("nav.logout")}>
            ⎋
          </button>
        )}
      </div>
    </header>
  );
}
