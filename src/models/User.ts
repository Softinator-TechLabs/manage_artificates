import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    expertise?: string;
    bio?: string;
  };
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  image: String,
  profile: {
    expertise: String,
    bio: String,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
