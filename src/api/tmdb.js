const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

export async function getNowPlayingMovies(page = 1) {
    const res = await fetch(
        `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    if (!res.ok) {
        throw new Error('Failed to fetch movies');
    }
    const data = await res.json();
    return data.results;
}

export async function getPopularMovies(page = 1) {
    const res = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    if (!res.ok) {
        throw new Error('Failed to fetch movies');
    }
    const data = await res.json();
    return data.results;
}

export async function getTopRatedMovies(page = 1) {
    const res = await fetch(
        `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    if (!res.ok) {
        throw new Error('Failed to fetch movies');
    }
    const data = await res.json();
    return data.results;
}

export async function getUpcomingMovies(page = 1) {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const threeMonthsDate = threeMonthsLater.toISOString().split('T')[0];

    const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&page=${page}&primary_release_year=2026&primary_release_date.gte=${today}&primary_release_date.lte=${threeMonthsDate}&sort_by=primary_release_date.asc`
    );
    if (!res.ok) {
        throw new Error('Failed to fetch movies');
    }
    const data = await res.json();
    return data.results;
}

export async function getBollywoodMovies(page = 1) {
    const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_original_language=hi&page=${page}&sort_by=popularity.desc`
    );
    if (!res.ok) throw new Error('Failed to fetch movies');
    const data = await res.json();
    return data;
}

export async function getTollywoodMovies(page = 1) {
    const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_original_language=te&page=${page}&sort_by=popularity.desc`
    );
    if (!res.ok) throw new Error('Failed to fetch movies');
    const data = await res.json();
    return data;
}

export async function getAllMoviesCombined(page = 1) {
    const [nowPlaying, bollywood, tollywood] = await Promise.all([
        getNowPlayingMovies(page),
        getBollywoodMovies(page).then(d => d.results || []),
        getTollywoodMovies(page).then(d => d.results || [])
    ]);

    const mixed = [];
    const maxLength = Math.max(nowPlaying.length, bollywood.length, tollywood.length);
    for (let i = 0; i < maxLength; i++) {
        if (nowPlaying[i]) mixed.push(nowPlaying[i]);
        if (bollywood[i]) mixed.push(bollywood[i]);
        if (tollywood[i]) mixed.push(tollywood[i]);
    }
    
    // Remove duplicates
    const unique = Array.from(new Map(mixed.map(m => [m.id, m])).values());
    
    return { results: unique, total_pages: 100 };
}

// Search & discover return { results, total_pages } since Movies.jsx
// needs the page count for its "Load More" button.

export async function searchMovies(query, page = 1) {
    const res = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
            query
        )}&page=${page}&include_adult=false`
    );
    if (!res.ok) {
        throw new Error('Failed to search movies');
    }
    const data = await res.json();
    return { results: data.results, total_pages: data.total_pages };
}

export async function discoverByGenre(genreId, page = 1) {
    const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    if (!res.ok) {
        throw new Error('Failed to fetch movies by genre');
    }
    const data = await res.json();
    return { results: data.results, total_pages: data.total_pages };
}

export async function getGenres() {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    if (!res.ok) {
        throw new Error('Failed to fetch genres');
    }
    const data = await res.json();
    return data.genres; // [{ id, name }, ...]
}

export function getPosterUrl(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Poster';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(backdropPath) {
    return backdropPath ? `${BACKDROP_BASE}${backdropPath}` : null;
}

export async function getMovieVideos(movieId) {
    const res = await fetch(
        `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`
    );
    if (!res.ok) throw new Error('Failed to fetch videos');
    const data = await res.json();
    // Return the first YouTube trailer or teaser
    const trailer = data.results?.find(
        v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

export async function getMovieDetails(movieId) {
    const res = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`
    );
    if (!res.ok) throw new Error('Failed to fetch movie details');
    return await res.json();
}