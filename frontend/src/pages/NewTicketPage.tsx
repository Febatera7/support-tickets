import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "#src/components/layout/AppLayout";
import { useLanguage } from "#src/context/LanguageContext";
import { createTicket } from "#src/services/ticketService";
import "#src/pages/NewTicketPage.css";

export function NewTicketPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      setError("Título e descrição são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim()
      });
      navigate("/tickets/in-progress");
    } catch {
      setError("Erro ao criar ticket. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="new-ticket-page">
        <h1 className="new-ticket-title">{t("new_ticket.title")}</h1>

        <div className="new-ticket-form">
          <div className="form-group">
            <label>{t("new_ticket.field_title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("new_ticket.title_placeholder")}
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label>{t("new_ticket.field_description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("new_ticket.description_placeholder")}
              rows={7}
              maxLength={5000}
            />
          </div>

          {error && (
            <p style={{ color: "var(--priority-critical)", fontSize: "13px" }}>{error}</p>
          )}

          <div className="new-ticket-actions">
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              {t("new_ticket.cancel")}
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "..." : t("new_ticket.submit")}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}