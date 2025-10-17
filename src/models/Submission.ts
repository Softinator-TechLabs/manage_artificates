import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 'PENDING' | 'PROCESSING' | 'ACCEPTED' | 'REJECTED';

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  artifactUrl: string;
  question: string;
  answer: string;
  status: SubmissionStatus;
  pointsAwarded: number;
  n8nWorkflowId?: string;
  n8nRunId?: string;
  reviewerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  artifactUrl: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 280,
  },
  answer: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  n8nWorkflowId: String,
  n8nRunId: String,
  reviewerNotes: String,
}, {
  timestamps: true,
});

// Create indexes
SubmissionSchema.index({ userId: 1 });
SubmissionSchema.index({ status: 1 });
SubmissionSchema.index({ createdAt: -1 });

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
