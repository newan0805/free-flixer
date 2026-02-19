'use client';

import { useState, useEffect, use } from 'react';
import { tmdbService } from '@controllers/tmdb';
import VideoPlayer from '@components/VideoPlayer';
import MovieCard from '@components/MovieCard';

const TVDetailsPage = ({ params }) => {
  const unwrappedParams = use(params);
  const [tvShow, setTVShow] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);

  useEffect(() => {
    fetchTVShowDetails();
  }, [unwrappedParams.id]);

  const fetchTVShowDetails = async () => {
    try {
      setIsLoading(true);
      const [tvData, creditsData, recommendationsData] = await Promise.all([
        tmdbService.getTVDetails(unwrappedParams.id),
        tmdbService.getCredits(unwrappedParams.id, 'tv'),
        tmdbService.getRecommendations(unwrappedParams.id, 'tv')
      ]);

      setTVShow(tvData);
      setCredits(creditsData);
      setRecommendations(recommendationsData.results || []);
      
      // Set default episode for season 1
      if (tvData.seasons && tvData.seasons.length > 0) {
        const season1 = tvData.seasons.find(s => s.season_number === 1);
        if (season1 && season1.episode_count > 0) {
          setSelectedEpisode(1);
        }
      }
    } catch (error) {
      console.error('Error fetching TV show details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeasonChange = (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    // Reset to first episode of selected season
    setSelectedEpisode(1);
  };

  const handleEpisodeChange = (episodeNumber) => {
    setSelectedEpisode(episodeNumber);
  };

  const handlePlayNow = () => {
    setIsVideoPlayerOpen(true);
  };

  if (isLoading || !tvShow) {
    return (
      <div className="min-h-screen bg-black">
        {/* <Navigation /> */}
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const backdropUrl = tvShow.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${tvShow.backdrop_path}`
    : null;

  const posterUrl = tvShow.poster_path 
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : null;

  const creator = tvShow.created_by && tvShow.created_by.length > 0 ? tvShow.created_by[0] : null;
  const writers = credits.crew.filter(member => member.department === 'Writing').slice(0, 3);
  const topCast = credits.cast.slice(0, 6);

  const genres = tvShow.genres ? tvShow.genres.map(g => g.name).join(', ') : '';
  const seasons = tvShow.number_of_seasons;
  const episodes = tvShow.number_of_episodes;
  const firstAirDate = tvShow.first_air_date ? tvShow.first_air_date.split('-')[0] : '';
  const lastAirDate = tvShow.last_air_date ? tvShow.last_air_date.split('-')[0] : '';

  return (
    <div className="min-h-scr een bg-black">
      {/* <Navigation />show  */}
      
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[60vh]">
          {backdropUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={backdropUrl}
                alt={tvShow.name}
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
                    alt={tvShow.name}
                    className="w-full rounded-lg shadow-2xl"
                  />
                )}
              </div>

              {/* Details */}
              <div className="lg:w-2/3 text-white">
                <div className="mb-6">
                  <h1 className="text-4xl lg:text-6xl font-bold mb-2">{tvShow.name}</h1>
                  <div className="flex flex-wrap gap-4 text-gray-300 mb-4">
                    <span>{firstAirDate} - {lastAirDate}</span>
                    {seasons && <span>{seasons} Seasons</span>}
                    {episodes && <span>{episodes} Episodes</span>}
                    {genres && <span>{genres}</span>}
                    <span className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {tvShow.vote_average}/10
                    </span>
                  </div>
                  
                  <p className="text-lg text-gray-300 mb-6">{tvShow.tagline}</p>
                  
                  <p className="text-gray-300 leading-relaxed">{tvShow.overview}</p>
                </div>

                {/* Season/Episode Selection */}
                <div className="mb-6 p-6 bg-gray-900 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-white">Select Episode</h3>
                  
                  {/* Season Selection */}
                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Season</label>
                    <div className="flex flex-wrap gap-2">
                      {tvShow.seasons && tvShow.seasons
                        .filter(season => season.season_number > 0) // Filter out season 0 (specials)
                        .sort((a, b) => a.season_number - b.season_number)
                        .map((season) => (
                          <button
                            key={season.id}
                            onClick={() => handleSeasonChange(season.season_number)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              selectedSeason === season.season_number
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Season {season.season_number}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Episode Selection */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Episode</label>
                    <div className="flex flex-wrap gap-2">
                      {tvShow.seasons && (() => {
                        const currentSeason = tvShow.seasons.find(s => s.season_number === selectedSeason);
                        if (currentSeason && currentSeason.episode_count > 0) {
                          return Array.from({ length: currentSeason.episode_count }, (_, i) => i + 1).map((episodeNum) => (
                            <button
                              key={episodeNum}
                              onClick={() => handleEpisodeChange(episodeNum)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedEpisode === episodeNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Episode {episodeNum}
                            </button>
                          ));
                        }
                        return <p className="text-gray-400">No episodes available</p>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="netflix-button flex items-center gap-2 text-lg"
                    onClick={handlePlayNow}
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
                {creator && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creator</span>
                    <span className="text-white">{creator.name}</span>
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
                    onClick={(item) => window.location.href = `/tv/${item.id}`}
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
          title={tvShow.name}
          onClose={() => setIsVideoPlayerOpen(false)}
          type="tv"
          tmdbId={tvShow.id}
          season={selectedSeason}
          episode={selectedEpisode}
        />
      )}
    </div>
  );
};

export default TVDetailsPage;
