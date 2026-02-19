'use client';

import { useState, useEffect } from 'react';
import { tmdbService } from '../controllers/tmdb';

const Hero = () => {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        setIsLoading(true);
        const response = await tmdbService.getTrending('day');
        if (response.results && response.results.length > 0) {
          // Get a random movie from trending
          const randomIndex = Math.floor(Math.random() * response.results.length);
          const movie = response.results[randomIndex];
          
          // Fetch detailed info for the featured movie
          const details = await tmdbService.getMovieDetails(movie.id);
          setFeaturedMovie(details || movie);
        }
      } catch (error) {
        console.error('Error fetching featured movie:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedMovie();
  }, []);

  if (isLoading || !featuredMovie) {
    return (
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading featured content...</p>
        </div>
      </section>
    );
  }

  const backdropUrl = featuredMovie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
    : null;

  const title = featuredMovie.title || featuredMovie.name || featuredMovie.original_title || featuredMovie.original_name;
  const overview = featuredMovie.overview || '';
  const releaseDate = featuredMovie.release_date || featuredMovie.first_air_date;
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const rating = featuredMovie.vote_average ? Math.round(featuredMovie.vote_average * 10) / 10 : null;
  const genres = featuredMovie.genres ? featuredMovie.genres.map(g => g.name).join(', ') : '';

  return (
    <section className="relative h-screen flex items-center justify-center">
      {/* Background Image */}
      {backdropUrl ? (
        <div className="absolute inset-0 z-0">
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-black to-black"></div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-shadow-lg">
            {title}
          </h1>
          
          <div className="flex flex-wrap justify-center gap-4 text-lg text-gray-300 mb-6">
            {year && <span>{year}</span>}
            {rating && (
              <span className="flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating}/10
              </span>
            )}
            {genres && <span>{genres}</span>}
          </div>

          <p className="text-lg md:text-xl text-gray-300 mb-8 line-clamp-3 max-w-2xl mx-auto">
            {overview}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="netflix-button flex items-center justify-center gap-2 text-lg">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play Now
          </button>
          
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to My List
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;