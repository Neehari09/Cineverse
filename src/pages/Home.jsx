import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import { getNowPlayingMovies, getTollywoodMovies, getPosterUrl, getBackdropUrl, getMovieVideos, getMovieDetails } from '../api/tmdb';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { showToast } from '../components/Toast';

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [heroMovies, setHeroMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            getNowPlayingMovies(),
            getTollywoodMovies().then(data => data.results || [])
        ])
            .then(([nowPlaying, tollywood]) => {
                // Interleave all for trending row, putting tollywood first
                const mixed = [];
                const maxLength = Math.max(nowPlaying.length, tollywood.length);
                for (let i = 0; i < maxLength; i++) {
                    if (tollywood[i]) mixed.push(tollywood[i]);
                    if (nowPlaying[i]) mixed.push(nowPlaying[i]);
                }
                const uniqueRaw = Array.from(new Map(mixed.map(m => [m.id, m])).values());
                const unique = uniqueRaw.filter(m => {
                    if (!m.release_date) return false;
                    const prefix = m.release_date.substring(0, 7);
                    return prefix === '2026-06' || prefix === '2026-07' || prefix === '2026-08';
                });

                // Pick top 7 with backdrops for the hero carousel from the mixed (Tollywood prioritized) list
                const heroList = unique
                    .filter(m => m.backdrop_path)
                    .slice(0, 7);
                
                setHeroMovies(heroList);
                setMovies(unique);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));

    }, []);


    return (
        <div className="cv-page">
            <Navbar />
            <div className="cv-body">
                <main className="cv-main">
                    <HeroCarousel heroMovies={heroMovies} />
                    <MovieRow title="Trending Now" movies={movies} loading={loading} error={error} />
                    <FeatureGrid />
                </main>
            </div>
            <FeatureStrip />
        </div>
    );
}

/* ---------------- NAVBAR (now shared — see components/Navbar.jsx) ---------------- */

/* ---------------- SIDE RAILS REMOVED ---------------- */

/* ---------------- HERO CAROUSEL (live TMDB) ---------------- */
function HeroCarousel({ heroMovies }) {
    const [current, setCurrent] = useState(0);
    const [trailerLoading, setTrailerLoading] = useState(false);
    const navigate = useNavigate();
    const timerRef = useRef(null);

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrent(prev => (prev + 1) % (heroMovies.length || 1));
        }, 6000);
    };

    useEffect(() => {
        if (heroMovies.length > 0) startTimer();
        return () => clearInterval(timerRef.current);
    }, [heroMovies.length]);

    const goTo = (idx) => {
        setCurrent(idx);
        startTimer();
    };

    const handleBook = () => {
        const movie = heroMovies[current];
        if (movie) navigate(`/movie/${movie.id}`, { state: { movie } });
    };

    const handleTrailer = async () => {
        const movie = heroMovies[current];
        if (!movie) return;
        setTrailerLoading(true);
        try {
            const url = await getMovieVideos(movie.id);
            if (url) {
                window.open(url, '_blank');
            } else {
                // Fallback: search YouTube
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' official trailer')}`, '_blank');
            }
        } catch {
            window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(heroMovies[current]?.title + ' official trailer')}`, '_blank');
        } finally {
            setTrailerLoading(false);
        }
    };

    if (!heroMovies.length) {
        return (
            <section className="cv-hero cv-hero-skeleton">
                <div className="cv-hero-overlay" />
                <div className="cv-hero-text">
                    <div className="cv-skeleton-line" style={{width: 220, height: 14, marginBottom: 20}} />
                    <div className="cv-skeleton-line" style={{width: 380, height: 48, marginBottom: 12}} />
                    <div className="cv-skeleton-line" style={{width: 320, height: 48, marginBottom: 20}} />
                    <div className="cv-skeleton-line" style={{width: 280, height: 15, marginBottom: 8}} />
                    <div className="cv-skeleton-line" style={{width: 240, height: 15, marginBottom: 28}} />
                </div>
            </section>
        );
    }

    const movie = heroMovies[current];
    const backdrop = getBackdropUrl(movie.backdrop_path);

    return (
        <section
            className="cv-hero"
            style={{ backgroundImage: `url(${backdrop})`, backgroundSize: 'cover', backgroundPosition: 'center top', transition: 'background-image 0.8s ease' }}
        >
            <div className="cv-hero-overlay" />
            <div className="cv-hero-text">
                <div className="cv-hero-eyebrow">🎬 Now Playing in Theatres</div>
                <h1>{movie.title}</h1>
                <p>{movie.overview?.slice(0, 160)}{movie.overview?.length > 160 ? '...' : ''}</p>
                <div className="cv-hero-meta">
                    <span className="cv-hero-rating">★ {movie.vote_average?.toFixed(1)}</span>
                    <span className="cv-hero-year">{movie.release_date?.slice(0, 4)}</span>
                    <span className="cv-hero-lang">{movie.original_language?.toUpperCase()}</span>
                </div>
                <div className="cv-hero-ctas">
                    <button className="cv-btn-primary" onClick={handleBook}>
                        <IconPlayTriangle /> Book Tickets
                    </button>
                    <button className="cv-btn-ghost" onClick={handleTrailer} disabled={trailerLoading}>
                        <IconClapper /> {trailerLoading ? 'Loading...' : 'Watch Trailer'}
                    </button>
                </div>
            </div>
            <div className="cv-hero-dots">
                {heroMovies.map((_, i) => (
                    <span
                        key={i}
                        className={i === current ? 'active' : ''}
                        onClick={() => goTo(i)}
                    />
                ))}
            </div>
            <button className="cv-hero-arrow cv-hero-arrow-left" onClick={() => goTo((current - 1 + heroMovies.length) % heroMovies.length)}>‹</button>
            <button className="cv-hero-arrow cv-hero-arrow-right" onClick={() => goTo((current + 1) % heroMovies.length)}>›</button>
        </section>
    );
}

/* ---------------- MOVIE ROW (Used for Trending) ---------------- */
function MovieRow({ title, movies, loading, error }) {
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    const scroll = (direction) => {
        if (scrollRef.current) {
            const amount = 260; // roughly one card width + gap
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth',
            });
        }
    };


    return (
        <section className="cv-trending">
            <div className="cv-section-head">
                <h2>{title}</h2>
            </div>

            {loading && <p className="cv-trending-status">Loading movies...</p>}
            {error && <p className="cv-trending-status">Couldn't load movies: {error}</p>}

            {!loading && !error && (
                <div className="cv-trending-row">
                    <button className="cv-arrow-btn" onClick={() => scroll('left')}>‹</button>
                    <div className="cv-trending-scroll" ref={scrollRef}>
                        {movies.slice(0, 10).map((m) => {
                            return (
                            <div 
                                key={m.id} 
                                className="cv-movie-card"
                                onClick={() => {
                                    const isUpcoming = !m.release_date || new Date(m.release_date) > new Date();
                                    navigate(`/movie/${m.id}`, { state: { movie: m, isUpcoming } });
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    className="cv-poster"
                                    style={{ backgroundImage: `url(${getBackdropUrl(m.backdrop_path) || getPosterUrl(m.poster_path)})`, position: 'relative' }}
                                >

                                    <div className="cv-rating-badge">
                                        ★ {m.vote_average.toFixed(1)} <em>TMDB</em>
                                    </div>
                                </div>
                                <div className="cv-movie-info">
                                    <h3>{m.title}</h3>
                                    <div className="cv-movie-genre">
                                        {m.original_language?.toUpperCase()}
                                    </div>
                                    <div className="cv-movie-meta">
                                        <span><IconClock /> {m.release_date?.slice(0, 4)}</span>
                                        <span><IconGlobe /> {m.original_language?.toUpperCase()}</span>
                                    </div>
                                    {(!m.release_date || new Date(m.release_date) <= new Date()) && (
                                        <button 
                                            className="cv-book-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/movie/${m.id}`, { state: { movie: m } });
                                            }}
                                        >
                                            Book Now <span className="cv-arrow-icon">→</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
                    <button className="cv-arrow-btn" onClick={() => scroll('right')}>›</button>
                </div>
            )}
        </section>
    );
}

/* ---------------- FEATURE GRID ---------------- */
function FeatureGrid() {
    const navigate = useNavigate();
    const cards = [
        { title: 'Now Showing', desc: 'Experience movies in theatres', img: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=400&auto=format&fit=crop', to: '/movies', state: { activeTab: 'now_playing' }, accent: 'rgba(30,30,40,0.9)' },
        { title: 'Coming Soon', desc: 'The most awaited movies', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&auto=format&fit=crop', to: '/movies', state: { activeTab: 'upcoming' }, accent: 'rgba(60,10,20,0.9)' },
        { title: 'IMAX\nExperience', desc: 'Feel the difference in every frame', img: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&auto=format&fit=crop', to: '/events', accent: 'rgba(20,40,50,0.9)' },
    ];
    return (
        <section className="cv-feature-grid">
            {cards.map((c, i) => (
                <div 
                    key={i} 
                    className="cv-feature-card" 
                    style={{ backgroundImage: `url(${c.img})` }}
                    onClick={() => navigate(c.to, { state: c.state })}
                >
                    <div className="cv-feature-overlay" style={{ background: `linear-gradient(to right, ${c.accent} 20%, transparent 100%), linear-gradient(to top, #000 10%, transparent 90%)` }}></div>
                    <div className="cv-feature-content">
                        <h4>{c.title}</h4>
                        <p>{c.desc}</p>
                    </div>
                    <button className="cv-round-arrow">→</button>
                </div>
            ))}
        </section>
    );
}

/* ---------------- FEATURE STRIP ---------------- */
function FeatureStrip() {
    const items = [
        { icon: <IconTicket />, title: 'Easy Booking', desc: 'Quick & hassle-free ticket booking' },
        { icon: <IconShield />, title: 'Secure Payments', desc: '100% safe & secure transactions' },
        { icon: <IconStar />, title: 'Best Offers', desc: 'Exclusive deals & exciting cashback' },
        { icon: <IconHeadset />, title: '24/7 Support', desc: "We're here for you, anytime" },
        { icon: <IconGift />, title: 'CineVerse Rewards', desc: 'Earn points & unlock amazing benefits' },
    ];
    return (
        <section className="cv-strip">
            {items.map((it, i) => (
                <div key={i} className="cv-strip-item">
                    <span className="cv-strip-icon-wrapper">{it.icon}</span>
                    <div>
                        <div className="cv-strip-title">{it.title}</div>
                        <div className="cv-strip-desc">{it.desc}</div>
                    </div>
                </div>
            ))}
        </section>
    );
}

/* ---------------- HIGH FIDELITY ICONS (SVG) ---------------- */
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function IconPin() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function IconChevronDown() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>; }
function IconHome() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" /></svg>; }
function IconFilm() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="8" y1="2" x2="8" y2="22" /><line x1="16" y1="2" x2="16" y2="22" /></svg>; }
function IconCalendar() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconTag() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>; }
function IconBookmark() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>; }
function IconDots() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="5" cy="12" r="2" /></svg>; }
function IconPlayTriangle() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>; }
function IconClapper() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10l16-3 1 5-16 3z" /><rect x="3" y="11" width="18" height="12" rx="1" /></svg>; }
function IconClock() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconGlobe() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>; }
function IconLounge() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h16v6H4z" /><path d="M4 16h16v2H4z" /><path d="M8 6v4" /><path d="M16 6v4" /></svg>; }
function IconImax() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="10" y1="4" x2="10" y2="20" /><line x1="14" y1="4" x2="14" y2="20" /></svg>; }
function IconOffer() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>; }
function IconTicket() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 8v8" /><path d="M2 12h20" /></svg>; }
function IconShield() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>; }
function IconStar() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function IconHeadset() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" /><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></svg>; }
function IconGift() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>; }