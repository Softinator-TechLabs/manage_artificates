import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { expertise } = await req.json();
    
    if (!expertise) {
      return NextResponse.json({ error: "Expertise is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { 
        $set: { 
          "profile.expertise": expertise,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      expertise: user.profile?.expertise 
    });

  } catch (error) {
    console.error("Error updating expertise:", error);
    return NextResponse.json({ 
      error: "Failed to update expertise" 
    }, { status: 500 });
  }
}