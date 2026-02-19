import { NextResponse } from 'next/server';
import { tmdbService } from '@controllers/tmdb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const data = await tmdbService.search(query, 1);
    
    // Filter and format suggestions with enhanced details
    const suggestions = data.results
      .filter(item => item.poster_path || item.backdrop_path)
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        title: item.title || item.name,
        type: item.media_type,
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w300${item.backdrop_path}` : null,
        overview: item.overview,
        release_date: item.release_date || item.first_air_date,
        vote_average: item.vote_average,
        genre_ids: item.genre_ids || [],
        popularity: item.popularity
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}