import { NextResponse } from 'next/server';
import { getAuthUrl } from '../../../../utils/spotifyAuth';

export async function GET() {
  try {
    const authUrl = await getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
