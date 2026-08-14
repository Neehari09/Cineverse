import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

/* ---------------- MOCK DATA (swap for real API later) ---------------- */

const CATEGORIES = ['All', 'Premieres', 'Concerts', 'Meet & Greet', 'Anime Nights', 'Gaming'];

const generateEvents = () => {
    const getFutureDate = (daysAhead) => {
        const d = new Date();
        d.setDate(d.getDate() + daysAhead);
        return d.toISOString().split('T')[0];
    };

    return [
        {
            id: 'ev1',
            title: 'Dune: Part Three — Red Carpet Premiere',
            category: 'Premieres',
            venue: 'CineVerse IMAX — Phoenix Mall',
            date: getFutureDate(2),
            time: '07:00 PM',
            price: 1499,
            featured: true,
            image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop',
            tag: 'Selling Fast',
        },
        {
            id: 'ev2',
            title: 'Midnight Synths: A Live Score Concert',
            category: 'Concerts',
            venue: 'CineVerse Prime — Infinity Mall',
            date: getFutureDate(1),
            time: '09:30 PM',
            price: 899,
            featured: true,
            image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop',
            tag: 'New',
        },
        {
            id: 'ev3',
            title: 'Meet the Cast: Legacy of Shadows',
            category: 'Meet & Greet',
            venue: 'CineVerse IMAX — Phoenix Mall',
            date: getFutureDate(5),
            time: '05:00 PM',
            price: 2499,
            featured: true,
            image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
            tag: 'Limited Seats',
        },
        {
            id: 'ev4',
            title: 'Ghibli Night: Spirited Away + Live Art',
            category: 'Anime Nights',
            venue: 'CineVerse Lite — R City',
            date: getFutureDate(3),
            time: '08:00 PM',
            price: 549,
            image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
        },
        {
            id: 'ev5',
            title: 'Retro Arcade Night — Free Play Marathon',
            category: 'Gaming',
            venue: 'CineVerse Prime — Infinity Mall',
            date: getFutureDate(4),
            time: '06:00 PM',
            price: 399,
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
        },
        {
            id: 'ev6',
            title: 'Score & Screen: Symphony Plays Interstellar',
            category: 'Concerts',
            venue: 'CineVerse IMAX — Phoenix Mall',
            date: getFutureDate(6),
            time: '07:30 PM',
            price: 1199,
            image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200&auto=format&fit=crop',
        },
        {
            id: 'ev7',
            title: 'Cosplay & Cinema: Anime Costume Contest',
            category: 'Anime Nights',
            venue: 'CineVerse Lite — R City',
            date: getFutureDate(7),
            time: '04:30 PM',
            price: 299,
            image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
        },
        {
            id: 'ev8',
            title: "Director's Cut: Q&A with Legacy of Shadows Crew",
            category: 'Meet & Greet',
            venue: 'CineVerse Prime — Infinity Mall',
            date: getFutureDate(8),
            time: '06:15 PM',
            price: 1799,
            image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
        },
    ];
};

const EVENTS = generateEvents();

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function Events({ events = EVENTS, onSelectEvent }) {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');
    const [query, setQuery] = useState('');

    const featured = useMemo(() => events.filter((e) => e.featured), [events]);

    const filtered = useMemo(() => {
        return events.filter((e) => {
            const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
            const matchesQuery = e.title.toLowerCase().includes(query.trim().toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [events, activeCategory, query]);

    return (
        <div className="ev-page">
            <Navbar />
            <style>{EVENTS_CSS}</style>
            <EventsHero query={query} onQueryChange={setQuery} />

            {!query && featured.length > 0 && (
                <FeaturedRow events={featured} onSelectEvent={onSelectEvent} />
            )}

            <CategoryBar
                categories={CATEGORIES}
                active={activeCategory}
                onSelect={setActiveCategory}
            />

            <main className="ev-main">
                {filtered.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="ev-grid">
                        {filtered.map((ev) => (
                            <EventCard 
                                key={ev.id} 
                                event={ev} 
                                onSelect={() => onSelectEvent && onSelectEvent(ev)} 
                                onBook={() => navigate('/book', { state: { movie: { ...ev, poster_path: ev.image, release_date: ev.date, isEvent: true } } })}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

/* ---------------- HERO ---------------- */
function EventsHero({ query, onQueryChange }) {
    return (
        <section className="ev-hero">
            <div className="ev-hero-overlay" />
            <div className="ev-hero-text">
                <div className="ev-hero-eyebrow">Beyond The Screen</div>
                <h1>
                    Live Events.<br />
                    <span>Unforgettable Nights.</span>
                </h1>
                <p>Premieres, concerts, meet-and-greets, and more — all happening near you.</p>
                <div className="ev-hero-search">
                    <IconSearch />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                    />
                </div>
            </div>
        </section>
    );
}

/* ---------------- FEATURED ROW ---------------- */
function FeaturedRow({ events, onSelectEvent }) {
    return (
        <section className="ev-featured-section">
            <div className="ev-section-head">
                <h2>Featured</h2>
            </div>
            <div className="ev-featured-row">
                {events.map((ev) => (
                    <div
                        key={ev.id}
                        className="ev-featured-card"
                        style={{ backgroundImage: `url(${ev.image})` }}
                        onClick={() => onSelectEvent && onSelectEvent(ev)}
                    >
                        <div className="ev-featured-overlay" />
                        {ev.tag && <span className="ev-featured-tag">{ev.tag}</span>}
                        <div className="ev-featured-content">
                            <span className="ev-featured-category">{ev.category}</span>
                            <h3>{ev.title}</h3>
                            <div className="ev-featured-meta">
                                <span><IconCalendar /> {formatDate(ev.date)}</span>
                                <span><IconClock /> {ev.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ---------------- CATEGORY BAR ---------------- */
function CategoryBar({ categories, active, onSelect }) {
    return (
        <div className="ev-category-bar">
            <div className="ev-category-row">
                {categories.map((c) => (
                    <button
                        key={c}
                        className={`ev-category-chip ${active === c ? 'active' : ''}`}
                        onClick={() => onSelect(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ---------------- EVENT CARD ---------------- */
function EventCard({ event, onSelect, onBook }) {
    return (
        <div className="ev-card" onClick={onSelect}>
            <div className="ev-card-image" style={{ backgroundImage: `url(${event.image})` }}>
                <span className="ev-card-category">{event.category}</span>
                {event.tag && <span className="ev-card-tag">{event.tag}</span>}
            </div>
            <div className="ev-card-body">
                <h3>{event.title}</h3>
                <div className="ev-card-meta">
                    <span><IconCalendar /> {formatDate(event.date)}</span>
                    <span><IconClock /> {event.time}</span>
                </div>
                <div className="ev-card-meta ev-card-venue">
                    <span><IconPin /> {event.venue}</span>
                </div>
                <div className="ev-card-footer">
                    <div className="ev-card-price">
                        <span>From</span>
                        <strong>₹{event.price}</strong>
                    </div>
                    <button className="ev-book-btn" onClick={(e) => { e.stopPropagation(); onBook(); }}>Book Now <span>→</span></button>
                </div>
            </div>
        </div>
    );
}

/* ---------------- EMPTY STATE ---------------- */
function EmptyState() {
    return (
        <div className="ev-empty">
            <div className="ev-empty-icon"><IconCalendarEmpty /></div>
            <h2>No events found</h2>
            <p>Try a different category or search term.</p>
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function IconCalendar() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconClock() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconPin() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function IconCalendarEmpty() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }

/* ---------------- EMBEDDED STYLES ---------------- */
const EVENTS_CSS = `
/* ==========================================================
   CineVerse — Events
   Same dark-glass token family as mv-*/bn-*/mb-*.
   ========================================================== */

.ev-page {
    --ev-bg: #0b0b12;
    --ev-glass: rgba(255, 255, 255, 0.06);
    --ev-glass-border: rgba(255, 255, 255, 0.12);
    --ev-glass-hover: rgba(255, 255, 255, 0.1);
    --ev-text: #f4f3f7;
    --ev-text-dim: #a9a6b8;
    --ev-accent: #e63950;
    --ev-accent-2: #f2b544;

    background: radial-gradient(circle at 80% 0%, #1c1524 0%, var(--ev-bg) 45%);
    color: var(--ev-text);
    min-height: 100vh;
    font-family: 'Inter', 'Segoe UI', sans-serif;
}

/* ---------------- HERO ---------------- */
.ev-hero {
    position: relative;
    padding: 72px 40px 56px;
    background:
        linear-gradient(180deg, rgba(11,11,18,0.2) 0%, var(--ev-bg) 100%),
        url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop');
    background-size: cover;
    background-position: center 30%;
    overflow: hidden;
}
.ev-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(11,11,18,0.92) 25%, rgba(11,11,18,0.55) 70%, rgba(11,11,18,0.3) 100%);
}
.ev-hero-text { position: relative; z-index: 1; max-width: 560px; }
.ev-hero-eyebrow {
    font-size: 12.5px; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--ev-accent-2); font-weight: 600; margin-bottom: 12px;
}
.ev-hero-text h1 { font-size: 38px; line-height: 1.15; font-weight: 800; margin: 0 0 12px; }
.ev-hero-text h1 span {
    background: linear-gradient(90deg, var(--ev-accent), var(--ev-accent-2));
    -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ev-hero-text p { color: var(--ev-text-dim); font-size: 15px; margin: 0 0 24px; }

.ev-hero-search {
    display: flex; align-items: center; gap: 10px;
    background: var(--ev-glass);
    border: 1px solid var(--ev-glass-border);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: 999px;
    padding: 12px 20px;
    max-width: 380px;
    color: var(--ev-text-dim);
    transition: border-color 0.2s ease;
}
.ev-hero-search:focus-within { border-color: var(--ev-accent-2); }
.ev-hero-search input {
    background: transparent; border: none; outline: none;
    color: var(--ev-text); font-size: 14px; width: 100%;
}
.ev-hero-search input::placeholder { color: var(--ev-text-dim); }

/* ---------------- FEATURED ROW ---------------- */
.ev-featured-section { padding: 8px 40px 12px; }
.ev-section-head { margin-bottom: 16px; }
.ev-section-head h2 { font-size: 20px; font-weight: 700; margin: 0; }

.ev-featured-row {
    display: flex; gap: 20px; overflow-x: auto; padding-bottom: 8px;
    scrollbar-width: none;
}
.ev-featured-row::-webkit-scrollbar { display: none; }

.ev-featured-card {
    position: relative;
    flex-shrink: 0;
    width: 340px; height: 200px;
    border-radius: var(--ev-radius, 18px);
    background-size: cover;
    background-position: center;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--ev-glass-border);
    transition: transform 0.25s ease;
}
.ev-featured-card:hover { transform: translateY(-4px); }
.ev-featured-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(0deg, rgba(11,11,18,0.92) 10%, rgba(11,11,18,0.15) 65%);
}
.ev-featured-tag {
    position: absolute; top: 12px; right: 12px; z-index: 1;
    background: rgba(230, 57, 80, 0.9);
    backdrop-filter: blur(6px);
    color: #fff; font-size: 10.5px; font-weight: 700;
    padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.3px;
}
.ev-featured-content {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
    padding: 16px;
}
.ev-featured-category {
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
    color: var(--ev-accent-2); margin-bottom: 6px; display: block;
}
.ev-featured-content h3 {
    font-size: 16px; font-weight: 700; margin: 0 0 8px; line-height: 1.3;
}
.ev-featured-meta { display: flex; gap: 14px; font-size: 12px; color: var(--ev-text-dim); }
.ev-featured-meta span { display: flex; align-items: center; gap: 5px; }

/* ---------------- CATEGORY BAR ---------------- */
.ev-category-bar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: rgba(11, 11, 18, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--ev-glass-border);
    padding: 14px 40px;
    margin-top: 16px;
}
.ev-category-row { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
.ev-category-row::-webkit-scrollbar { display: none; }
.ev-category-chip {
    flex-shrink: 0;
    background: var(--ev-glass);
    border: 1px solid var(--ev-glass-border);
    color: var(--ev-text-dim);
    padding: 8px 18px;
    border-radius: 999px;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}
.ev-category-chip:hover { background: var(--ev-glass-hover); color: var(--ev-text); }
.ev-category-chip.active {
    background: linear-gradient(135deg, var(--ev-accent), #b81f36);
    border-color: transparent;
    color: #fff;
}

/* ---------------- MAIN GRID ---------------- */
.ev-main { padding: 28px 40px 64px; }

.ev-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
}

.ev-card {
    background: var(--ev-glass);
    border: 1px solid var(--ev-glass-border);
    border-radius: 20px;
    overflow: hidden;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.ev-card:hover {
    transform: translateY(-6px);
    border-color: rgba(230, 57, 80, 0.4);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.ev-card-image {
    position: relative;
    height: 160px;
    background-size: cover;
    background-position: center;
    background-color: #1c1824;
}
.ev-card-category {
    position: absolute; top: 12px; left: 12px;
    background: rgba(11, 11, 18, 0.75);
    backdrop-filter: blur(6px);
    border: 1px solid var(--ev-glass-border);
    color: var(--ev-accent-2);
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    padding: 4px 10px; border-radius: 999px;
}
.ev-card-tag {
    position: absolute; top: 12px; right: 12px;
    background: rgba(230, 57, 80, 0.9);
    color: #fff; font-size: 10px; font-weight: 700;
    padding: 4px 9px; border-radius: 999px; text-transform: uppercase;
}

.ev-card-body { padding: 16px 18px 18px; }
.ev-card-body h3 {
    font-size: 15px; font-weight: 700; margin: 0 0 10px; line-height: 1.35;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.ev-card-meta {
    display: flex; gap: 14px; font-size: 12px; color: var(--ev-text-dim); margin-bottom: 6px;
}
.ev-card-meta span { display: flex; align-items: center; gap: 5px; }
.ev-card-venue {
    margin-bottom: 14px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ev-card-venue span { min-width: 0; }

.ev-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--ev-glass-border);
}
.ev-card-price { display: flex; flex-direction: column; }
.ev-card-price span { font-size: 10.5px; color: var(--ev-text-dim); }
.ev-card-price strong { font-size: 16px; font-weight: 800; color: var(--ev-accent-2); }

.ev-book-btn {
    background: linear-gradient(135deg, var(--ev-accent), #b81f36);
    color: #fff; border: none;
    padding: 9px 18px;
    border-radius: 999px;
    font-size: 12.5px; font-weight: 700;
    display: flex; align-items: center; gap: 6px;
    cursor: pointer;
    transition: transform 0.2s ease;
}
.ev-book-btn:hover { transform: translateX(2px); }

/* ---------------- EMPTY STATE ---------------- */
.ev-empty {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    gap: 10px;
    padding: 90px 20px;
    color: var(--ev-text-dim);
}
.ev-empty-icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--ev-glass);
    border: 1px solid var(--ev-glass-border);
    display: flex; align-items: center; justify-content: center;
    color: var(--ev-accent-2);
    margin-bottom: 6px;
}
.ev-empty h2 { font-size: 17px; color: var(--ev-text); margin: 0; }
.ev-empty p { font-size: 13.5px; margin: 0; }

/* ---------------- RESPONSIVE ---------------- */
@media (max-width: 900px) {
    .ev-hero, .ev-featured-section, .ev-category-bar, .ev-main { padding-left: 20px; padding-right: 20px; }
    .ev-hero { padding-top: 56px; padding-bottom: 40px; }
    .ev-hero-text h1 { font-size: 28px; }
    .ev-featured-card { width: 280px; height: 170px; }
    .ev-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
}

@media (prefers-reduced-motion: reduce) {
    .ev-card, .ev-featured-card, .ev-book-btn { transition: none; }
}
`;