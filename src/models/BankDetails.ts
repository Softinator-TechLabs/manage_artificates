import mongoose, { Document, Schema } from 'mongoose';

export interface IBankDetails extends Document {
  userId: mongoose.Types.ObjectId;
  accountHolder?: string;
  accountNumber?: string; // encrypted
  ifsc?: string;
  upiId?: string;
  updatedAt: Date;
}

const BankDetailsSchema = new Schema<IBankDetails>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  accountHolder: String,
  accountNumber: String, // Will be encrypted
  ifsc: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: 'IFSC code must be in format: AAAA0XXXXXX'
    }
  },
  upiId: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^\w+@[\w.]+$/.test(v);
      },
      message: 'UPI ID must be in format: name@bank'
    }
  },
}, {
  timestamps: { createdAt: false, updatedAt: true },
});

// Create index
BankDetailsSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.BankDetails || mongoose.model<IBankDetails>('BankDetails', BankDetailsSchema);
