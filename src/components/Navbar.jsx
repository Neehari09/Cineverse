import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const LOCATIONS = ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'];

export default function Navbar({ searchValue, onSearchChange }) {
    const [localSearch, setLocalSearch] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(
        localStorage.getItem('user_location') || LOCATIONS[0]
    );
    const [showLocations, setShowLocations] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const profileRef = useRef(null);

    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    // Load user profile and close dropdown on click outside
    useEffect(() => {
        const loadProfile = () => {
            const saved = localStorage.getItem('user_profile');
            if (saved) {
                try { setUserProfile(JSON.parse(saved)); } catch (e) {}
            } else {
                setUserProfile(null);
            }
        };
        
        const checkPermission = async () => {
            if (!navigator.permissions) {
                if (!localStorage.getItem('user_location')) setShowLocationPrompt(true);
                return;
            }
            try {
                const perm = await navigator.permissions.query({ name: 'geolocation' });
                if (perm.state === 'prompt') {
                    setShowLocationPrompt(true);
                } else if (perm.state === 'granted') {
                    loadLocation();
                }
            } catch (e) {
                if (!localStorage.getItem('user_location')) setShowLocationPrompt(true);
            }
        };

        checkPermission();
        loadProfile();
        window.addEventListener('storage', loadProfile);
        
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('storage', loadProfile);
        };
    }, []);

    const loadLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await res.json();
                    const city = data.city || data.locality;
                    if (city) {
                        const locationName = city.includes('Uppal') || city.includes('Secunderabad') ? 'Hyderabad' : city;
                        setSelectedLocation(locationName);
                        localStorage.setItem('user_location', locationName);
                        window.dispatchEvent(new Event('locationChange'));
                    }
                } catch (e) {}
            });
        }
    };

    // If parent controls search (e.g. Movies page), use their value; else use local state
    const isControlled = onSearchChange !== undefined;
    const search = isControlled ? (searchValue ?? '') : localSearch;
    const setSearch = isControlled ? onSearchChange : setLocalSearch;

    const handleSearch = (e) => {
        if (e.key === 'Enter' && search.trim() && !isControlled) {
            navigate(`/movies?q=${encodeURIComponent(search.trim())}`);
            setLocalSearch('');
        }
    };

    return (
        <>
            {showLocationPrompt && (
                <div className="cv-location-modal-overlay">
                    <div className="cv-location-modal">
                        <div className="cv-location-modal-icon">
                            <IconPin />
                        </div>
                        <h2>Share Your Location</h2>
                        <p>Cineverse uses your location to find the best movies and events in your city.</p>
                        <div className="cv-location-modal-actions">
                            <button className="cv-btn-primary" onClick={() => {
                                setShowLocationPrompt(false);
                                loadLocation();
                            }}>Allow Location Access</button>
                            <button className="cv-btn-ghost" onClick={() => setShowLocationPrompt(false)}>Skip for now</button>
                        </div>
                    </div>
                </div>
            )}
            <header className={`cv-navbar ${isMobileMenuOpen ? 'menu-open' : ''}`}>
                {/* LOGO */}
                <NavLink to="/" className="cv-logo" style={{ textDecoration: 'none' }}>
                    <div className="cv-logo-icon">
                        <IconLogo />
                    </div>
                    <span className="cv-logo-text">CineVerse</span>
                </NavLink>

                {/* NAV LINKS & ACTIONS WRAPPER */}
                <div className={`cv-nav-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    {/* NAV LINKS */}
                    <nav className="cv-nav-links" onClick={() => setIsMobileMenuOpen(false)}>
                        <NavLink to="/" end>Home</NavLink>
                        <NavLink to="/movies">Movies</NavLink>
                        <NavLink to="/events">Events</NavLink>
                        <NavLink to="/bookings">My Bookings</NavLink>
                    </nav>

                    {/* ACTIONS */}
                    <div className="cv-nav-actions">
                        <div className="cv-search">
                            <IconSearch />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <div className="cv-location">
                            <IconPin /> {selectedLocation}
                        </div>
                        {userProfile ? (
                            <div className="cv-avatar-pill" onClick={() => setShowProfileMenu(!showProfileMenu)} ref={profileRef} style={{cursor: 'pointer', position: 'relative'}}>
                                {userProfile.firstName ? (
                                    <div className="cv-avatar-text">
                                        <span>{userProfile.firstName}</span>
                                    </div>
                                ) : (
                                    <div className="cv-avatar">
                                        <IconUser />
                                    </div>
                                )}
                                {showProfileMenu && (
                                    <div className="cv-profile-dropdown">
                                        <div className="cv-profile-item" onClick={() => { setIsMobileMenuOpen(false); navigate('/edit-profile'); }}>Profile</div>
                                        <div className="cv-profile-item" onClick={() => {
                                            localStorage.removeItem('user_profile');
                                            localStorage.removeItem('access_token');
                                            localStorage.removeItem('refresh_token');
                                            setUserProfile(null);
                                            setIsMobileMenuOpen(false);
                                            navigate('/');
                                        }}>Logout</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <NavLink to="/login" className="cv-avatar-pill" onClick={() => setIsMobileMenuOpen(false)}>
                                <div className="cv-avatar">
                                    <IconUser />
                                </div>
                            </NavLink>
                        )}
                    </div>
                </div>

                <button 
                    className="cv-hamburger" 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <IconMenu isOpen={isMobileMenuOpen} />
                </button>
        </header>
        </>
    );
}

/* ---------------- ICONS ---------------- */
function IconSearch() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}
function IconPin() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}
function IconChevronDown() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function IconUser() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function IconLogo() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="4" ry="4"></rect>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
            <line x1="2" y1="6" x2="22" y2="6"></line>
            <line x1="2" y1="18" x2="22" y2="18"></line>
        </svg>
    );
}

function IconMenu({ isOpen }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
                <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
            ) : (
                <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
            )}
        </svg>
    );
}
