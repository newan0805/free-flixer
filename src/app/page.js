import Navigation from "@components/Navigation";
import Hero from "@components/Hero";
import ContentSection from "@components/ContentSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* <Navigation /> */}

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Trending All */}
          <ContentSection
            title="Trending All"
            category="trending"
            type="all"
            limit={10}
          />

          {/* Trending Movies */}
          <ContentSection
            title="Trending Movies"
            category="trending_movies"
            type="movie"
            limit={12}
          />

          {/* Trending TV Shows */}
          <ContentSection
            title="Trending TV Shows"
            category="trending_tv"
            type="tv"
            limit={12}
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

          {/* Now Playing Movies */}
          <ContentSection
            title="Now Playing Movies"
            category="now_playing"
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

          {/* Top Rated TV Shows */}
          <ContentSection
            title="Top Rated TV Shows"
            category="top_rated"
            type="tv"
            limit={12}
          />

          {/* Airing Today TV Shows */}
          <ContentSection
            title="Airing Today TV Shows"
            category="airing_today"
            type="tv"
            limit={12}
          />

          {/* On The Air TV Shows */}
          <ContentSection
            title="On The Air TV Shows"
            category="on_the_air"
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
      <footer className="bg-black bg-opacity-70 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
          <div className="p-4 border-t border-gray-800">
            <p className="text-gray-500 text-sm text-center">
              © {new Date().getFullYear()} Free Flixer
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
