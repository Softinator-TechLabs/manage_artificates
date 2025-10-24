import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookEvent extends Document {
  submissionId: string;
  payload: Record<string, unknown>;
  source: string;
  signature?: string;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    submissionId: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    signature: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Create indexes
WebhookEventSchema.index({ submissionId: 1 });
WebhookEventSchema.index({ createdAt: -1 });

export default mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
