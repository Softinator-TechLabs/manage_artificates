import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Wallet from '@/models/Wallet';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    console.log('=== N8N WEBHOOK CALLED ===');

    const body = await req.json();
    console.log('Webhook payload:', body);

    const {
      submissionId,
      status,
      pointsAwarded,
      notes,
      workflowId,
      runId,
      artifactUrl,
    } = body;

    if (!submissionId) {
      console.error('No submissionId in webhook payload');
      return NextResponse.json(
        { error: 'submissionId required' },
        { status: 400 },
      );
    }

    await connectDB();

    // Find the submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      console.error('Submission not found:', submissionId);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 },
      );
    }

    console.log('Found submission:', submission._id);

    // Update submission with final results
    const updateData: any = {
      status: status || 'PROCESSING',
      reviewerNotes: notes,
    };

    if (workflowId) updateData.n8nWorkflowId = workflowId;
    if (runId) updateData.n8nRunId = runId;
    if (artifactUrl) updateData.artifactUrl = artifactUrl;
    if (pointsAwarded !== undefined) updateData.pointsAwarded = pointsAwarded;

    await Submission.findByIdAndUpdate(submissionId, updateData);
    console.log('Submission updated with final results:', updateData);

    // If points were awarded, update wallet
    if (pointsAwarded && pointsAwarded > 0) {
      const user = await User.findById(submission.userId);
      if (user) {
        await Wallet.findOneAndUpdate(
          { userId: user._id },
          { $inc: { pointsBalance: pointsAwarded } },
          { new: true },
        );
        console.log('Wallet updated with points:', pointsAwarded);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
