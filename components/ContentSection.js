'use client';

import { useState, useEffect } from 'react';
import { tmdbService } from '../controllers/tmdb';
import MovieCard from './MovieCard';

const ContentSection = ({ title, category, type = 'movie', limit = 20 }) => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        let response;

        if (category === 'trending') {
          response = await tmdbService.getTrending('week');
        } else if (type === 'movie') {
          response = await tmdbService.getMovies(category);
        } else {
          response = await tmdbService.getTVShows(category);
        }

        setContent(response.results || []);
      } catch (error) {
        console.error(`Error fetching ${category} content:`, error);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [category, type]);

  const handleCardClick = (item) => {
    // Navigate to details page
    window.location.href = `/${type}/${item.id}`;
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="section-title">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg animate-pulse">
              <div className="w-full h-64 bg-gray-700 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!content.length) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="section-title">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {content.slice(0, limit).map((item) => (
          <MovieCard
            key={item.id}
            movie={item}
            onClick={handleCardClick}
          />
        ))}
      </div>
      
      {content.length > limit && (
        <div className="mt-6 text-center">
          <button className="text-blue-400 hover:text-blue-300 transition-colors">
            View All {title}
          </button>
        </div>
      )}
    </section>
  );
};

export default ContentSection;