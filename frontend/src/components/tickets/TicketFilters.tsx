import { useState } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import type { TicketFilters, TicketPriority } from "#src/types";
import "#src/components/tickets/TicketFilters.css";

interface Props {
  onFilter: (filters: TicketFilters) => void;
  showPriority?: boolean;
}

export function TicketFiltersBar({ onFilter, showPriority = true }: Props) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function apply() {
    const filters: TicketFilters = {};
    if (search) filters.search = search;
    if (priority) filters.priority = priority as TicketPriority;
    if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59);
      filters.dateTo = d.toISOString();
    }
    onFilter(filters);
  }

  function clear() {
    setSearch("");
    setPriority("");
    setDateFrom("");
    setDateTo("");
    onFilter({});
  }

  return (
    <div className="ticket-filters">
      <input
        type="text"
        placeholder={t("tickets.filter_search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="filter-input"
        onKeyDown={(e) => e.key === "Enter" && apply()}
      />

      {showPriority && (
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority | "")}
          className="filter-select"
        >
          <option value="">{t("tickets.all_priorities")}</option>
          <option value="low">{t("priority.low")}</option>
          <option value="medium">{t("priority.medium")}</option>
          <option value="high">{t("priority.high")}</option>
          <option value="critical">{t("priority.critical")}</option>
        </select>
      )}

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="filter-input filter-date"
        placeholder={t("tickets.filter_date_from")}
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="filter-input filter-date"
        placeholder={t("tickets.filter_date_to")}
      />

      <button className="btn btn-primary" onClick={apply}>
        {t("tickets.apply_filter")}
      </button>
      <button className="btn btn-ghost" onClick={clear}>
        {t("tickets.clear_filter")}
      </button>
    </div>
  );
}
