import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { bankSchema } from '@/lib/validation';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import BankDetails from '@/models/BankDetails';
import { encryptPII, maskAccount } from '@/lib/encryption';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const bankDetails = await BankDetails.findOne({ userId: user._id });

    return NextResponse.json({
      accountHolder: bankDetails?.accountHolder || null,
      accountNumberMasked: bankDetails?.accountNumber
        ? maskAccount(bankDetails.accountNumber)
        : null,
      ifsc: bankDetails?.ifsc || null,
      upiId: bankDetails?.upiId || null,
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bankSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { accountHolder, accountNumber, ifsc, upiId } = parsed.data;

    // Encrypt account number if provided
    const encryptedAccountNumber = accountNumber
      ? encryptPII(accountNumber)
      : undefined;

    await BankDetails.findOneAndUpdate(
      { userId: user._id },
      {
        accountHolder,
        accountNumber: encryptedAccountNumber,
        ifsc,
        upiId,
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bank details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
