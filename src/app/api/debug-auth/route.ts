import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Temporarily allow this in production for debugging
  // if (
  //   process.env.NODE_ENV === 'production' &&
  //   !request.headers.get('x-debug-key')
  // ) {
  //   return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  // }

  const debugInfo = {
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    // Show actual values for debugging (remove after fixing)
    googleClientId: process.env.GOOGLE_CLIENT_ID || 'NOT_SET',
    mongoUri: process.env.MONGODB_URI || 'NOT_SET',
    expectedRedirectUri: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : 'NOT_SET',
  };

  return NextResponse.json(debugInfo, { status: 200 });
}
