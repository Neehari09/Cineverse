import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import Navbar from '../components/Navbar';
import './Login.css';

const BACKEND_URL = "http://localhost:8000/api";

export default function Login() {
    const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'email' | 'email_otp'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [authError, setAuthError] = useState(null);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        if (phone.length < 10) return;
        
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/auth/send-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            
            if (res.ok) {
                setStep('otp');
            } else {
                setAuthError("Failed to send OTP. Please try again.");
            }
        } catch (err) {
            setAuthError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^[0-9]*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // ---------------- EMAIL FLOW ----------------
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/auth/send-email-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            
            if (res.ok) {
                setStep('email_otp');
                setOtp(['', '', '', '', '', '']);
            } else {
                setAuthError("Failed to send OTP. Please try again.");
            }
        } catch (error) {
            setAuthError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailOtpLogin = async (e) => {
        e.preventDefault();
        const enteredOtp = otp.join('');
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/verify-email-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: enteredOtp }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Invalid OTP');
            }
            
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            const existingStr = localStorage.getItem('user_profile');
            let profile = {};
            if (existingStr) {
                try { profile = JSON.parse(existingStr); } catch (e) { }
            }

            profile = { ...profile, email: email, authProvider: 'email' };
            saveProfileAndContinue(profile);
        } catch (error) {
            setAuthError(error.message);
        } finally {
            setLoading(false);
        }
    };



    // Shared helper
    const saveProfileAndContinue = (updates, redirectTarget = '/') => {
        const existingStr = localStorage.getItem('user_profile');
        let profile = {};
        if (existingStr) {
            try { profile = JSON.parse(existingStr); } catch (e) { }
        }

        profile = { ...profile, ...updates };
        localStorage.setItem('user_profile', JSON.stringify(profile));
        window.dispatchEvent(new Event('storage'));
        
        if (location.state && location.state.returnTo) {
            navigate(location.state.returnTo, { state: location.state });
        } else {
            navigate(redirectTarget);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const fullNumber = `+91 ${phone}`;
        const enteredOtp = otp.join('');
        
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/auth/verify-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: enteredOtp }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Invalid OTP');
            }
            
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            const existingStr = localStorage.getItem('user_profile');
            let profile = {};
            if (existingStr) {
                try { profile = JSON.parse(existingStr); } catch (e) { }
            }

            if (profile.mobile !== fullNumber) {
                profile = { ...profile, mobile: fullNumber, firstName: profile.firstName || '', lastName: profile.lastName || '' };
            }

            // Redirect to Profile Page for Mobile Login
            saveProfileAndContinue(profile, '/edit-profile');
        } catch (error) {
            console.error("Phone Auth Verification failed:", error);
            setAuthError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const loginOrRegisterUser = async (username, password, email = '', isSocial = false) => {
        const response = await fetch(`${BACKEND_URL}/auth/login-or-register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email, is_social: isSocial }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Authentication failed');
        }
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return data;
    };

    // ---------------- GOOGLE LOGIN ----------------
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setGoogleError(null);
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch Google profile');
                const data = await res.json();
                
                // Connect to Django Backend using Google Data
                const email = data.email;
                const dummyPassword = `GAuth_${data.sub}`; // Unique password based on their Google ID
                
                await loginOrRegisterUser(email, dummyPassword, email, true);

                saveProfileAndContinue({
                    firstName: data.given_name || '',
                    lastName: data.family_name || '',
                    email: data.email || '',
                    avatar: data.picture || '',
                    authProvider: 'google',
                });
            } catch (err) {
                setGoogleError('Could not sign in with Google. Please try again.');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setGoogleError('Google sign-in was cancelled or failed.');
            setGoogleLoading(false);
        },
    });

    return (
        <div className="login-page">
            <Navbar />
            <main className="login-main">
                <div className="login-container">
                    <div className="login-header">
                        <h2>Welcome to CineVerse</h2>
                        <p>
                            {step === 'phone' && 'Login or Sign up to continue'}
                            {step === 'otp' && `Enter OTP sent to +91 ${phone}`}
                            {step === 'email' && 'Enter your email to continue'}
                            {step === 'email_otp' && `Enter OTP sent to ${email}`}
                        </p>
                    </div>

                    {step === 'phone' ? (
                        <form className="login-form" onSubmit={handlePhoneSubmit}>
                            <div className="login-input-group">
                                <label>Mobile Number</label>
                                <div className="login-phone-input">
                                    <span className="login-country-code">+91</span>
                                    <input
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button type="submit" className="login-primary-btn" disabled={phone.length < 10}>
                                Continue
                            </button>
                        </form>
                    ) : step === 'otp' ? (
                        <form className="login-form" onSubmit={handleLogin}>
                            {authError && <p className="login-error" style={{color: 'red', marginBottom: '10px'}}>{authError}</p>}
                            <div className="login-otp-group">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    />
                                ))}
                            </div>
                            <button type="submit" className="login-primary-btn" disabled={loading || otp.some((d) => !d)}>
                                {loading ? <div className="spinner"></div> : 'Verify & Login'}
                            </button>
                            <button type="button" className="login-text-btn" onClick={() => { setStep('phone'); setAuthError(null); }}>
                                Change Mobile Number
                            </button>
                        </form>
                    ) : null}

                    {step === 'email' && (
                        <form className="login-form" onSubmit={handleEmailSubmit}>
                            {authError && <p className="login-error" style={{color: 'red', marginBottom: '10px'}}>{authError}</p>}
                            <div className="login-input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '1rem', marginBottom: '15px' }}
                                />
                            </div>
                            <button type="submit" className="login-primary-btn" disabled={loading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}>
                                {loading ? <div className="spinner"></div> : 'Send OTP to Email'}
                            </button>
                            <button type="button" className="login-text-btn" onClick={() => setStep('phone')}>
                                Back
                            </button>
                        </form>
                    )}

                    {step === 'email_otp' && (
                        <form className="login-form" onSubmit={handleEmailOtpLogin}>
                            {authError && <p className="login-error" style={{color: 'red', marginBottom: '10px'}}>{authError}</p>}
                            <div className="login-otp-group">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    />
                                ))}
                            </div>
                            <button type="submit" className="login-primary-btn" disabled={loading || otp.some((d) => !d)}>
                                {loading ? <div className="spinner"></div> : 'Verify & Login'}
                            </button>
                            <button type="button" className="login-text-btn" onClick={() => { setStep('email'); setAuthError(null); }}>
                                Change Email Address
                            </button>
                        </form>
                    )}



                    <div className="login-divider">
                        <span>OR</span>
                    </div>

                    {googleError && <p className="login-error">{googleError}</p>}

                    <button className="login-social-btn" type="button" onClick={() => googleLogin()} disabled={googleLoading}>
                        <IconGoogle />
                        {googleLoading ? 'Signing in…' : 'Continue with Google'}
                    </button>

                    <button className="login-social-btn" type="button" onClick={() => { setStep('email'); setAuthError(null); }}>
                        <IconEmail />
                        Continue with Email
                    </button>

                    <p className="login-terms">
                        By continuing, you agree to CineVerse's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                    </p>
                </div>
            </main>
        </div>
    );
}

function IconGoogle() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function IconEmail() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 4l10 8 10-8" />
        </svg>
    );
}
