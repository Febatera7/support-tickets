import { useState, useEffect } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import { useApiToken } from "#src/hooks/useApiToken";
import { listSLAConfigs, updateSLAConfig } from "#src/services/slaService";
import type { SLAConfig, TicketPriority } from "#src/types";
import "#src/components/settings/SLASettings.css";

const PRIORITY_ORDER: TicketPriority[] = ["critical", "high", "medium", "low"];

const DEFAULTS: Record<TicketPriority, { responseTimeHours: number; resolutionTimeHours: number }> = {
  critical: { responseTimeHours: 1, resolutionTimeHours: 2 },
  high: { responseTimeHours: 4, resolutionTimeHours: 24 },
  medium: { responseTimeHours: 12, resolutionTimeHours: 72 },
  low: { responseTimeHours: 24, resolutionTimeHours: 168 }
};

interface SLAForm {
  responseTimeHours: number;
  resolutionTimeHours: number;
  autoEscalateAfterHours: number | null;
}

export function SLASettings() {
  const { t } = useLanguage();
  useApiToken();
  const [configs, setConfigs] = useState<Record<TicketPriority, SLAForm>>({
    critical: { ...DEFAULTS.critical, autoEscalateAfterHours: null },
    high: { ...DEFAULTS.high, autoEscalateAfterHours: null },
    medium: { ...DEFAULTS.medium, autoEscalateAfterHours: null },
    low: { ...DEFAULTS.low, autoEscalateAfterHours: null }
  });
  const [saving, setSaving] = useState<TicketPriority | null>(null);
  const [saved, setSaved] = useState<TicketPriority | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSLAConfigs()
      .then((data) => {
        const updated = { ...configs };
        data.forEach((c: SLAConfig) => {
          updated[c.priority] = {
            responseTimeHours: c.responseTimeHours,
            resolutionTimeHours: c.resolutionTimeHours,
            autoEscalateAfterHours: c.autoEscalateAfterHours
          };
        });
        setConfigs(updated);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(priority: TicketPriority) {
    setSaving(priority);
    try {
      await updateSLAConfig(priority, configs[priority]);
      setSaved(priority);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  }

  function formatHours(h: number): string {
    if (h >= 24) return `${Math.round(h / 24)}d ${h % 24 > 0 ? `${h % 24}h` : ""}`.trim();
    return `${h}h`;
  }

  if (loading) {
    return <div className="sla-loading">Carregando configurações...</div>;
  }

  return (
    <div className="sla-settings">
      <div className="sla-header">
        <h2>{t("settings.sla_title")}</h2>
        <p>{t("settings.sla_subtitle")}</p>
      </div>

      <div className="sla-cards">
        {PRIORITY_ORDER.map((priority) => {
          const form = configs[priority];
          return (
            <div key={priority} className={`sla-card sla-card-${priority}`}>
              <div className="sla-card-header">
                <span className={`badge badge-${priority}`}>
                  {t(`priority.${priority}`)}
                </span>
                <span className="sla-summary">
                  {t("settings.resolution_time")}: {formatHours(form.resolutionTimeHours)}
                </span>
              </div>

              <div className="sla-fields">
                <div className="form-group">
                  <label>{t("settings.response_time")}</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={form.responseTimeHours}
                    onChange={(e) =>
                      setConfigs((prev) => ({
                        ...prev,
                        [priority]: { ...prev[priority], responseTimeHours: Number(e.target.value) }
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.resolution_time")}</label>
                  <input
                    type="number"
                    min={1}
                    max={2160}
                    value={form.resolutionTimeHours}
                    onChange={(e) =>
                      setConfigs((prev) => ({
                        ...prev,
                        [priority]: { ...prev[priority], resolutionTimeHours: Number(e.target.value) }
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t("settings.escalate_time")}</label>
                  <input
                    type="number"
                    min={1}
                    max={2160}
                    value={form.autoEscalateAfterHours ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      setConfigs((prev) => ({
                        ...prev,
                        [priority]: {
                          ...prev[priority],
                          autoEscalateAfterHours: e.target.value ? Number(e.target.value) : null
                        }
                      }))
                    }
                  />
                </div>
              </div>

              <button
                className={`btn ${saved === priority ? "btn-ghost" : "btn-primary"} sla-save-btn`}
                onClick={() => handleSave(priority)}
                disabled={saving === priority}
              >
                {saved === priority
                  ? `✓ ${t("settings.saved")}`
                  : saving === priority
                  ? "..."
                  : t("settings.save")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
