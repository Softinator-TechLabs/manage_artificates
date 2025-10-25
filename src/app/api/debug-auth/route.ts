import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development or if you need to debug
  if (
    process.env.NODE_ENV === 'production' &&
    !request.headers.get('x-debug-key')
  ) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const debugInfo = {
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    // Don't expose actual values in production
    googleClientId:
      process.env.NODE_ENV === 'development'
        ? process.env.GOOGLE_CLIENT_ID
        : '***hidden***',
    mongoUri:
      process.env.NODE_ENV === 'development'
        ? process.env.MONGODB_URI
        : '***hidden***',
    expectedRedirectUri: process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
      : 'NOT_SET',
  };

  return NextResponse.json(debugInfo, { status: 200 });
}
