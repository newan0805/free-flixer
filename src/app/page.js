import Link from "next/link";
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
          <section className="mb-12 px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-amber-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(135deg,_rgba(7,15,43,0.95),_rgba(5,9,21,0.98))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(96,165,250,0.2),_transparent_70%)] lg:block" />
              <div className="relative max-w-3xl">
                <span className="mb-4 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                  Newest Feature
                </span>
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  Free Book Library with local saves and resume reading
                </h2>
                <p className="mb-6 max-w-2xl text-base text-slate-300 md:text-lg">
                  Search public-domain books from Project Gutenberg, build a personal library in local storage, and jump back into your current book from the page marker you saved last.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/booklibrary"
                    className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-amber-300"
                  >
                    Open Book Library
                  </Link>
                  <Link
                    href="/booklibrary"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Continue Reading
                  </Link>
                </div>
              </div>
            </div>
          </section>

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
