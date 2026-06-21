import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function OrderForm({ service, customer, onClose, onOrderPlaced }) {
  const [name, setName] = useState(customer.full_name || '')
  const [email, setEmail] = useState(customer.email || '')
  const [address, setAddress] = useState(customer.address || '')
  const [files, setFiles] = useState([]) // {file, name}
  const [uploading, setUploading] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...selected])
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function uploadFile(file, orderId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${orderId}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage.from('documents').getPublicUrl(filePath)
    return data.publicUrl
  }

  function generateOrderNumber() {
    return 'ORD' + Date.now().toString().slice(-8)
  }

  async function handlePlaceOrder() {
    setError('')
    if (!name.trim()) {
      setError('Apna naam bharein')
      return
    }
    if (!address.trim()) {
      setError('Apna pata bharein')
      return
    }

    setPlacing(true)

    // 1. Customer ka profile update karo (naam, email, address save karo)
    await supabase
      .from('customers')
      .update({ full_name: name, email, address })
      .eq('id', customer.id)

    // 2. Order banao
    const orderNumber = generateOrderNumber()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        service_id: service.id,
        customer_name: name,
        customer_mobile: customer.mobile,
        customer_email: email,
        customer_address: address,
        service_name: service.name,
        price: service.price,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single()

    if (orderError || !order) {
      setError('Order place karne mein dikkat hui, dobara try karein')
      setPlacing(false)
      return
    }

    // 3. Documents upload karo (agar koi hain)
    if (files.length > 0) {
      setUploading(true)
      for (const file of files) {
        const url = await uploadFile(file, order.id)
        if (url) {
          await supabase.from('order_documents').insert({
            order_id: order.id,
            file_name: file.name,
            file_url: url,
            uploaded_by: 'customer',
          })
        }
      }
      setUploading(false)
    }

    // 4. Status history mein entry daalo
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
      note: 'Order place hua',
    })

    setPlacing(false)
    onOrderPlaced()
  }

  return (
    <div>
      <div className="back-row">
        <button className="back-btn" onClick={onClose}>
          <i className="ti ti-arrow-left"></i>
        </button>
        <span className="title">{service.name}</span>
      </div>

      <div className="form-section">
        <h4><i className="ti ti-user"></i> Aapki jankari</h4>
        <div className="field">
          <label>Poora naam</label>
          <input
            placeholder="Jaise: Ramesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Mobile</label>
          <input value={customer.mobile} readOnly style={{ background: '#eee' }} />
        </div>
        <div className="field">
          <label>Email (optional)</label>
          <input
            type="email"
            placeholder="abc@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Pata (Address)</label>
          <input
            placeholder="Gali, Mohalla, Shahar"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h4><i className="ti ti-paperclip"></i> Documents upload karo</h4>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          Zaruri documents: <strong style={{ color: '#1a1a1a' }}>{service.required_docs}</strong>
        </div>
        <label className="upload-zone" style={{ display: 'block' }}>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <i className="ti ti-cloud-upload"></i>
          <p>Yahan click karein file select karne ke liye<br />JPG, PNG, PDF — Max 5MB</p>
        </label>
        <div>
          {files.map((f, idx) => (
            <span className="doc-chip" key={idx}>
              <i className="ti ti-file"></i> {f.name}
              <span className="remove" onClick={() => removeFile(idx)}>✕</span>
            </span>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h4><i className="ti ti-coin"></i> Payment</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#666' }}>Service fee</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0f766e' }}>₹{service.price}</span>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          Payment order place hone ke baad WhatsApp/call par confirm hoga
          (UPI / Cash / Online — jo aapko suitable ho)
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button className="btn-primary" onClick={handlePlaceOrder} disabled={placing}>
        {placing ? (
          <>
            <span className="spinner"></span>
            {uploading ? 'Documents upload ho rahe hain...' : 'Order place ho raha hai...'}
          </>
        ) : (
          <>
            <i className="ti ti-check"></i> Order Place Karein
          </>
        )}
      </button>
    </div>
  )
}
