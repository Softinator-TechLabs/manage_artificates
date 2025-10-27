import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { submissionSchema } from '@/lib/validation';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Submission from '@/models/Submission';
import Wallet from '@/models/Wallet';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    console.log('=== SUBMISSION API CALLED ===');

    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    if (!session?.user) {
      console.log('No user in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body keys:', Object.keys(body));
    console.log('Has imageData:', !!body.imageData);
    console.log('ImageData length:', body.imageData?.length || 0);

    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      console.log('Validation failed:', parsed.error.issues);
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    console.log('Validation passed');

    await connectDB();

    const { imageData, question, answer, englishQuestion, englishAnswer } =
      parsed.data;

    // Find or create user
    let user = await User.findOne({ email: session.user.email });
    if (!user) {
      user = await User.create({
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
      });
    }

    // Create submission first to get the ObjectId
    const submission = await Submission.create({
      userId: user._id,
      question,
      answer,
      englishQuestion,
      englishAnswer,
      status: 'PENDING',
      // Don't include artifactUrl - it will be added later by N8N webhook
    });

    // Ensure wallet exists
    await Wallet.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, pointsBalance: 0 },
      { upsert: true, new: true },
    );

    // Send to N8N to start workflow (fire and forget)
    if (process.env.N8N_CHECK_ARTIFACTE) {
      // Fire and forget - N8N will call us back later
      fetch(process.env.N8N_CHECK_ARTIFACTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          submissionId: submission._id.toString(),
          imageData, // Base64 encoded image
          question,
          answer,
          englishQuestion,
          englishAnswer,
          userId: user._id.toString(),
          expertise: user.profile?.expertise,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const n8nResult = await response.json();
            console.log('N8N Workflow started:', n8nResult);

            // Update submission with workflow ID (workflow is still running)
            await Submission.findByIdAndUpdate(submission._id, {
              status: 'PROCESSING',
              n8nWorkflowId: n8nResult.workflowId,
              n8nRunId: n8nResult.runId,
            });

            console.log(
              'Submission updated with workflow ID:',
              n8nResult.workflowId,
            );
          } else {
            console.error(
              'Failed to start N8N workflow:',
              await response.text(),
            );
            await Submission.findByIdAndUpdate(submission._id, {
              status: 'REJECTED',
              reviewerNotes: 'Failed to start N8N workflow',
            });
          }
        })
        .catch((error) => {
          console.error('Error starting N8N workflow:', error);
          // Don't update submission status here - let it stay PENDING
        });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const mine = url.searchParams.get('mine') === '1';

    let user;
    if (mine) {
      user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    const where = mine ? { userId: user._id } : {};

    const submissions = await Submission.find(where)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
