import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { redemptionSchema } from "@/lib/validation";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";
import RedemptionRequest from "@/models/RedemptionRequest";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = redemptionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parsed.error.issues 
      }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { method, points } = parsed.data;

    // Check if user has sufficient points
    const wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet || wallet.pointsBalance < points) {
      return NextResponse.json({ 
        error: "Insufficient points" 
      }, { status: 400 });
    }

    // Create redemption request and deduct points
    await RedemptionRequest.create({
      userId: user._id,
      points,
      method,
    });

    // Update wallet balance
    await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: { pointsBalance: -points } }
    );

    // Create transaction record
    await WalletTransaction.create({
      walletId: wallet._id,
      deltaPoints: -points,
      reason: "Redemption request",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating redemption:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const redemptions = await RedemptionRequest.find({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    return NextResponse.json(redemptions);
  } catch (error) {
    console.error("Error fetching redemptions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
