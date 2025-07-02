import React, { useEffect, useState } from 'react'

const API_BASE =
  import.meta.env.VITE_API_BASE ||

  'https://retargetting-worker.elmtalabx.workers.dev'


export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [keywords, setKeywords] = useState('')

  const [description, setDescription] = useState('')
  const [examples, setExamples] = useState('')

  const [status, setStatus] = useState('')

  const fetchCategories = async () => {
    try {
      const resp = await fetch(`${API_BASE}/categories`)
      const data = await resp.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('fetch categories', err)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const submit = async e => {
    e.preventDefault()
    setStatus('Saving...')
    try {
      const resp = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({
          name,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          description,
          examples: examples
            .split('\n')
            .map(l => l.trim())
            .filter(l => l),
        })

      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(JSON.stringify(data))
      setStatus('Saved')
      setName('')
      setKeywords('')

      setDescription('')
      setExamples('')

      fetchCategories()
    } catch (err) {
      console.error('create category', err)
      setStatus('Failed')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl mb-2 font-semibold">Categories</h2>
      <form onSubmit={submit} className="space-y-2 bg-white p-4 rounded shadow max-w-md">
        <input
          type="text"
          placeholder="Category name"
          className="border p-2 w-full"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Keywords (comma separated)"
          className="border p-2 w-full"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
        />

        <textarea
          placeholder="AI chat description"
          className="border p-2 w-full"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <textarea
          placeholder="Example chats (one per line)"
          className="border p-2 w-full"
          value={examples}
          onChange={e => setExamples(e.target.value)}
        />

        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-white p-3 rounded shadow">
            <h3 className="font-medium mb-1">{c.name}</h3>
            <p className="text-sm text-gray-600">
              {(JSON.parse(c.keywords_json || '[]')).join(', ')}
            </p>

            {c.description && (
              <p className="text-sm text-gray-500 mt-1">{c.description}</p>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}
