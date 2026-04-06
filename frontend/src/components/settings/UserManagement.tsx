import { useState } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import { useApiToken } from "#src/hooks/useApiToken";
import { createUser } from "#src/services/userService";
import type { UserRole } from "#src/types";
import "#src/components/settings/UserManagement.css";

export function UserManagement() {
  const { t } = useLanguage();
  useApiToken();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setError("");
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Todos os campos são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createUser({ name, email, password, role });
      setSuccess(t("users.success"));
      setShowForm(false);
      resetForm();
    } catch {
      setError(t("users.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h2>{t("users.title")}</h2>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setSuccess(""); }}
        >
          + {t("users.create")}
        </button>
      </div>

      {success && (
        <div className="user-success">{success}</div>
      )}

      {showForm && (
        <div className="user-form">
          <div className="user-form-fields">
            <div className="form-group">
              <label>{t("users.field_name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>{t("users.field_email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t("users.field_password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>{t("users.field_role")}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="user">{t("users.role_user")}</option>
                <option value="operator">{t("users.role_operator")}</option>
                <option value="admin">{t("users.role_admin")}</option>
              </select>
            </div>
          </div>

          {error && <p className="user-error">{error}</p>}

          <div className="user-form-actions">
            <button
              className="btn btn-ghost"
              onClick={() => { setShowForm(false); resetForm(); }}
            >
              {t("users.cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "..." : t("users.submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
