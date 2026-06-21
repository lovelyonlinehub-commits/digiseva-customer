import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Profile({ customer, onLogout }) {
  const [stats, setStats] = useState({ total: 0, complete: 0 })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { data } = await supabase
      .from('orders')
      .select('status')
      .eq('customer_id', customer.id)

    if (data) {
      setStats({
        total: data.length,
        complete: data.filter((o) => o.status === 'complete').length,
      })
    }
  }

  const initial = (customer.full_name || customer.mobile || 'C')[0].toUpperCase()

  return (
    <div>
      <div className="profile-row">
        <div className="avatar">{initial}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{customer.full_name || 'Naam set nahi hai'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Mobile: {customer.mobile}</div>
        </div>
      </div>

      <div className="section-title">Meri services</div>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="v">{stats.total}</div>
          <div className="l">Total Orders</div>
        </div>
        <div className="stat-box">
          <div className="v">{stats.complete}</div>
          <div className="l">Complete</div>
        </div>
      </div>

      <button className="btn-outline" onClick={onLogout}>
        <i className="ti ti-logout"></i> Logout
      </button>
    </div>
  )
}
