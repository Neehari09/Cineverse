import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Movies.css';
import {
    getNowPlayingMovies,
    getPopularMovies,
    getTopRatedMovies,
    getUpcomingMovies,
    searchMovies,
    getGenres,
    discoverByGenre,
    getPosterUrl,
    getBackdropUrl,
    getBollywoodMovies,
    getTollywoodMovies,
    getAllMoviesCombined,
} from '../api/tmdb';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { showToast } from '../components/Toast';

const TABS = [
    { key: 'all', label: 'All', fetcher: getAllMoviesCombined },
    { key: 'now_playing', label: 'Now Showing', fetcher: getNowPlayingMovies },
    { key: 'popular', label: 'Popular', fetcher: getPopularMovies },
    { key: 'top_rated', label: 'Top Rated', fetcher: getTopRatedMovies },
    { key: 'upcoming', label: 'Upcoming', fetcher: getUpcomingMovies },
    { key: 'bollywood', label: 'Bollywood', fetcher: getBollywoodMovies },
    { key: 'tollywood', label: 'Tollywood', fetcher: getTollywoodMovies },
];

export default function Movies() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'all');
    const [genres, setGenres] = useState([]);
    const [activeGenre, setActiveGenre] = useState(null);
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');

    // Sync query to URL when it changes
    useEffect(() => {
        if (query) {
            setSearchParams({ q: query });
        } else {
            setSearchParams({});
        }
    }, [query, setSearchParams]);

    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const [heroMovie, setHeroMovie] = useState(null);

    // debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => clearTimeout(t);
    }, [query]);

    // load genre list once
    useEffect(() => {
        getGenres()
            .then((list) => setGenres(list || []))
            .catch(() => setGenres([]));
            

    }, []);

    // pick a hero backdrop from now playing, once
    useEffect(() => {
        getNowPlayingMovies()
            .then((results) => {
                if (results && results.length) {
                    setHeroMovie(results[Math.floor(Math.random() * Math.min(5, results.length))]);
                }
            })
            .catch(() => { });
    }, []);

    const fetchMovies = useCallback(
        (pageToLoad, replace) => {
            const isFirst = pageToLoad === 1;
            isFirst ? setLoading(true) : setLoadingMore(true);
            setError(null);

            let request;
            if (debouncedQuery) {
                request = searchMovies(debouncedQuery, pageToLoad);
            } else if (activeGenre) {
                request = discoverByGenre(activeGenre, pageToLoad);
            } else {
                const tab = TABS.find((t) => t.key === activeTab);
                request = tab.fetcher(pageToLoad);
            }

            request
                .then((data) => {
                    const results = Array.isArray(data) ? data : data.results;
                    
                    // Filter results to only show movies from June, July, August 2026
                    const filteredResults = results.filter(m => {
                        if (!m.release_date) return false;
                        const prefix = m.release_date.substring(0, 7);
                        return prefix === '2026-06' || prefix === '2026-07' || prefix === '2026-08';
                    });

                    const pages = Array.isArray(data) ? 1 : data.total_pages;
                    setMovies((prev) => (replace ? filteredResults : [...prev, ...filteredResults]));
                    setTotalPages(pages || 1);
                    setPage(pageToLoad);
                })
                .catch((err) => setError(err.message))
                .finally(() => {
                    setLoading(false);
                    setLoadingMore(false);
                });
        },
        [activeTab, activeGenre, debouncedQuery]
    );

    // reset & refetch when tab / genre / search changes
    useEffect(() => {
        fetchMovies(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, activeGenre, debouncedQuery]);

    const handleTabClick = (key) => {
        setActiveGenre(null);
        setQuery('');
        setActiveTab(key);
    };

    const handleGenreClick = (id) => {
        setQuery('');
        setActiveGenre((prev) => (prev === id ? null : id));
    };

    const handleLoadMore = () => {
        if (page < totalPages && !loadingMore) fetchMovies(page + 1, false);
    };


    return (
        <div className="mv-page">
            <Navbar searchValue={query} onSearchChange={setQuery} />

            <MoviesHero movie={heroMovie} />

            <FilterBar
                tabs={TABS}
                activeTab={activeTab}
                onTabClick={handleTabClick}
                genres={genres}
                activeGenre={activeGenre}
                onGenreClick={handleGenreClick}
                isSearching={!!debouncedQuery}
                query={debouncedQuery}
            />

            <main className="mv-main">
                {loading && <SkeletonGrid />}

                {!loading && error && (
                    <div className="mv-status mv-status-error">
                        <IconAlert />
                        <p>Couldn't load movies: {error}</p>
                    </div>
                )}

                {!loading && !error && movies.length === 0 && (
                    <div className="mv-status">
                        <IconFilmEmpty />
                        <p>No movies found. Try a different search or filter.</p>
                    </div>
                )}

                {!loading && !error && movies.length > 0 && (
                    <>
                        <div className="mv-grid">
                            {movies.map((m, i) => (
                                <MovieCard 
                                    key={`${m.id}-${i}`} 
                                    movie={m} 
                                    isUpcomingTab={activeTab === 'upcoming'}
                                />
                            ))}
                        </div>

                        {page < totalPages && (
                            <div className="mv-load-more-wrap">
                                <button
                                    className="mv-btn-ghost mv-load-more"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading…' : 'Load More Movies'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}


/* ---------------- HERO ---------------- */
function MoviesHero({ movie }) {
    const backdrop = movie ? getBackdropUrl(movie.backdrop_path) : null;
    return (
        <section
            className="mv-hero"
            style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
        >
            <div className="mv-hero-overlay" />
            <div className="mv-hero-text">
                <div className="mv-hero-eyebrow">All Movies. One Universe.</div>
                <h1>
                    Find Your Next<br />
                    <span>Cinematic Escape</span>
                </h1>
                <p>Browse everything playing, trending, and coming soon — all in one place.</p>
            </div>
        </section>
    );
}

/* ---------------- FILTER BAR ---------------- */
function FilterBar({ tabs, activeTab, onTabClick, genres, activeGenre, onGenreClick, isSearching, query }) {
    const genreScrollRef = useRef(null);

    return (
        <div className="mv-filter-bar">
            {isSearching ? (
                <div className="mv-search-heading">
                    Showing results for <span>&ldquo;{query}&rdquo;</span>
                </div>
            ) : (
                <div className="mv-tabs">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            className={`mv-tab ${activeTab === t.key && !activeGenre ? 'active' : ''}`}
                            onClick={() => onTabClick(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {!isSearching && genres.length > 0 && (
                <div className="mv-genre-row" ref={genreScrollRef}>
                    {genres.map((g) => (
                        <button
                            key={g.id}
                            className={`mv-genre-chip ${activeGenre === g.id ? 'active' : ''}`}
                            onClick={() => onGenreClick(g.id)}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---------------- MOVIE CARD ---------------- */
function MovieCard({ movie, isUpcomingTab }) {
    const navigate = useNavigate();

    const isUpcoming = isUpcomingTab || (!movie.release_date || new Date(movie.release_date) > new Date());

    return (
        <div 
            className="mv-movie-card" 
            onClick={() => navigate(`/movie/${movie.id}`, { state: { movie, isUpcoming } })}
            style={{ cursor: 'pointer' }}
        >
            <div
                className="mv-poster"
                style={{ backgroundImage: `url(${getPosterUrl(movie.poster_path)})`, position: 'relative' }}
            >

                <div className="mv-rating-badge">
                    ★ {movie.vote_average ? movie.vote_average.toFixed(1) : '—'} <em>TMDB</em>
                </div>
            </div>
            <div className="mv-movie-info">
                <h3>{movie.title}</h3>
                <div className="mv-movie-meta">
                    <span><IconClock /> {movie.release_date?.slice(0, 4) || 'TBA'}</span>
                    <span><IconGlobe /> {movie.original_language?.toUpperCase()}</span>
                </div>
                {!isUpcomingTab && (!movie.release_date || new Date(movie.release_date) <= new Date()) && (
                    <button
                        className="mv-book-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/movie/${movie.id}`, { state: { movie } });
                        }}
                    >
                        Book Now <span className="mv-arrow-icon">→</span>
                    </button>
                )}
            </div>
        </div>
    );
}

/* ---------------- SKELETON LOADER ---------------- */
function SkeletonGrid() {
    return (
        <div className="mv-grid">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="mv-movie-card mv-skeleton">
                    <div className="mv-poster mv-skeleton-block" />
                    <div className="mv-movie-info">
                        <div className="mv-skeleton-line mv-skeleton-line-title" />
                        <div className="mv-skeleton-line mv-skeleton-line-meta" />
                        <div className="mv-skeleton-line mv-skeleton-line-btn" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function IconClose() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function IconPin() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function IconChevronDown() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>; }
function IconClock() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconGlobe() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>; }
function IconAlert() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>; }
function IconFilmEmpty() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="8" y1="2" x2="8" y2="22" /><line x1="16" y1="2" x2="16" y2="22" /></svg>; }

