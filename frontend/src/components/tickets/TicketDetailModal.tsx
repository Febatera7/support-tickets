import { useState, useEffect } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import { useAuth } from "#src/context/AuthContext";
import { useSLADisplay } from "#src/hooks/useSLADisplay";
import { listOperators } from "#src/services/userService";
import { assignTicket, selfAssignTicket } from "#src/services/ticketService";
import type { Ticket } from "#src/types";
import "#src/components/tickets/TicketDetailModal.css";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onUpdated?: () => void;
}

export function TicketDetailModal({ ticket, onClose, onUpdated }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { formatSLA } = useSLADisplay();
  const sla = formatSLA(ticket.slaDeadline);

  const isAdmin = user?.role === "admin";
  const isOperator = user?.role === "operator";
  const isCompleted = ticket.status === "resolved" || ticket.status === "closed";

  const [operators, setOperators] = useState<{ id: string; name: string }[]>([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    if (isAdmin && !ticket.assignedToId) {
      listOperators().then(setOperators).catch(() => {});
    }
  }, [isAdmin, ticket.assignedToId]);

  async function handleAssign() {
    if (!selectedOperator) return;
    setAssigning(true);
    setAssignError("");
    try {
      await assignTicket(ticket.id, selectedOperator);
      onUpdated?.();
      onClose();
    } catch {
      setAssignError("Erro ao atribuir ticket.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleSelfAssign() {
    setAssigning(true);
    setAssignError("");
    try {
      await selfAssignTicket(ticket.id);
      onUpdated?.();
      onClose();
    } catch {
      setAssignError("Erro ao assumir ticket.");
    } finally {
      setAssigning(false);
    }
  }

  function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ticket-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-detail-header">
          <div>
            <h2 className="modal-title" style={{ marginBottom: 4 }}>{ticket.title}</h2>
            <div className="ticket-detail-meta">
              <span className={`badge badge-${ticket.priority}`}>
                {t(`priority.${ticket.priority}`)}
              </span>
              <span className="ticket-detail-status">{t(`status.${ticket.status}`)}</span>
            </div>
          </div>
          <button className="ticket-detail-close" onClick={onClose}>✕</button>
        </div>

        <div className="ticket-detail-body">
          <div className="ticket-detail-section">
            <label>Descrição</label>
            <p>{ticket.description}</p>
          </div>

          <div className="ticket-detail-row">
            <div className="ticket-detail-section">
              <label>Criado em</label>
              <p>{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
            {ticket.resolvedAt && (
              <div className="ticket-detail-section">
                <label>Concluído em</label>
                <p>{new Date(ticket.resolvedAt).toLocaleString()}</p>
              </div>
            )}
            {ticket.resolutionTimeMinutes != null && (
              <div className="ticket-detail-section">
                <label>Tempo de resolução</label>
                <p>{formatMinutes(ticket.resolutionTimeMinutes)}</p>
              </div>
            )}
          </div>

          <div className="ticket-detail-row">
            <div className="ticket-detail-section">
              <label>{t("tickets.sla")}</label>
              <p className={`sla-${sla.urgency}`}>{sla.label}</p>
            </div>
            {ticket.slaDeadline && (
              <div className="ticket-detail-section">
                <label>Prazo SLA</label>
                <p>{new Date(ticket.slaDeadline).toLocaleString()}</p>
              </div>
            )}
          </div>

          {ticket.category && (
            <div className="ticket-detail-row">
              <div className="ticket-detail-section">
                <label>Categoria</label>
                <p>{ticket.category}</p>
              </div>
              {ticket.aiSuggestedCategory && ticket.aiSuggestedCategory !== ticket.category && (
                <div className="ticket-detail-section">
                  <label>Sugestão da IA</label>
                  <p className="ticket-detail-muted">{ticket.aiSuggestedCategory}</p>
                </div>
              )}
            </div>
          )}

          <div className="ticket-detail-section">
            <label>Aberto por</label>
            <p>{ticket.createdBy.name} — {ticket.createdBy.email}</p>
          </div>

          {ticket.assignedTo && (
            <div className="ticket-detail-section">
              <label>Operador responsável</label>
              <p>{ticket.assignedTo.name}</p>
            </div>
          )}

          {isAdmin && !ticket.assignedToId && operators.length > 0 && (
            <div className="ticket-detail-section">
              <label>Atribuir a operador</label>
              <div className="ticket-detail-assign">
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="assign-select"
                >
                  <option value="">Selecione um operador...</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handleAssign}
                  disabled={!selectedOperator || assigning}
                >
                  {assigning ? "..." : "Atribuir"}
                </button>
              </div>
              {assignError && <small className="assign-error">{assignError}</small>}
            </div>
          )}

          {isOperator && !ticket.assignedToId && ticket.status === "open" && (
            <div className="ticket-detail-section">
              <button className="btn btn-primary" onClick={handleSelfAssign} disabled={assigning}>
                {assigning ? "..." : "Assumir ticket"}
              </button>
              {assignError && <small className="assign-error">{assignError}</small>}
            </div>
          )}

          {ticket.operatorComment && (
            <div className="ticket-detail-section">
              <label>Comentário do operador</label>
              <p className="ticket-detail-comment">{ticket.operatorComment}</p>
            </div>
          )}

          {isCompleted && ticket.history && ticket.history.length > 0 && (
            <div className="ticket-detail-section">
              <label>Histórico</label>
              <div className="ticket-history">
                {ticket.history.map((h) => (
                  <div key={h.id} className="ticket-history-item">
                    <span className="history-action">{h.action.replace(/_/g, " ")}</span>
                    {h.oldValue && h.newValue && (
                      <span className="history-values">{h.oldValue} → {h.newValue}</span>
                    )}
                    <span className="history-meta">
                      {h.changedBy?.name ?? "Sistema"} · {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}