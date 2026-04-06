import { useState } from "react";
import { MdOutlineEdit, MdDelete } from "react-icons/md";
import { useLanguage } from "#src/context/LanguageContext";
import { useAuth } from "#src/context/AuthContext";
import { useSLADisplay } from "#src/hooks/useSLADisplay";
import { TicketDetailModal } from "#src/components/tickets/TicketDetailModal";
import type { Ticket } from "#src/types";
import "#src/components/tickets/TicketTable.css";

interface Props {
  tickets: Ticket[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketTable({
  tickets,
  loading,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete
}: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { formatSLA } = useSLADisplay();
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);

  const isUser = user?.role === "user";
  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="ticket-table-empty">
        <div className="spinner" />
        <span>{t("tickets.loading")}</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="ticket-table-empty">
        <span>{t("tickets.no_tickets")}</span>
      </div>
    );
  }

  return (
    <>
      <div className="ticket-table-wrapper">
        <table className="ticket-table">
          <thead>
            <tr>
              <th>{t("tickets.priority")}</th>
              <th className="col-title">Título</th>
              <th>{t("tickets.created_at")}</th>
              <th>{t("tickets.sla")}</th>
              <th>{t("tickets.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const sla = formatSLA(ticket.slaDeadline);
              const canDelete = isAdmin || (isUser && ticket.status === "open");
              const canEdit = !isUser;

              return (
                <tr
                  key={ticket.id}
                  onClick={() => setDetailTicket(ticket)}
                >
                  <td>
                    <span className={`badge badge-${ticket.priority}`}>
                      {t(`priority.${ticket.priority}`)}
                    </span>
                  </td>
                  <td className="col-title">
                    <div className="ticket-title">{ticket.title}</div>
                    {ticket.category && (
                      <div className="ticket-category">{ticket.category}</div>
                    )}
                  </td>
                  <td className="col-date">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`sla-${sla.urgency}`}>{sla.label}</span>
                  </td>
                  <td>
                    <div
                      className="ticket-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canEdit && (
                        <button
                          className="action-btn action-edit"
                          onClick={() => onEdit(ticket)}
                          title={t("tickets.edit")}
                        >
                          <MdOutlineEdit size={18} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="action-btn action-delete"
                          onClick={() => onDelete(ticket)}
                          title={t("tickets.delete")}
                        >
                          <MdDelete size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              {t("tickets.previous")}
            </button>
            <span className="pagination-info">
              {t("tickets.page")} {page} {t("tickets.of")} {totalPages}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              {t("tickets.next")}
            </button>
          </div>
        )}
      </div>

      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </>
  );
}