'use client';

import { useState, useEffect, use } from 'react';
import { tmdbService } from '@controllers/tmdb';
import VideoPlayer from '@components/VideoPlayer';
import MovieCard from '@components/MovieCard';

const MovieDetailsPage = ({ params }) => {
  const unwrappedParams = use(params);
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
  }, [unwrappedParams.id]);

  const fetchMovieDetails = async () => {
    try {
      setIsLoading(true);
      const [movieData, creditsData, recommendationsData] = await Promise.all([
        tmdbService.getMovieDetails(unwrappedParams.id),
        tmdbService.getCredits(unwrappedParams.id, 'movie'),
        tmdbService.getRecommendations(unwrappedParams.id, 'movie')
      ]);

      setMovie(movieData);
      setCredits(creditsData);
      setRecommendations(recommendationsData.results || []);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !movie) {
    return (
      <div className="min-h-screen bg-black">
        {/* <Navigation /> */}
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const director = credits.crew.find(member => member.job === 'Director');
  const writers = credits.crew.filter(member => member.department === 'Writing').slice(0, 3);
  const topCast = credits.cast.slice(0, 6);

  const genres = movie.genres ? movie.genres.map(g => g.name).join(', ') : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : '';

  return (
    <div className="min-h-screen bg-black">
      {/* <Navigation /> */}
      
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh]">
          {backdropUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={backdropUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
            </div>
          )}
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Poster */}
              <div className="lg:w-1/3 flex-shrink-0">
                {posterUrl && (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                )}
              </div>

              {/* Details */}
              <div className="lg:w-2/3 text-white">
                <div className="mb-6">
                  <h1 className="text-4xl lg:text-6xl font-bold mb-2">{movie.title}</h1>
                  <div className="flex flex-wrap gap-4 text-gray-300 mb-4">
                    <span>{releaseYear}</span>
                    {runtime && <span>{runtime}</span>}
                    {genres && <span>{genres}</span>}
                    <span className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.vote_average}/10
                    </span>
                  </div>
                  
                  <p className="text-lg text-gray-300 mb-6">{movie.tagline}</p>
                  
                  <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="netflix-button flex items-center gap-2 text-lg"
                    onClick={() => setIsVideoPlayerOpen(true)}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play Now
                  </button>
                  
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to My List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Details Section */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cast */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Top Cast</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {topCast.map((actor) => (
                  <div key={actor.id} className="text-center group">
                    {actor.profile_path ? (
                      <img
                        src={tmdbService.getProfileUrl(actor.profile_path)}
                        alt={actor.name}
                        className="w-full h-40 object-cover rounded-lg mb-2 group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-800 rounded-lg mb-2 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <h4 className="font-medium text-white">{actor.name}</h4>
                    <p className="text-gray-400 text-sm">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Crew */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Crew</h3>
              <div className="space-y-3">
                {director && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Director</span>
                    <span className="text-white">{director.name}</span>
                  </div>
                )}
                {writers.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Writers</span>
                    <span className="text-white">{writers.map(w => w.name).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6">Recommendations</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recommendations.slice(0, 10).map((rec) => (
                  <MovieCard
                    key={rec.id}
                    movie={rec}
                    onClick={(item) => window.location.href = `/movie/${item.id}`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Video Player Modal */}
      {isVideoPlayerOpen && (
        <VideoPlayer
          title={movie.title}
          onClose={() => setIsVideoPlayerOpen(false)}
          type="movie"
          tmdbId={movie.id}
        />
      )}
    </div>
  );
};

export default MovieDetailsPage;
