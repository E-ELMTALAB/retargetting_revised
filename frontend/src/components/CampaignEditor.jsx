import React from 'react'

export default function CampaignEditor() {
  return (
    <div>
      <h2>Campaign Editor</h2>
      <form>
        <label>
          Message:
          <textarea placeholder="Write your message with placeholders" />
        </label>
        <br />
        <label>
          Media:
          <input type="file" />
        </label>
        <br />
        <label>
          Category Filters:
          <select multiple>
            <option value="vip">VIP</option>
            <option value="new">New</option>
            <option value="returning">Returning</option>
          </select>
        </label>
        <br />
        <label>
          Quiet Hours:
          <input type="time" /> to <input type="time" />
        </label>
        <br />
        <label>
          Nudge Message:
          <input type="text" placeholder="Follow-up text" />
        </label>
        <br />
        <label>
          Link Tracking URL:
          <input type="url" placeholder="https://" />
        </label>
        <br />
        <button type="submit">Start Campaign</button>
      </form>
    </div>
  )
}
