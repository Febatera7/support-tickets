import { NavLink } from "react-router-dom";
import { FcOk, FcAssistant, FcClock, FcSettings, FcPlus } from "react-icons/fc";
import { useAuth } from "#src/context/AuthContext";
import { useLanguage } from "#src/context/LanguageContext";
import "#src/components/layout/Sidebar.css";

export function Sidebar() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const isUser = user.role === "user";
  const isAdmin = user.role === "admin";

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {isUser ? (
          <>
            <NavLink to="/tickets/new" className="sidebar-link">
              <FcPlus size={22} />
              <span>{t("nav.new_ticket")}</span>
            </NavLink>
            <NavLink to="/tickets/in-progress" className="sidebar-link">
              <FcAssistant size={22} />
              <span>{t("nav.in_progress")}</span>
            </NavLink>
            <NavLink to="/tickets/completed" className="sidebar-link">
              <FcOk size={22} />
              <span>{t("nav.completed")}</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/tickets/waiting" className="sidebar-link">
              <FcClock size={22} />
              <span>{t("nav.waiting")}</span>
            </NavLink>
            <NavLink to="/tickets/in-progress" className="sidebar-link">
              <FcAssistant size={22} />
              <span>{t("nav.in_progress")}</span>
            </NavLink>
            <NavLink to="/tickets/completed" className="sidebar-link">
              <FcOk size={22} />
              <span>{t("nav.completed")}</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/settings" className="sidebar-link">
                <FcSettings size={22} />
                <span>{t("nav.settings")}</span>
              </NavLink>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}