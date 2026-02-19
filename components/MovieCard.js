import Image from 'next/image';

const MovieCard = ({ movie, onClick }) => {
  const imageUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-image.jpg';

  const title = movie.title || movie.name || movie.original_title || movie.original_name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const rating = movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null;

  return (
    <div 
      className="movie-card group cursor-pointer"
      onClick={() => onClick && onClick(movie)}
    >
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={imageUrl}
          alt={title}
          width={500}
          height={750}
          className="movie-poster w-full h-64 object-cover transition-all duration-300 group-hover:scale-110"
          priority={false}
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center justify-between text-gray-300 text-sm">
              <span>{year}</span>
              {rating && (
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile title */}
      <div className="md:hidden mt-2">
        <h3 className="text-white font-medium text-sm line-clamp-2">{title}</h3>
        <p className="text-gray-400 text-xs">{year}</p>
      </div>
    </div>
  );
};

export default MovieCard;