# N8N Integration Documentation

## Overview

The application now sends submission data directly to an N8N endpoint for artifact checking instead of uploading images to Google Drive first.

## Environment Variables Required

Add these to your `.env.local` file:

```env
N8N_CHECK_ARTIFACTE=https://your-n8n-instance.com/webhook/check-artifact
N8N_API_KEY=your-api-key-here
```

## Request Format

The application sends a POST request to the N8N endpoint with the following JSON payload:

```json
{
  "submissionId": "507f1f77bcf86cd799439011",
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "question": "What is shown in this image?",
  "answer": "This image shows a red car parked on the street.",
  "englishQuestion": "What is shown in this image?",
  "englishAnswer": "This image shows a red car parked on the street.",
  "userId": "507f1f77bcf86cd799439012",
  "expertise": "Computer Vision"
}
```

## Expected Response Format

The N8N endpoint should respond with:

```json
{
  "status": "ACCEPTED",
  "pointsAwarded": 10,
  "workflowId": "workflow_123",
  "runId": "run_456",
  "notes": "Good quality submission",
  "artifactUrl": "https://processed-image-url.com/image.jpg"
}
```

### Response Fields

- `status`: One of `PENDING`, `PROCESSING`, `ACCEPTED`, `REJECTED`
- `pointsAwarded`: Number of points to award (0 or positive integer)
- `workflowId`: N8N workflow identifier (optional)
- `runId`: N8N run identifier (optional)
- `notes`: Reviewer notes or feedback (optional)
- `artifactUrl`: Processed image URL (optional)

## Database Updates

Based on the N8N response, the application will:

1. Update the submission record with:

   - Status from N8N response
   - Points awarded
   - N8N workflow and run IDs
   - Reviewer notes
   - Processed artifact URL (if provided)

2. Update user wallet if points are awarded:
   - Increment `pointsBalance` by the awarded points

## Error Handling

If the N8N request fails:

- Submission status is set to `REJECTED`
- Reviewer notes indicate the failure reason
- No points are awarded

## Image Data Format

Images are sent as base64-encoded data URLs:

- Format: `data:image/jpeg;base64,<base64-data>`
- Maximum size: 10MB
- Supported formats: JPEG, PNG, WebP

## Testing

To test the integration:

1. Set up your N8N endpoint
2. Add the environment variables
3. Submit a form with an image
4. Check the database for updated submission records
5. Verify wallet balance updates if points are awarded
