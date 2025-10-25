# Vercel Deployment Fix for Google SSO Authentication

## Issues Identified

1. **Missing NEXTAUTH_URL** - Critical for Vercel deployments
2. **MongoDB Connection Issues** - Local MongoDB won't work on Vercel
3. **Environment Variable Configuration** - Need proper Vercel environment setup

## Step-by-Step Fix

### 1. Set Up MongoDB Atlas (Required for Vercel)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string (it will look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/image_qa_rewards?retryWrites=true&w=majority
   ```

### 2. Configure Vercel Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

```env
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/image_qa_rewards?retryWrites=true&w=majority

# NextAuth (CRITICAL for Vercel)
NEXTAUTH_URL=https://manage-artificates.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here-minimum-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional (if you're using these)
WEBHOOK_SECRET=your-webhook-secret
PII_ENC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
N8N_WORKFLOW_URL=https://your-n8n-workflow-url
N8N_API_KEY=your-n8n-api-key
```

### 3. Update Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add these authorized redirect URIs:
   ```
   https://manage-artificates.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

### 4. Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### 5. Test the Fix

1. Redeploy your Vercel app after setting environment variables
2. Try signing in with Google
3. Check Vercel function logs for any errors

## Code Changes Made

I've updated your `src/app/api/auth/[...nextauth]/route.ts` to:

- Handle MongoDB connection failures gracefully
- Not fail authentication if database is temporarily unavailable
- Add debug logging for development

## Common Issues & Solutions

### Issue: "AccessDenied" Error

- **Cause**: Missing or incorrect NEXTAUTH_URL
- **Solution**: Set NEXTAUTH_URL=https://manage-artificates.vercel.app in Vercel

### Issue: "Database connection failed"

- **Cause**: Using local MongoDB URI on Vercel
- **Solution**: Use MongoDB Atlas connection string

### Issue: "Invalid redirect URI"

- **Cause**: Google OAuth not configured for Vercel domain
- **Solution**: Add Vercel domain to Google OAuth redirect URIs

### Issue: "NEXTAUTH_SECRET not set"

- **Cause**: Missing NEXTAUTH_SECRET environment variable
- **Solution**: Generate and set a secure secret in Vercel

## Verification Steps

1. Check Vercel function logs for errors
2. Verify all environment variables are set correctly
3. Test Google OAuth flow end-to-end
4. Ensure MongoDB Atlas is accessible from Vercel

## Need Help?

If you're still having issues after following these steps:

1. Check Vercel function logs
2. Verify MongoDB Atlas network access settings
3. Ensure Google OAuth is properly configured
4. Test with a simple NextAuth setup first
