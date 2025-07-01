import React, { useState, useEffect } from 'react'

export default function CampaignMonitor() {
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState([])
  const [logs, setLogs] = useState([])

  // mock progress simulation
  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        const next = p < 100 ? p + 5 : 100
        setLogs(l => [...l, `Sent message ${next}`])
        return next
      })
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (

    <div className="p-4 space-y-4">
      <h2 className="text-2xl mb-2 font-semibold">Campaign Monitor</h2>

      <div>
        <h3 className="font-medium mb-1">Live Sending Status</h3>
        <div className="w-full bg-gray-200 h-4 rounded overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm mt-1">{progress}% complete</p>
      </div>

      <div>
        <h3 className="font-medium mb-1">Error Notifications</h3>
        {errors.length === 0 ? (
          <p className="text-sm text-gray-500">No errors</p>
        ) : (
          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <h3 className="font-medium">Quiet Hours:</h3>
        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm">
          Off
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <h3 className="font-medium">Nudge Status:</h3>
        <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
          Waiting
        </span>
      </div>

      <div className="text-sm">
        <h3 className="font-medium">Revenue Generated</h3>
        <p>$123.45</p>
      </div>

      <div>
        <h3 className="font-medium mb-1">Live Logs</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">No logs yet</p>
        ) : (
          <ul className="text-sm list-disc list-inside space-y-1">
            {logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
