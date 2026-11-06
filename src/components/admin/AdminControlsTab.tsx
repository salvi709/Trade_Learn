import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Power, 
  FileJson, 
  FileSpreadsheet, 
  Check, 
  RotateCcw,
  Clock
} from 'lucide-react';
import { 
  AdminAnalyticsData, 
  fetchAdminControls, 
  saveAdminControls, 
  fetchAdminAuditLogs, 
  exportAnalyticsReport,
  triggerTactileHaptic
} from '../../services/adminService';

interface AdminControlsTabProps {
  adminEmail: string;
  analytics: AdminAnalyticsData;
}

export const AdminControlsTab: React.FC<AdminControlsTabProps> = ({ adminEmail, analytics }) => {
  const [dailyQuota, setDailyQuota] = useState<number>(50);
  const [geminiActive, setGeminiActive] = useState<boolean>(true);
  const [freeCap, setFreeCap] = useState<number>(30);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminControls(adminEmail)
      .then((controls) => {
        if (controls) {
          if (typeof controls.aiMentorDailyLimit === 'number') setDailyQuota(controls.aiMentorDailyLimit);
          if (typeof controls.geminiActive === 'boolean') setGeminiActive(controls.geminiActive);
          if (typeof controls.freeTierQueryCap === 'number') setFreeCap(controls.freeTierQueryCap);
          if (typeof controls.maintenanceMode === 'boolean') setMaintenanceMode(controls.maintenanceMode);
        }
      })
      .catch(() => {});

    fetchAdminAuditLogs(adminEmail)
      .then((data) => {
        if (data && data.logs) {
          setAuditLogs(data.logs);
        }
      })
      .catch(() => {});
  }, [adminEmail]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSavedSuccess(false);
    triggerTactileHaptic(10);
    try {
      await saveAdminControls(adminEmail, {
        aiMentorDailyLimit: dailyQuota,
        geminiActive,
        freeTierQueryCap: freeCap,
        maintenanceMode,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      // Refresh logs
      const updatedLogs = await fetchAdminAuditLogs(adminEmail);
      if (updatedLogs?.logs) setAuditLogs(updatedLogs.logs);
    } catch (err) {
      console.warn('Could not save controls:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Settings & Quotas Form */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b theme-border pb-4">
          <div>
            <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Platform Controls & AI Quota Policy
            </h3>
            <p className="text-xs theme-muted-text">
              Real-time operational parameters governing AI Mentor rates and learner access limits
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="py-2 px-4 rounded-lg theme-primary-btn font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                Changes Applied!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Applying...' : 'Apply Controls'}
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* AI Mentor Daily Quota Slider */}
          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-semibold theme-main-text block">Learner Daily Query Quota</label>
                <span className="text-[11px] theme-muted-text">Maximum questions per student per 24 hours</span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                {dailyQuota} / day
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={dailyQuota}
              onChange={(e) => setDailyQuota(Number(e.target.value))}
              aria-label="Learner Daily Query Quota"
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] theme-muted-text">
              <span>Conservative (10)</span>
              <span>Balanced (50)</span>
              <span>Generous (150)</span>
            </div>
          </div>

          {/* Gemini Live API Toggle */}
          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-semibold theme-main-text block">Gemini 2.5 Flash Engine</label>
                <span className="text-[11px] theme-muted-text">Toggle live generative model vs fallback curriculum</span>
              </div>
              <button
                type="button"
                onClick={() => setGeminiActive(!geminiActive)}
                className={`py-1.5 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  geminiActive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500'
                    : 'bg-red-500/15 border border-red-500/30 text-red-500'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {geminiActive ? 'Live Online' : 'Paused'}
              </button>
            </div>
            <p className="text-[11px] theme-muted-text leading-relaxed">
              When live, students receive real-time multimodal responses from Gemini 2.5 Flash. When paused, safe deterministic curriculum explanations are returned.
            </p>
          </div>

          {/* Free Tier Query Cap */}
          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-semibold theme-main-text block">Free Tier Monthly Limit</label>
                <span className="text-[11px] theme-muted-text">Soft warning threshold for high-volume inquiries</span>
              </div>
              <span className="font-mono text-sm font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                {freeCap} / month
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="200"
              step="5"
              value={freeCap}
              onChange={(e) => setFreeCap(Number(e.target.value))}
              aria-label="Free Tier Monthly Limit"
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Maintenance Mode */}
          <div className="p-4 rounded-xl theme-surface-subtle border theme-border space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-semibold theme-main-text block">Maintenance Mode</label>
                <span className="text-[11px] theme-muted-text">Display temporary maintenance banner to learners</span>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`py-1.5 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  maintenanceMode
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500'
                    : 'theme-surface-subtle border theme-border theme-muted-text'
                }`}
              >
                {maintenanceMode ? 'Active' : 'Disabled'}
              </button>
            </div>
            <p className="text-[11px] theme-muted-text leading-relaxed">
              Enable when deploying breaking curriculum updates or running database maintenance.
            </p>
          </div>
        </div>
      </div>

      {/* Export Platform Reports Section */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-500" />
              Export Platform Analytics Reports
            </h3>
            <p className="text-xs theme-muted-text">
              Download complete raw metrics for board presentations, curriculum audits, or external backups
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                triggerTactileHaptic(6);
                exportAnalyticsReport(analytics, 'json');
              }}
              className="py-2 px-3 rounded-lg theme-surface-subtle border theme-border hover:border-emerald-500/40 font-semibold theme-main-text flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <FileJson className="w-3.5 h-3.5 text-emerald-500" />
              Download JSON
            </button>
            <button
              type="button"
              onClick={() => {
                triggerTactileHaptic(6);
                exportAnalyticsReport(analytics, 'csv');
              }}
              className="py-2 px-3 rounded-lg theme-surface-subtle border theme-border hover:border-emerald-500/40 font-semibold theme-main-text flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* System Audit Log Table */}
      <div className="theme-card border theme-border rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base theme-main-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Administrative Audit Log Trail
            </h3>
            <p className="text-xs theme-muted-text">
              Cryptographically timestamped record of administrative actions and security events
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-500 font-semibold">
            Immutable Audit Trail
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="theme-surface-subtle theme-secondary-text border-b theme-border uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Target Component</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:theme-surface-subtle transition-colors">
                  <td className="py-2.5 px-3 font-mono theme-muted-text whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold theme-main-text">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-500 font-medium">
                    {log.target}
                  </td>
                  <td className="py-2.5 px-3 theme-secondary-text">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-mono">
                      {log.status || 'SUCCESS'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
