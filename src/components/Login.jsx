import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLoginSuccess }) {
  const [step, setStep] = useState('mobile') // mobile | otp
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // NOTE: Abhi yeh OTP ko sirf screen pe dikha rahe hain (testing ke liye).
  // Production mein yahan SMS API (jaise Fast2SMS, MSG91, Twilio) lagana padega
  // jo actual SMS bheje. Woh integration baad mein add karenge.

  function handleSendOtp() {
    setError('')
    if (mobile.length !== 10) {
      setError('10 digit ka sahi mobile number daalein')
      return
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otpCode)
    setStep('otp')
    // DEMO ke liye OTP yahan console mein dikha rahe hain.
    // Asal app mein yeh SMS se jayega, screen pe nahi dikhega.
    console.log('Demo OTP:', otpCode)
  }

  async function handleVerifyOtp() {
    setError('')
    if (otp !== generatedOtp) {
      setError('OTP sahi nahi hai')
      return
    }
    setLoading(true)

    // Customer pehle se hai ya naya banana hai check karo
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('mobile', mobile)
      .single()

    if (existing) {
      onLoginSuccess(existing)
    } else {
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({ mobile })
        .select()
        .single()

      if (insertError) {
        setError('Login mein dikkat hui, dobara try karein')
        setLoading(false)
        return
      }
      onLoginSuccess(newCustomer)
    }
    setLoading(false)
  }

  return (
    <div className="app-shell">
      <div className="login-wrap">
        <i className="ti ti-file-certificate logo-icon"></i>
        <h2>Digi Seva Center</h2>
        <p>Mobile number se login karein, OTP aayega</p>

        {step === 'mobile' && (
          <>
            <div className="field">
              <label>Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10 digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" onClick={handleSendOtp}>
              <i className="ti ti-send"></i> OTP Bhejo
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="success-msg">
              <i className="ti ti-check"></i> OTP bheja gaya {mobile} par
              <br />
              <small style={{ opacity: 0.7 }}>(Demo OTP: {generatedOtp})</small>
            </div>
            <div className="field">
              <label>6-digit OTP daalein</label>
              <input
                type="number"
                maxLength={6}
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? <span className="spinner"></span> : <i className="ti ti-login"></i>}
              {loading ? 'Login ho raha hai...' : 'Login Karein'}
            </button>
            <button className="btn-outline" onClick={() => setStep('mobile')}>
              Wapas jaayein
            </button>
          </>
        )}
      </div>
    </div>
  )
}
