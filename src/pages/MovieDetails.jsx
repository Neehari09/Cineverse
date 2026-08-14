import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getPosterUrl, getBackdropUrl } from '../api/tmdb';
import { showToast } from '../components/Toast';
import './MovieDetails.css';

export default function MovieDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const movie = location.state?.movie;
    
    const [isInterested, setIsInterested] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!movie) {
        return (
            <div className="md-page">
                <Navbar />
                <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>Movie not found</div>
            </div>
        );
    }

    const backdrop = getBackdropUrl(movie.backdrop_path);
    const poster = getPosterUrl(movie.poster_path);
    const releaseDate = new Date(movie.release_date);
    const formattedDate = isNaN(releaseDate) ? 'TBA' : releaseDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Combination of Tollywood, Bollywood, Hollywood based on language and standard logic
    const languageMap = {
        'hi': 'Hindi, Bollywood',
        'te': 'Telugu, Tollywood',
        'en': 'English, Hollywood',
        'ta': 'Tamil, Kollywood',
        'ml': 'Malayalam, Mollywood',
        'kn': 'Kannada, Sandalwood'
    };
    const industryInfo = languageMap[movie.original_language] || movie.original_language?.toUpperCase() || 'Multiple Industries';
    
    const tags = ['2D, 3D, IMAX 2D', industryInfo];

    let interestedText = 'Highly anticipated';
    if (movie.vote_count) {
        if (movie.vote_count >= 1000) {
            interestedText = `${(movie.vote_count / 1000).toFixed(1)}K+ are interested`;
        } else {
            interestedText = `${movie.vote_count}+ are interested`;
        }
    }

    const handleInterested = () => {
        setIsInterested(!isInterested);
        if (!isInterested) {
            showToast('You will be notified when tickets are available!', 'success');
        }
    };

    return (
        <div className="md-page">
            <Navbar />
            
            <div className="md-hero-wrapper" style={{ backgroundImage: `url(${backdrop})` }}>
                <div className="md-hero-overlay"></div>
                <div className="md-hero-content">
                    <div className="md-poster-col">
                        <div className="md-poster-container">
                            <img src={poster} alt={movie.title} className="md-poster-img" />
                            <div className="md-poster-bottom-text">Releasing on {formattedDate}</div>
                        </div>
                    </div>
                    <div className="md-info-col">
                        <h1 className="md-title">{movie.title}</h1>
                        
                        <div className="md-rating-box">
                            <div className="md-rating-score">
                                <span className="md-star">👍</span> 
                                {interestedText}
                            </div>
                            <div className="md-rating-cta">
                                <button 
                                    className="md-rate-btn" 
                                    onClick={handleInterested}
                                    style={{ background: isInterested ? '#4caf50' : 'rgba(255, 255, 255, 0.2)' }}
                                >
                                    {isInterested ? 'Interested!' : "I'm interested"}
                                </button>
                            </div>
                        </div>

                        <div className="md-tags-row">
                            <span className="md-tag md-format-tag">{tags[0]}</span>
                            <span className="md-tag md-lang-tag">{tags[1]}</span>
                        </div>

                        <div className="md-meta-row">
                            {movie.runtime ? <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span> : <span>2h 15m</span>}
                            <span className="md-dot">•</span>
                            <span>Action, Drama, Thriller</span>
                            <span className="md-dot">•</span>
                            <span>UA</span>
                            <span className="md-dot">•</span>
                            <span>{formattedDate}</span>
                        </div>

                        {!location.state?.isUpcoming && (
                            <button 
                                className="md-book-ticket-btn"
                                onClick={() => navigate('/book', { state: { movie } })}
                            >
                                Book Tickets
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="md-body">
                <section className="md-about-section">
                    <h2>About the movie</h2>
                    <p>{movie.overview || "An international journey that redefines the standards of excellence. Prepare for a gripping cinematic experience where boundaries are pushed, forcing our characters to confront what truly matters."}</p>
                </section>
            </div>
        </div>
    );
}
