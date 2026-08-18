import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import './Mybookings.css';
import { getPosterUrl } from '../api/tmdb';
import Navbar from '../components/Navbar';
import { getBookings } from '../api/backend';

const TABS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
];

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---------------- DOWNLOAD TICKET (Canvas-based) ---------------- */
async function downloadTicket(booking) {
    const { movie_title, cinema, show_date, show_time, format, seat_numbers, amount, booking_code, movie_poster, tmdb_movie_id } = booking;
    const seats = seat_numbers ? seat_numbers.split(',') : [];
    const W = 600, H = 300;
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;   // retina
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // background
    ctx.fillStyle = '#0f0f18';
    roundRect(ctx, 0, 0, W, H, 18);
    ctx.fill();

    // red accent strip
    ctx.fillStyle = '#e63946';
    roundRect(ctx, 0, 0, 8, H, [18, 0, 0, 18]);
    ctx.fill();

    const qrData = `http://192.168.1.7:5173/ticket/${booking_code}`;

    const loadImage = (src, isCrossOrigin) => {
        return new Promise((resolve) => {
            const img = new Image();
            if (isCrossOrigin) img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null); // fallback
            img.src = src;
        });
    };

    let qrImg = null;
    let posterImg = null;

    try {
        const qrDataUrl = await QRCodeLib.toDataURL(qrData, { width: 90, margin: 4, color: { dark: '#000000', light: '#ffffff' } });
        const results = await Promise.all([
            loadImage(qrDataUrl, false),
            movie_poster ? loadImage(getPosterUrl(movie_poster) + '?not-from-cache-please', true) : Promise.resolve(null)
        ]);
        qrImg = results[0];
        posterImg = results[1];
    } catch (e) {
        console.error("Image loading failed", e);
    }

    // poster placeholder OR real poster
    if (posterImg) {
        ctx.save();
        roundRect(ctx, 24, 24, 80, 110, 10);
        ctx.clip();
        ctx.drawImage(posterImg, 24, 24, 80, 120);
        ctx.restore();
    } else {
        ctx.fillStyle = '#1c1c2e';
        roundRect(ctx, 24, 24, 80, 110, 10);
        ctx.fill();
        ctx.fillStyle = '#e63946';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('C', 64, 88);
    }

    // title
    ctx.fillStyle = '#f5f5f5';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(movie_title.length > 25 ? movie_title.slice(0, 25) + '…' : movie_title, 120, 46);

    // meta line
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(cinema, 120, 66);
    ctx.fillText(`${new Date(show_date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`, 120, 84);
    ctx.fillText(`${show_time}  ·  ${format}`, 120, 100);

    // dashed divider
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(24, 152);
    ctx.lineTo(W - 24, 152);
    ctx.stroke();
    ctx.setLineDash([]);

    // bottom row labels
    const cols = [
        { label: 'Seats', value: seats.join(', '), x: 40 },
        { label: 'Paid', value: `\u20B9${amount}`, x: 200 },
        { label: 'Code', value: booking_code, x: 340 },
    ];
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    cols.forEach(({ label, x }) => ctx.fillText(label.toUpperCase(), x, 178));
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#f5f5f5';
    cols.forEach(({ value, x }) => ctx.fillText(value, x, 198));

    // CineVerse branding
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('CineVerse', W - 24, H - 20);
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Your Movie. Your Universe.', W - 24, H - 8);

    // QR Code on top right
    if (qrImg) {
        ctx.drawImage(qrImg, W - 114, 24, 90, 90);
    }
    
    try {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `CineVerse_${booking_code}.png`;
        link.click();
    } catch (e) {
        console.error("Canvas export failed (likely CORS)", e);
        alert("Failed to generate ticket image due to security constraints. Please contact support.");
    }
}

function roundRect(ctx, x, y, w, h, r) {
    const radii = Array.isArray(r) ? r : [r, r, r, r];
    ctx.beginPath();
    ctx.moveTo(x + radii[0], y);
    ctx.lineTo(x + w - radii[1], y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radii[1]);
    ctx.lineTo(x + w, y + h - radii[2]);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h);
    ctx.lineTo(x + radii[3], y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radii[3]);
    ctx.lineTo(x, y + radii[0]);
    ctx.quadraticCurveTo(x, y, x + radii[0], y);
    ctx.closePath();
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function MyBookings({ onViewTicket }) {
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!localStorage.getItem('access_token')) {
            navigate('/login');
            return;
        }
        getBookings()
            .then(data => setBookings(data))
            .catch(err => {
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_profile');
                    navigate('/login');
                }
            });
    }, [navigate]);

    const cancelBooking = useCallback((id) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This cannot be undone.')) return;
        setBookings((prev) => {
            const updated = prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b));
            // In a real app you'd call an API to cancel it here.
            return updated;
        });
    }, []);

    const filtered = useMemo(
        () => bookings.filter((b) => b.status === activeTab).sort((a, b) => new Date(b.show_date) - new Date(a.show_date)),
        [bookings, activeTab]
    );

    const counts = useMemo(() => {
        const c = { upcoming: 0, past: 0, cancelled: 0 };
        bookings.forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; });
        return c;
    }, [bookings]);

    return (
        <div className="mb-page">
            <Navbar />

            <div className="mb-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`mb-tab ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                        {counts[t.key] > 0 && <span className="mb-tab-count">{counts[t.key]}</span>}
                    </button>
                ))}
            </div>

            <main className="mb-main">
                <h1 className="mb-page-title">My Bookings</h1>
                {filtered.length === 0 ? (
                    <EmptyState tab={activeTab} />
                ) : (
                    <div className="mb-ticket-list">
                        {filtered.map((b) => (
                            <TicketCard
                                key={b.id}
                                booking={b}
                                onView={() => onViewTicket && onViewTicket(b)}
                                onDownload={() => downloadTicket(b)}
                                onCancel={() => cancelBooking(b.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

/* ---------------- TICKET CARD ---------------- */
function TicketCard({ booking, onView, onDownload, onCancel }) {
    const { movie_title, movie_poster, cinema, show_date, show_time, format, seat_numbers, amount, booking_code, status } = booking;
    const seats = seat_numbers ? seat_numbers.split(',') : [];

    return (
        <div className={`mb-ticket ${status === 'cancelled' ? 'mb-ticket-cancelled' : ''}`} onClick={onView}>
            <div className="mb-ticket-poster">
                {movie_poster ? (
                    <img src={getPosterUrl(movie_poster)} alt={movie_title} />
                ) : (
                    <div className="mb-poster-fallback"><IconFilm /></div>
                )}
            </div>

            <div className="mb-ticket-body">
                <div className="mb-ticket-top">
                    <h3>{movie_title}</h3>
                    <span className={`mb-status-badge mb-status-${status}`}>
                        {status === 'upcoming' ? 'Confirmed' : status === 'past' ? 'Watched' : 'Cancelled'}
                    </span>
                </div>

                <div className="mb-ticket-meta">
                    <span><IconPin /> {cinema}</span>
                    <span><IconCalendar /> {formatDate(show_date)}</span>
                    <span><IconClock /> {show_time} &middot; {format}</span>
                </div>

                <div className="mb-ticket-divider">
                    <span className="mb-notch mb-notch-left" />
                    <span className="mb-dashed-line" />
                    <span className="mb-notch mb-notch-right" />
                </div>

                <div className="mb-ticket-bottom">
                    <div className="mb-ticket-seats">
                        <span className="mb-label">Seats</span>
                        <strong>{seats.join(', ')}</strong>
                    </div>
                    <div className="mb-ticket-amount">
                        <span className="mb-label">Paid</span>
                        <strong>₹{amount}</strong>
                    </div>
                    <div className="mb-ticket-code">
                        <span className="mb-label">Code</span>
                        <strong>{booking_code}</strong>
                    </div>
                    <div className="mb-ticket-qr">
                        <BookingQRCode booking={booking} />
                    </div>
                </div>

                {status === 'upcoming' && (
                    <div className="mb-ticket-actions">
                        <button
                            className="mb-action-btn mb-action-primary"
                            onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        >
                            <IconDownload /> Download Ticket
                        </button>
                        <button
                            className="mb-action-btn mb-action-cancel"
                            onClick={(e) => { e.stopPropagation(); onCancel(); }}
                        >
                            Cancel Booking
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------------- QR CODE ---------------- */
function BookingQRCode({ booking }) {
    const [showModal, setShowModal] = useState(false);
    const { movie_title, cinema, show_date, show_time, seat_numbers, booking_code } = booking;
    const qrData = `http://192.168.1.7:5173/ticket/${booking_code}`;

    return (
        <>
            <div className="mb-qr-real" onClick={(e) => { e.stopPropagation(); setShowModal(true); }}>
                <div style={{ background: '#ffffff', padding: '8px', cursor: 'zoom-in', borderRadius: '4px' }}>
                    <QRCode 
                        value={qrData} 
                        size={64} 
                        fgColor="#000000" 
                        bgColor="#ffffff"
                    />
                </div>
            </div>
            {showModal && (
                <div className="mb-qr-modal-overlay" onClick={(e) => { e.stopPropagation(); setShowModal(false); }}>
                    <div className="mb-qr-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '8px' }}>
                            <QRCode 
                                value={qrData} 
                                size={256} 
                                fgColor="#000000" 
                                bgColor="#ffffff"
                            />
                        </div>
                        <p className="mb-qr-modal-text">Scan to Verify</p>
                        <button className="mb-action-btn mb-action-primary" onClick={() => setShowModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
}

/* ---------------- EMPTY STATE ---------------- */
function EmptyState({ tab }) {
    const navigate = useNavigate();
    const copy = {
        upcoming: { title: 'No upcoming bookings', desc: 'Your next movie night starts with a ticket.' },
        past: { title: 'No past bookings yet', desc: 'Watched movies will show up here.' },
        cancelled: { title: 'No cancelled bookings', desc: "You haven't cancelled anything — nice." },
    }[tab];

    return (
        <div className="mb-empty">
            <div className="mb-empty-icon"><IconTicket /></div>
            <h2>{copy.title}</h2>
            <p>{copy.desc}</p>
            {tab === 'upcoming' && (
                <button className="mb-empty-cta" onClick={() => navigate('/movies')}>
                    Browse Movies
                </button>
            )}
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function IconFilm() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="8" y1="2" x2="8" y2="22" /><line x1="16" y1="2" x2="16" y2="22" /></svg>; }
function IconPin() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function IconCalendar() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconClock() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>; }
function IconTicket() { return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8" /><path d="M2 12h20" /></svg>; }