import { NextRequest, NextResponse } from "next/server";
import { webhookSchema } from "@/lib/validation";
import connectDB from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";
import WebhookEvent from "@/models/WebhookEvent";
import crypto from "crypto";

function verifySignature(raw: string, signature?: string): boolean {
  if (!process.env.WEBHOOK_SECRET) return false;
  if (!signature) return false;
  
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET);
  hmac.update(raw);
  const computedSignature = hmac.digest("hex");
  
  return computedSignature === signature;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-signature");
    
    if (!verifySignature(raw, signature || undefined)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(raw);
    const parsed = webhookSchema.safeParse(data);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid payload", 
        details: parsed.error.issues 
      }, { status: 400 });
    }

    await connectDB();

    const { submissionId, status, pointsAwarded = 0, notes, n8nRunId } = parsed.data;

    // Update submission
    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { 
        status, 
        pointsAwarded, 
        reviewerNotes: notes || null, 
        n8nRunId: n8nRunId || null 
      },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Log webhook event
    await WebhookEvent.create({
      submissionId,
      payload: data,
      source: "n8n",
      signature: signature || undefined,
    });

    // Award points if accepted
    if (status === "ACCEPTED" && pointsAwarded > 0) {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: submission.userId },
        { $inc: { pointsBalance: pointsAwarded } },
        { upsert: true, new: true }
      );

      await WalletTransaction.create({
        walletId: wallet._id,
        deltaPoints: pointsAwarded,
        reason: `Submission ${submissionId} accepted`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
