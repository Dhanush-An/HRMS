import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    message: string;
    type: string;
    date: string;
    author: string;
    target?: string; // e.g., 'all', 'department'
}

const AnnouncementSchema: Schema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'Company' },
    date: { type: String, required: true },
    author: { type: String, default: 'Admin' },
    target: { type: String, default: 'all' }
}, { timestamps: true });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
