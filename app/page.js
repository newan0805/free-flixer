import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import ContentSection from '../components/ContentSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Trending Now */}
          <ContentSection 
            title="Trending Now" 
            category="trending" 
            type="movie" 
            limit={10}
          />
          
          {/* Popular Movies */}
          <ContentSection 
            title="Popular Movies" 
            category="popular" 
            type="movie" 
            limit={12}
          />
          
          {/* Top Rated Movies */}
          <ContentSection 
            title="Top Rated Movies" 
            category="top_rated" 
            type="movie" 
            limit={12}
          />
          
          {/* Popular TV Shows */}
          <ContentSection 
            title="Popular TV Shows" 
            category="popular" 
            type="tv" 
            limit={12}
          />
          
          {/* Upcoming Movies */}
          <ContentSection 
            title="Upcoming Movies" 
            category="upcoming" 
            type="movie" 
            limit={12}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <p className="mt-2">
            © 2024 Free Flixer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}