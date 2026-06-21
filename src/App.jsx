import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Home from './components/Home'
import OrderForm from './components/OrderForm'
import MyOrders from './components/MyOrders'
import Profile from './components/Profile'

export default function App() {
  // customer = logged in user object from "customers" table
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home') // home | orders | profile
  const [selectedService, setSelectedService] = useState(null) // jab order form khulta hai

  // App load hote hi check karo ki pehle se login hai ya nahi (localStorage se)
  useEffect(() => {
    const savedMobile = localStorage.getItem('digiseva_mobile')
    if (savedMobile) {
      loadCustomer(savedMobile)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadCustomer(mobile) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('mobile', mobile)
      .single()

    if (data && !error) {
      setCustomer(data)
    } else {
      localStorage.removeItem('digiseva_mobile')
    }
    setLoading(false)
  }

  function handleLoginSuccess(customerData) {
    setCustomer(customerData)
    localStorage.setItem('digiseva_mobile', customerData.mobile)
  }

  function handleLogout() {
    setCustomer(null)
    localStorage.removeItem('digiseva_mobile')
    setActiveTab('home')
  }

  function openOrderForm(service) {
    setSelectedService(service)
  }

  function closeOrderForm() {
    setSelectedService(null)
  }

  function handleOrderPlaced() {
    setSelectedService(null)
    setActiveTab('orders')
  }

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  if (!customer) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app-shell">
      <div className="header">
        <h1><i className="ti ti-file-certificate"></i> Digi Seva Center</h1>
        <button className="logout" onClick={handleLogout}>
          <i className="ti ti-logout"></i> Logout
        </button>
      </div>

      <div className="content">
        {selectedService ? (
          <OrderForm
            service={selectedService}
            customer={customer}
            onClose={closeOrderForm}
            onOrderPlaced={handleOrderPlaced}
          />
        ) : (
          <>
            {activeTab === 'home' && <Home onSelectService={openOrderForm} />}
            {activeTab === 'orders' && <MyOrders customer={customer} />}
            {activeTab === 'profile' && <Profile customer={customer} onLogout={handleLogout} />}
          </>
        )}
      </div>

      {!selectedService && (
        <div className="bottom-nav">
          <div
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <i className="ti ti-home"></i>
            Home
          </div>
          <div
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="ti ti-file-text"></i>
            Mere Orders
          </div>
          <div
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="ti ti-user"></i>
            Profile
          </div>
        </div>
      )}
    </div>
  )
}
