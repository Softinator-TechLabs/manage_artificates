import mongoose, { Document, Schema } from 'mongoose';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  deltaPoints: number;
  reason: string;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  walletId: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  deltaPoints: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Create indexes
WalletTransactionSchema.index({ walletId: 1 });
WalletTransactionSchema.index({ createdAt: -1 });

export default mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
