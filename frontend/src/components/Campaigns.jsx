import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CampaignForm from "./CampaignForm";
import DOMPurify from 'dompurify';

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  "https://retargetting-worker.elmtalabx.workers.dev"
).replace(/\/$/, "");

function stripPTags(html) {
  // Remove wrapping <p>...</p> if present
  if (!html) return '';
  return html.replace(/^<p>(.*?)<\/p>$/is, '$1');
}

function summarizeFilters(json) {
  try {
    const f = JSON.parse(json);
    const parts = [];
    if (f.limit) parts.push(`limit ${f.limit}`);
    if (f.include_categories && f.include_categories.length) {
      parts.push(`include ${f.include_categories.join(',')}`);
    }
    if (f.exclude_categories && f.exclude_categories.length) {
      parts.push(`exclude ${f.exclude_categories.join(',')}`);
    }
    return parts.join('; ');
  } catch {
    return '';
  }
}

export default function Campaigns({ accountId, sessionId, onSelectCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchCampaigns = () => {
    if (!accountId) return;
    fetch(`${API_BASE}/campaigns?account_id=${accountId}`)
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []))
      .catch((e) => console.error("fetch campaigns", e));
  };

  useEffect(() => {
    fetchCampaigns();
  }, [accountId]);

  const startCampaign = (id) => {
    console.log("start/resume campaign", id);
    const options = {
      method: "POST",
    };
    fetch(`${API_BASE}/campaigns/${id}/start`, options)
      .then(async (r) => {
        if (!r.ok) {
          console.error("start campaign failed", r.status);
          const errorData = await r.json().catch(() => ({}));
          console.error("Error details:", errorData);
          throw new Error(
            errorData.error ||
              errorData.message ||
              `start failed (${r.status})`,
          );
        }
        return r;
      })
      .then(() => {
        fetchCampaigns();
        onSelectCampaign && onSelectCampaign(id);
        console.log("campaign started/resumed", id);
      })
      .catch((err) => {
        console.error("start campaign Error:", err.message);
        alert(`Failed to start campaign: ${err.message}`);
      });
  };

  const stopCampaign = (id) => {
    console.log("stop campaign", id);
    fetch(`${API_BASE}/campaigns/${id}/stop`, { method: "POST" })
      .then((r) => {
        if (!r.ok) {
          console.error("stop campaign failed", r.status);
          throw new Error("stop failed");
        }
        return r;
      })
      .then(() => fetchCampaigns())
      .then(() => console.log("campaign stopped", id))
      .catch((err) => console.error("stop campaign", err));
  };

  const monitor = (id) => {
    onSelectCampaign && onSelectCampaign(id);
    navigate("/monitor");
  };

  return (
    <div className="p-6 relative">
      <h2 className="text-3xl font-bold mb-4">Campaigns</h2>
      <button
        className="absolute top-4 right-4 text-3xl font-bold text-blue-600"
        onClick={() => setShowForm(true)}
        aria-label="Add campaign"
      >
        +
      </button>
      <ul className="space-y-3">
        {campaigns.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between bg-white p-4 rounded shadow border"
          >
            <div>
              <p className="font-medium">Campaign #{c.id}</p>
              <p className="text-xs text-gray-500 mb-1">
                <span>Account: {c.account_email || 'N/A'}</span> | <span>Session: {c.session_phone || c.telegram_session_id || 'N/A'}</span>
              </p>
              <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(stripPTags(c.message_text)).slice(0, 120) + (c.message_text.length > 120 ? '...' : '') }} />
              {c.filters_json && (
                <p className="text-xs text-gray-400 mt-1 break-words">{summarizeFilters(c.filters_json)}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-xs px-2 py-1 rounded ${c.status === "running" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
              >
                {c.status}
              </span>
              {c.status === "running" ? (
                <>
                  <button
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                    onClick={() => monitor(c.id)}
                  >
                    Monitor
                  </button>
                  <button
                    className="ml-2 px-2 py-1 text-sm bg-red-600 text-white rounded"
                    onClick={() => stopCampaign(c.id)}
                  >
                    Stop
                  </button>
                </>
              ) : (
                {c.status === "completed" ? (
                  <span className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded">Completed</span>
                ) : (
                  <button
                    className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={() => startCampaign(c.id)}
                  >
                    {c.status === "stopped" ? "Resume" : "Run"}
                  </button>
                )}
              )}
            </div>
          </li>
        ))}
      </ul>
      {showForm && (
        <CampaignForm
          accountId={accountId}
          sessionId={sessionId}
          onSaved={() => {
            setShowForm(false);
            fetchCampaigns();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
