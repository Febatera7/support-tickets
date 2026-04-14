import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "#src/components/layout/AppLayout";
import { TicketTable } from "#src/components/tickets/TicketTable";
import { TicketFiltersBar } from "#src/components/tickets/TicketFilters";
import { EditTicketModal } from "#src/components/tickets/EditTicketModal";
import { NewTicketModal } from "#src/components/tickets/NewTicketModal";
import { useAuth } from "#src/context/AuthContext";
import { useLanguage } from "#src/context/LanguageContext";
import { setAuthToken } from "#src/services/api";
import { useSSE } from "#src/hooks/useSSE";
import { listTickets, listAvailableTickets, deleteTicket } from "#src/services/ticketService";
import type { Ticket, TicketFilters } from "#src/types";
import "#src/pages/TicketsPage.css";

const TAB_TITLES: Record<string, string> = {
  waiting: "nav.waiting",
  "in-progress": "nav.in_progress",
  completed: "nav.completed"
};

function getTabFilters(tab: string, role: string): { available?: boolean; statuses?: string } {
  if (tab === "waiting" && role !== "user") return { available: true };
  if (tab === "in-progress") return { statuses: "open,in_progress" };
  if (tab === "completed") return { statuses: "resolved,closed" };
  return { statuses: "open,in_progress" };
}

export function TicketsPage() {
  const { tab = "in-progress" } = useParams<{ tab: string }>();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const tabFilters = getTabFilters(tab, user.role);
      let result;

      if (tabFilters.available) {
        result = await listAvailableTickets({ ...filters, page, limit: 20 });
      } else {
        result = await listTickets({ ...filters, statuses: tabFilters.statuses, page, limit: 20 });
      }

      setTickets(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user, tab, filters, page]);

  useSSE((event) => {
    const relevant = ["TICKET_PROCESSING_UPDATE", "PRIORITY_CHANGED", "TICKET_ASSIGNED"];
    if (relevant.includes(event.type)) {
      setTimeout(() => { fetchTickets(); }, 500);
    }
  });

  useEffect(() => { setPage(1); }, [tab, filters]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  
  useEffect(() => {
    if (user?.role === "user" && tab === "waiting") {
      navigate("/tickets/in-progress", { replace: true });
    }
  }, [user, tab, navigate]);

  async function handleDelete(ticket: Ticket) {
    if (!window.confirm(`Excluir o ticket "${ticket.title}"?`)) return;
    try {
      await deleteTicket(ticket.id);
      fetchTickets();
    } catch {
      alert("Erro ao excluir ticket.");
    }
  }

  const titleKey = TAB_TITLES[tab] ?? "nav.in_progress";

  return (
    <AppLayout>
      <div className="tickets-page">
        <div className="tickets-page-header">
          <h1 className="tickets-page-title">{t(titleKey)}</h1>
          <div className="tickets-page-actions">
<span className="tickets-count">{total} tickets</span>
          </div>
        </div>

        <TicketFiltersBar onFilter={setFilters} showPriority={true} />

        <TicketTable
          tickets={tickets}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={setEditTicket}
          onDelete={handleDelete}
          onUpdated={fetchTickets}
          isCompleted={tab === "completed"}
        />
      </div>

      {editTicket && (
        <EditTicketModal
          ticket={editTicket}
          onClose={() => setEditTicket(null)}
          onSaved={fetchTickets}
        />
      )}

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={fetchTickets}
        />
      )}
    </AppLayout>
  );
}