import { useState } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import api from "#src/services/api";
import type { UserRole } from "#src/types";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("operator");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Nome, e-mail e senha são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/api/users", { name, email, password, role });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(String((err.response.data as Record<string, unknown>)["message"]));
      } else {
        setError(t("users.error"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t("users.create")}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="form-group">
            <label>{t("users.field_name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>{t("users.field_email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>

          <div className="form-group">
            <label>{t("users.field_password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>{t("users.field_role")}</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="user">{t("users.role_user")}</option>
              <option value="operator">{t("users.role_operator")}</option>
              <option value="admin">{t("users.role_admin")}</option>
            </select>
          </div>

          {error && (
            <p style={{ color: "var(--priority-critical)", fontSize: "13px", background: "#ffeaea", padding: "8px 12px", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--priority-critical)" }}>
              {error}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {t("users.cancel")}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "..." : t("users.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
