import { useLanguage } from "#src/context/LanguageContext";
import { useAuth } from "#src/context/AuthContext";
import { useSLADisplay } from "#src/hooks/useSLADisplay";
import type { Ticket } from "#src/types";
import "#src/components/tickets/TicketDetailModal.css";

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { formatSLA } = useSLADisplay();
  const sla = formatSLA(ticket.slaDeadline);
  const isUser = user?.role === "user";

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
              <span className="ticket-detail-status">
                {t(`status.${ticket.status}`)}
              </span>
              <span className="ticket-detail-date">
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <button className="ticket-detail-close" onClick={onClose}>✕</button>
        </div>

        <div className="ticket-detail-body">
          <div className="ticket-detail-section">
            <label>Descrição</label>
            <p>{ticket.description}</p>
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

          <div className="ticket-detail-row">
            <div className="ticket-detail-section">
              <label>{t("tickets.sla")}</label>
              <p className={`sla-${sla.urgency}`}>{sla.label}</p>
            </div>

            {ticket.resolvedAt && (
              <div className="ticket-detail-section">
                <label>Resolvido em</label>
                <p>{new Date(ticket.resolvedAt).toLocaleString()}</p>
              </div>
            )}

            {ticket.resolutionTimeMinutes != null && (
              <div className="ticket-detail-section">
                <label>Tempo de resolução</label>
                <p>{ticket.resolutionTimeMinutes < 60
                  ? `${ticket.resolutionTimeMinutes}min`
                  : `${Math.floor(ticket.resolutionTimeMinutes / 60)}h ${ticket.resolutionTimeMinutes % 60}min`}
                </p>
              </div>
            )}
          </div>

          {!isUser && ticket.assignedTo && (
            <div className="ticket-detail-section">
              <label>Operador responsável</label>
              <p>{ticket.assignedTo.name}</p>
            </div>
          )}

          {ticket.operatorComment && (
            <div className="ticket-detail-section">
              <label>Comentário do operador</label>
              <p className="ticket-detail-comment">{ticket.operatorComment}</p>
            </div>
          )}

          <div className="ticket-detail-section">
            <label>Aberto por</label>
            <p>{ticket.createdBy.name} — {ticket.createdBy.email}</p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}