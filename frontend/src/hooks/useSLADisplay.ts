import { useLanguage } from "#src/context/LanguageContext";

export function useSLADisplay() {
  const { t } = useLanguage();

  function formatSLA(slaDeadline: string | null): {
    label: string;
    breached: boolean;
    urgency: "ok" | "warning" | "critical" | "breached";
  } {
    if (!slaDeadline) return { label: "—", breached: false, urgency: "ok" };

    const now = new Date();
    const deadline = new Date(slaDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    const breached = diffMs < 0;
    const absDiff = Math.abs(diffMs);

    const totalMinutes = Math.floor(absDiff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    let label = "";
    if (days > 0) {
      label = `${days}${t("tickets.days")} ${hours}${t("tickets.hours")}`;
    } else if (hours > 0) {
      label = `${hours}${t("tickets.hours")} ${minutes}${t("tickets.minutes")}`;
    } else {
      label = `${minutes}${t("tickets.minutes")}`;
    }

    if (breached) {
      return {
        label: `${t("tickets.sla_expired_ago")} ${label}`,
        breached: true,
        urgency: "breached"
      };
    }

    const hoursLeft = diffMs / 3600000;
    let urgency: "ok" | "warning" | "critical" | "breached" = "ok";
    if (hoursLeft < 1) urgency = "critical";
    else if (hoursLeft < 4) urgency = "warning";

    return {
      label: `${t("tickets.sla_expires_in")} ${label}`,
      breached: false,
      urgency
    };
  }

  return { formatSLA };
}
