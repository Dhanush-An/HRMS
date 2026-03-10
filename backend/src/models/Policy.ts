import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicy extends Document {
    title: string;
    description: string;
    category?: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    lastUpdated: string;
}

const PolicySchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' },
    icon: { type: String, default: 'ShieldCheck' },
    color: { type: String, default: 'text-brand-primary' },
    bgColor: { type: String, default: 'bg-brand-primary/10' },
    borderColor: { type: String, default: 'border-brand-primary/20' },
    lastUpdated: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IPolicy>('Policy', PolicySchema);
