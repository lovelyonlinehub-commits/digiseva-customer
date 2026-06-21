import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const STEPS = [
  { key: 'pending', label: 'Order place hua' },
  { key: 'reviewed', label: 'Document review' },
  { key: 'in_progress', label: 'Kaam shuru' },
  { key: 'complete', label: 'Certificate ready' },
]

function getStepIndex(status) {
  if (status === 'pending') return 0
  if (status === 'in_progress') return 2
  if (status === 'complete') return 4
  return 0
}

function badgeClass(status) {
  if (status === 'pending') return 'badge-pending'
  if (status === 'in_progress') return 'badge-progress'
  if (status === 'complete') return 'badge-complete'
  if (status === 'cancelled') return 'badge-cancelled'
  return ''
}

function badgeLabel(status) {
  const labels = {
    pending: 'Pending',
    in_progress: 'Kaam chal raha hai',
    complete: 'Mukammal',
    cancelled: 'Cancel hua',
  }
  return labels[status] || status
}

export default function MyOrders({ customer }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState({}) // order_id -> [{file_name, file_url}]

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    if (data && !error) {
      setOrders(data)
      loadCertificates(data.map((o) => o.id))
    }
    setLoading(false)
  }

  async function loadCertificates(orderIds) {
    if (orderIds.length === 0) return
    const { data } = await supabase
      .from('order_documents')
      .select('*')
      .in('order_id', orderIds)
      .eq('doc_type', 'certificate')

    if (data) {
      const grouped = {}
      data.forEach((doc) => {
        if (!grouped[doc.order_id]) grouped[doc.order_id] = []
        grouped[doc.order_id].push(doc)
      })
      setCertificates(grouped)
    }
  }

  if (loading) {
    return <div className="empty-state"><p>Orders load ho rahe hain...</p></div>
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <i className="ti ti-file-off"></i>
        <p>Abhi koi order nahi hai</p>
      </div>
    )
  }

  const stepIdx = (status) => getStepIndex(status)

  return (
    <div>
      <div className="section-title">Aapke sabhi orders ({orders.length})</div>
      {orders.map((o) => {
        const idx = stepIdx(o.status)
        const certs = certificates[o.id] || []
        return (
          <div className="order-card" key={o.id}>
            <div className="order-top">
              <span className="order-svc">{o.service_name}</span>
              <span className={`badge ${badgeClass(o.status)}`}>{badgeLabel(o.status)}</span>
            </div>
            <div className="order-meta">#{o.order_number} &bull; ₹{o.price} &bull; {new Date(o.created_at).toLocaleDateString('en-IN')}</div>
            <div className="order-meta">
              Payment: {o.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
            </div>

            <div className="track-steps">
              {STEPS.map((s, i) => (
                <div className="step" key={s.key}>
                  <div className={`step-dot ${i <= idx ? 'done' : 'wait'}`}>
                    {i <= idx ? <i className="ti ti-check" style={{ fontSize: 9 }}></i> : ''}
                  </div>
                  <span className={`step-label ${i <= idx ? 'done' : ''}`}>{s.label}</span>
                </div>
              ))}
            </div>

            {o.status === 'complete' && certs.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {certs.map((c, i) => (
                  <a
                    key={i}
                    href={c.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 6 }}
                  >
                    <i className="ti ti-download"></i> {c.file_name} Download
                  </a>
                ))}
              </div>
            )}

            {o.status === 'complete' && certs.length === 0 && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
                Certificate jald hi upload hoga
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
