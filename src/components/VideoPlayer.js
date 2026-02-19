
const VideoPlayer = ({ title, onClose, type = 'movie', tmdbId, season = 1, episode = 1 }) => {
  // Generate Vidsrc embed URL
  const getVidsrcUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_VIDSRC_BASE_URL;
    
    if (type === 'movie') {
      return `${baseUrl}/movie/${tmdbId}`;
    } else {
      return `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Video Title */}
      <div className="absolute top-4 left-4 right-4 text-center z-10">
        <h2 className="text-white text-xl sm:text-2xl font-bold">{title}</h2>
        <p className="text-gray-300 text-sm">{type === 'movie' ? 'Movie' : `TV Show • Season ${season} Episode ${episode}`}</p>
      </div>

      {/* Video Container - Responsive iframe */}
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
          src={getVidsrcUrl()}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          title={`${title} Video Player`}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;