# Image QA Rewards - Setup Guide

This is a Next.js application with MongoDB and Docker setup for the Image QA Rewards system.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Google OAuth credentials

## Quick Start with Docker

1. **Clone and setup environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env.local
   ```

2. **Update environment variables in `.env.local`:**
   ```env
   # Database
   MONGODB_URI=mongodb://admin:password123@localhost:27017/image_qa_rewards?authSource=admin

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-change-in-production

   # Google OAuth (Get these from Google Cloud Console)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Webhook Security
   WEBHOOK_SECRET=your-webhook-secret-change-in-production

   # PII Encryption (32 bytes hex key)
   PII_ENC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

   # n8n Integration (Optional for testing)
   N8N_WORKFLOW_URL=https://your-n8n-workflow-url
   N8N_API_KEY=your-n8n-api-key
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Open http://localhost:3000 in your browser
   - Sign in with Google OAuth

## Local Development (without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start MongoDB locally:**
   ```bash
   # Using Docker for MongoDB only
   docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7.0
   ```

3. **Update environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your values
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to your `.env.local`

## Features

### ✅ Implemented
- **Authentication**: Google OAuth with NextAuth.js
- **Database**: MongoDB with Mongoose ODM
- **Image Q&A Submission**: Upload images, ask questions, provide answers
- **Points System**: Earn points for accepted submissions
- **Wallet Management**: View balance and transaction history
- **Redemption System**: Convert points to cash via bank transfer or UPI
- **Bank Details**: Secure storage of bank account and UPI information
- **Webhook Integration**: Ready for n8n workflow integration
- **Responsive UI**: Modern interface with shadcn/ui components

### 🔄 API Endpoints

- `POST /api/submissions` - Submit new image Q&A
- `GET /api/submissions?mine=1` - Get user's submissions
- `POST /api/n8n/submission-status` - Webhook for n8n status updates
- `GET /api/wallet/me` - Get wallet balance and transactions
- `POST /api/redemptions` - Create redemption request
- `GET /api/redemptions` - Get user's redemption history
- `GET /api/bank` - Get bank details
- `PUT /api/bank` - Update bank details

### 🔒 Security Features

- **PII Encryption**: Bank account numbers encrypted at rest
- **Webhook Verification**: HMAC signature verification
- **Input Validation**: Zod schemas for all inputs
- **Authentication**: Protected routes with NextAuth.js
- **Data Isolation**: Users can only access their own data

## Testing the Application

1. **Sign in** with Google OAuth
2. **Submit an image Q&A**:
   - Paste an image URL
   - Ask a specific question about the image
   - Provide your answer
3. **View submissions** in the table (status will be PENDING)
4. **Add bank details** for redemptions
5. **Test wallet functionality** (points will be 0 until submissions are accepted)

## n8n Integration

The application is ready for n8n workflow integration:

1. **Outbound**: When a submission is created, it calls your n8n workflow URL
2. **Inbound**: n8n can call `/api/n8n/submission-status` to update submission status

### Webhook Payload (to n8n):
```json
{
  "submissionId": "submission_id",
  "artifactUrl": "image_url",
  "question": "user_question",
  "answer": "user_answer",
  "userId": "user_id",
  "expertise": "user_expertise"
}
```

### Webhook Response (from n8n):
```json
{
  "submissionId": "submission_id",
  "status": "ACCEPTED",
  "pointsAwarded": 5,
  "notes": "Review notes",
  "n8nRunId": "run_id"
}
```

## Production Deployment

1. **Update environment variables** for production
2. **Use a production MongoDB instance** (MongoDB Atlas recommended)
3. **Set up proper SSL certificates**
4. **Update Google OAuth redirect URIs**
5. **Use Docker Compose with production settings**

## Troubleshooting

### Common Issues

1. **MongoDB connection failed**: Check if MongoDB container is running
2. **Google OAuth error**: Verify Client ID and Secret in `.env.local`
3. **Webhook signature verification failed**: Check `WEBHOOK_SECRET` matches n8n configuration

### Logs

```bash
# View application logs
docker-compose logs app

# View MongoDB logs
docker-compose logs mongodb
```

## Development Notes

- The application uses MongoDB with Mongoose for data persistence
- All sensitive data (bank account numbers) is encrypted using AES-256-GCM
- The UI is built with shadcn/ui components and Tailwind CSS
- State management is handled with TanStack Query (React Query)
- Authentication is managed by NextAuth.js with Google OAuth provider
