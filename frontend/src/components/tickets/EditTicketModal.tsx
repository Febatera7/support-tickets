import { useState } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import { useAuth } from "#src/context/AuthContext";
import { updateTicketStatus, updateTicketPriority, updateTicketCategory } from "#src/services/ticketService";
import type { Ticket, TicketStatus, TicketPriority } from "#src/types";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTicketModal({ ticket, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isUser = user?.role === "user";

  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [comment, setComment] = useState(ticket.operatorComment ?? "");
  const [priorityReason, setPriorityReason] = useState("");
  const [category, setCategory] = useState(ticket.category ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (status !== ticket.status || comment !== (ticket.operatorComment ?? "")) {
        await updateTicketStatus(ticket.id, status, comment || undefined);
      }
      if (priority !== ticket.priority) {
        await updateTicketPriority(ticket.id, priority, priorityReason || undefined);
      }
      if (category !== (ticket.category ?? "")) {
        await updateTicketCategory(ticket.id, category);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t("edit_ticket.title")}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isUser && (
            <div className="form-group">
              <label>{t("edit_ticket.field_status")}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
                <option value="open">{t("status.open")}</option>
                <option value="in_progress">{t("status.in_progress")}</option>
                <option value="resolved">{t("status.resolved")}</option>
                <option value="closed">{t("status.closed")}</option>
              </select>
            </div>
          )}

          {!isUser && (
            <div className="form-group">
              <label>{t("edit_ticket.field_priority")}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                <option value="low">{t("priority.low")}</option>
                <option value="medium">{t("priority.medium")}</option>
                <option value="high">{t("priority.high")}</option>
                <option value="critical">{t("priority.critical")}</option>
              </select>
            </div>
          )}

          {!isUser && priority !== ticket.priority && (
            <div className="form-group">
              <label>Motivo da mudança de prioridade</label>
              <input
                type="text"
                value={priorityReason}
                onChange={(e) => setPriorityReason(e.target.value)}
                placeholder="Informe o motivo..."
              />
            </div>
          )}

          {!isUser && (
            <div className="form-group">
              <label>Categoria (sugerida pela IA)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: hardware, software, rede..."
                maxLength={100}
              />
              {ticket.aiSuggestedCategory && ticket.aiSuggestedCategory !== ticket.category && (
                <small style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  IA sugeriu: {ticket.aiSuggestedCategory}
                </small>
              )}
            </div>
          )}

          {!isUser && (
            <div className="form-group">
              <label>{t("edit_ticket.field_comment")}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("edit_ticket.field_comment_placeholder")}
                rows={4}
              />
            </div>
          )}

          {isUser && (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Apenas operadores e administradores podem editar tickets.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            {t("edit_ticket.cancel")}
          </button>
          {!isUser && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "..." : t("edit_ticket.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}