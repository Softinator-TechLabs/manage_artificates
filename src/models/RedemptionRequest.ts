import mongoose, { Document, Schema } from 'mongoose';

export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
export type RedemptionMethod = 'BANK' | 'UPI';

export interface IRedemptionRequest extends Document {
  userId: mongoose.Types.ObjectId;
  points: number;
  status: RedemptionStatus;
  method: RedemptionMethod;
  payoutRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedemptionRequestSchema = new Schema<IRedemptionRequest>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'],
    default: 'PENDING',
  },
  method: {
    type: String,
    enum: ['BANK', 'UPI'],
    required: true,
  },
  payoutRef: String,
}, {
  timestamps: true,
});

// Create indexes
RedemptionRequestSchema.index({ userId: 1 });
RedemptionRequestSchema.index({ status: 1 });
RedemptionRequestSchema.index({ createdAt: -1 });

export default mongoose.models.RedemptionRequest || mongoose.model<IRedemptionRequest>('RedemptionRequest', RedemptionRequestSchema);
