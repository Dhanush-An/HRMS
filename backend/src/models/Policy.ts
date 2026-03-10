import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicy extends Document {
    title: string;
    description: string;
    category: string;
    lastUpdated: string;
}

const PolicySchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    lastUpdated: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IPolicy>('Policy', PolicySchema);
