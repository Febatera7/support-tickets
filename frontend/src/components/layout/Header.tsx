import { useAuth } from "#src/context/AuthContext";
import { useLanguage } from "#src/context/LanguageContext";
import { LanguageSelector } from "#src/components/ui/LanguageSelector";
import { useNavigate } from "react-router-dom";
import logoSup from "#src/assets/logo_sup.png";
import "#src/components/layout/Header.css";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="header">
      <div className="header-logo">
        <img src={logoSup} alt="Support Tickets" className="header-logo-img" />
      </div>

      <div className="header-right">
        <LanguageSelector />

        {user && (
          <button className="header-user" onClick={() => navigate("/profile")}>
            <span className="header-user-name">{user.name}</span>
          </button>
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