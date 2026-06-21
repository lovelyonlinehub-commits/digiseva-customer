import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const ICON_MAP = {
  'Tax & Accounting': 'ti-receipt-tax',
  'Identity Document': 'ti-id-badge',
  'Government Certificate': 'ti-certificate',
  'Financial': 'ti-table',
}

export default function Home({ onSelectService }) {
  const [services, setServices] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data && !error) {
      setServices(data)
      setFiltered(data)
    }
    setLoading(false)
  }

  function handleSearch(value) {
    setSearch(value)
    const q = value.toLowerCase()
    setFiltered(
      services.filter(
        (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      )
    )
  }

  if (loading) {
    return <div className="empty-state"><p>Services load ho rahi hain...</p></div>
  }

  return (
    <div>
      <div className="search-box">
        <i className="ti ti-search"></i>
        <input
          placeholder="Service dhundho — GST, PAN, Certificate..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="section-title">Sabhi services ({filtered.length})</div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="ti ti-search-off"></i>
          <p>Koi service nahi mili</p>
        </div>
      )}

      {filtered.map((s) => (
        <div className="svc-card" key={s.id} onClick={() => onSelectService(s)}>
          <div className="svc-icon">
            <i className={`ti ${ICON_MAP[s.category] || 'ti-file'}`}></i>
          </div>
          <div className="svc-info">
            <div className="sname">{s.name}</div>
            <div className="sdesc">{s.category} &bull; Docs: {s.required_docs}</div>
          </div>
          <div className="svc-price">₹{s.price}</div>
        </div>
      ))}
    </div>
  )
}
