import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
    employeeId: string;
    title: string;
    type: string;
    fileUrl?: string; // or path
    uploadDate: string;
    status: 'Pending' | 'Verified' | 'Rejected';
}

const DocumentSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    fileUrl: { type: String },
    uploadDate: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model<IDocument>('Document', DocumentSchema);
