import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Wallet from "@/models/Wallet";
import WalletTransaction from "@/models/WalletTransaction";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const wallet = await Wallet.findOne({ userId: user._id });
    const transactions = await WalletTransaction.find({ 
      walletId: wallet?._id 
    }).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json({
      balance: wallet?.pointsBalance || 0,
      transactions: transactions || [],
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
