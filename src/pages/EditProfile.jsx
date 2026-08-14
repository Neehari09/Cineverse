import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../components/Navbar';
import './EditProfile.css';

export default function EditProfile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        mobile: '+91 7093249229',
        email: '',
        firstName: '',
        lastName: '',
        birthday: '',
        identity: '',
        married: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('user_profile');
        if (saved) {
            setProfile(JSON.parse(saved));
        }
    }, []);

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        localStorage.setItem('user_profile', JSON.stringify(profile));
        alert('Profile saved successfully!');
        window.location.href = '/';
    };

    const handleLogout = () => {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        alert('Logged out successfully!');
        window.location.href = '/';
    };

    return (
        <div className="ep-page">
            <Navbar />
            <main className="ep-main">
                <div className="ep-container">
                    <div className="ep-header">
                        <button className="ep-back-btn" onClick={() => navigate(-1)}>
                            <IconArrowLeft />
                        </button>
                        <h2>Edit profile</h2>
                    </div>

                    <div className="ep-section">
                        <div className="ep-input-group">
                            <label>Mobile Number</label>
                            <div className="ep-input-wrapper ep-verified">
                                <input type="text" value={profile.mobile || ''} disabled />
                                <span className="ep-status-text success">✓ EDIT</span>
                            </div>
                        </div>

                        <div className="ep-input-group">
                            <label>Email Address</label>
                            <div className="ep-input-wrapper">
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={profile.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                                <span className="ep-status-text danger">Add</span>
                            </div>
                        </div>
                    </div>

                    <div className="ep-section">
                        <h3 className="ep-section-title">Personal Details</h3>

                        <div className="ep-input-group">
                            <label>First Name<span className="req">*</span></label>
                            <input
                                type="text"
                                placeholder="Enter first name here"
                                value={profile.firstName || ''}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                            />
                        </div>

                        <div className="ep-input-group">
                            <label>Last Name<span className="req">*</span></label>
                            <input
                                type="text"
                                placeholder="Enter last name here"
                                value={profile.lastName || ''}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                            />
                        </div>

                        <div className="ep-input-group">
                            <label>Birthday (Optional)</label>
                            <div className="ep-calendar-wrapper">
                                <DatePicker
                                    selected={profile.birthday ? new Date(profile.birthday) : null}
                                    onChange={(date) => handleChange('birthday', date ? date.toISOString() : '')}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="DD/MM/YY"
                                    showYearDropdown
                                    scrollableYearDropdown
                                    yearDropdownItemNumber={100}
                                    maxDate={new Date()}
                                    className="ep-date-input"
                                />
                                <IconCalendar />
                            </div>
                        </div>

                        <div className="ep-input-group">
                            <label>Identity (Optional)</label>
                            <div className="ep-pill-group">
                                <button
                                    className={`ep-pill ${profile.identity === 'Woman' ? 'active' : ''}`}
                                    onClick={() => handleChange('identity', 'Woman')}
                                >
                                    Woman
                                </button>
                                <button
                                    className={`ep-pill ${profile.identity === 'Man' ? 'active' : ''}`}
                                    onClick={() => handleChange('identity', 'Man')}
                                >
                                    Man
                                </button>
                            </div>
                        </div>

                        <div className="ep-input-group">
                            <label>Married (Optional)</label>
                            <div className="ep-pill-group">
                                <button
                                    className={`ep-pill ${profile.married === 'Yes' ? 'active' : ''}`}
                                    onClick={() => handleChange('married', 'Yes')}
                                >
                                    Yes
                                </button>
                                <button
                                    className={`ep-pill ${profile.married === 'No' ? 'active' : ''}`}
                                    onClick={() => handleChange('married', 'No')}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="ep-actions">
                        <button
                            className="ep-save-btn"
                            disabled={!profile.firstName || !profile.lastName}
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                        <button
                            className="ep-logout-btn"
                            onClick={handleLogout}
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function IconArrowLeft() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg className="ep-calendar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
