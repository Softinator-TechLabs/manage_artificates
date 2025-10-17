import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  pointsBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  pointsBalance: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create index
WalletSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
