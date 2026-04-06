import { useState } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import { createTicket } from "#src/services/ticketService";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewTicketModal({ onClose, onCreated }: Props) {
  const { t } = useLanguage();
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
      onCreated();
      onClose();
    } catch {
      setError("Erro ao criar ticket. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t("new_ticket.title")}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              rows={5}
              maxLength={5000}
            />
          </div>

          {error && (
            <p style={{ color: "var(--priority-critical)", fontSize: "13px" }}>{error}</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {t("new_ticket.cancel")}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "..." : t("new_ticket.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}