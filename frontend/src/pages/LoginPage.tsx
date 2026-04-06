import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, keycloak } from "#src/context/AuthContext";
import { useLanguage } from "#src/context/LanguageContext";
import { LanguageSelector } from "#src/components/ui/LanguageSelector";
import { RegisterModal } from "#src/components/auth/RegisterModal";
import type { Language } from "#src/types";
import capaPt from "#src/assets/capa_pt.png";
import capaEn from "#src/assets/capa_en.png";
import capaEs from "#src/assets/capa_es.png";
import "#src/pages/LoginPage.css";

const COVERS: Record<Language, string> = {
  pt: capaPt,
  en: capaEn,
  es: capaEs
};

export function LoginPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/tickets/waiting");
    }
  }, [user, loading, navigate]);

  function handleLogin() {
    setLoggingIn(true);
    keycloak.login({ redirectUri: window.location.origin });
  }

  function handleRegisterSuccess() {
    setShowRegister(false);
    setRegisterSuccess(true);
  }

  if (loading) {
    return (
      <div className="login-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="login-page">
        <div className="login-cover">
          <img
            src={COVERS[lang]}
            alt="Support Tickets"
            className="login-cover-img"
          />
        </div>

        <div className="login-panel">
          <div className="login-lang">
            <LanguageSelector />
          </div>

          <div className="login-content">
            <div className="login-logo-text">
              <span className="login-logo-support">Support</span>
              <span className="login-logo-tickets"> Tickets</span>
            </div>

            <h1 className="login-title">{t("login.title")}</h1>
            <p className="login-subtitle">{t("login.subtitle")}</p>

            {registerSuccess && (
              <div className="login-success">{t("register.success")}</div>
            )}

            <button className="btn btn-primary login-btn" onClick={handleLogin} disabled={loggingIn}>
              {loggingIn ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span className="login-spinner" /> {t("login.logging_in")}
                </span>
              ) : t("login.button")}
            </button>

            <button
              className="login-register-link"
              onClick={() => {
                setRegisterSuccess(false);
                setShowRegister(true);
              }}
            >
              {t("register.no_account")}
            </button>
          </div>
        </div>
      </div>

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
    </>
  );
}
