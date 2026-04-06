import { useState } from "react";
import axios from "axios";
import { useLanguage } from "#src/context/LanguageContext";
import "#src/components/auth/RegisterModal.css";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

function maskCPF(v: string): string {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCEP(v: string): string {
  return v.replace(/\D/g, "").slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function RegisterModal({ onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (password !== passwordConfirm) {
      setError(t("register.password_mismatch"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, string> = { name, email, cpf, password };
      if (phone.trim()) payload["phone"] = phone.trim();
      if (cep.trim()) payload["cep"] = cep.trim();
      await axios.post(`${import.meta.env["VITE_API_URL"]}/api/users`, payload);
      onSuccess();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const data = err.response.data as Record<string, unknown>;
        if (data["errors"] && typeof data["errors"] === "object") {
          const fieldErrors = data["errors"] as Record<string, string[]>;
          const messages = Object.entries(fieldErrors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join(" | ");
          setError(messages);
        } else if ("message" in data) {
          setError(String(data["message"]));
        } else {
          setError(t("register.error"));
        }
      } else {
        setError(t("register.error"));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal register-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t("register.title")}</h2>
        <p className="register-subtitle">{t("register.subtitle")}</p>

        <div className="register-fields">
          <div className="form-group">
            <label>{t("register.field_name")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="João da Silva" maxLength={100} />
          </div>

          <div className="form-group">
            <label>{t("register.field_email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" />
          </div>

          <div className="register-row">
            <div className="form-group">
              <label>{t("register.field_cpf")}</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="form-group">
              <label>{t("register.field_phone")}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t("register.field_cep")}</label>
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(maskCEP(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>

          <div className="register-row">
            <div className="form-group">
              <label>{t("register.field_password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" maxLength={100} />
            </div>
            <div className="form-group">
              <label>{t("register.field_password_confirm")}</label>
              <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Repita a senha" maxLength={100} />
            </div>
          </div>

          {error && <p className="register-error">{error}</p>}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t("register.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "..." : t("register.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}