import { NextResponse } from 'next/server';
import { handleAuthCallback } from '../../../../utils/spotifyAuth';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code || !state) {
    return NextResponse.redirect(new URL('/music?error=invalid_callback', request.url));
  }
  
  try {
    await handleAuthCallback(code, state);
    return NextResponse.redirect(new URL('/music', request.url));
  } catch (error) {
    console.error('Error handling auth callback:', error);
    return NextResponse.redirect(new URL('/music?error=auth_failed', request.url));
  }
}