import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/validation";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Submission from "@/models/Submission";
import Wallet from "@/models/Wallet";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = submissionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues 
      }, { status: 400 });
    }

    await connectDB();

    const { artifactUrl, question, answer } = parsed.data;

    // Find or create user
    let user = await User.findOne({ email: session.user.email });
    if (!user) {
      user = await User.create({
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
      });
    }

    // Create submission
    const submission = await Submission.create({
      userId: user._id,
      artifactUrl,
      question,
      answer,
      status: "PENDING",
    });

    // Ensure wallet exists
    await Wallet.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, pointsBalance: 0 },
      { upsert: true, new: true }
    );

    // Fire and forget n8n call
    if (process.env.N8N_WORKFLOW_URL) {
      fetch(process.env.N8N_WORKFLOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.N8N_API_KEY || "",
        },
        body: JSON.stringify({
          submissionId: submission._id.toString(),
          artifactUrl,
          question,
          answer,
          userId: user._id.toString(),
          expertise: user.profile?.expertise,
        }),
      }).catch((error) => {
        console.error("Failed to call n8n workflow:", error);
      });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "1";
    
    let user;
    if (mine) {
      user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const where = mine ? { userId: user._id } : {};
    
    const submissions = await Submission.find(where)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
