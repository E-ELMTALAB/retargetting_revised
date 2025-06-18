import React from 'react';

export default function CampaignMonitor() {
  return (
    <div>
      <h2>Campaign Monitor</h2>
      <div>Status: <span id="status">Idle</span></div>
      <div>Errors: <span id="errors">None</span></div>
      <div>Quiet Hours: <span id="quiet">Off</span></div>
      <div>Nudge Status: <span id="nudge">Inactive</span></div>
      <div>Revenue: <span id="revenue">$0</span></div>
    </div>
  );
}
