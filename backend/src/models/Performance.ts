import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformance extends Document {
    employeeId: string;
    rating: number;
    feedback: string;
    date: string;
    reviewer: string;
}

const PerformanceSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, required: true },
    date: { type: String, required: true },
    reviewer: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IPerformance>('Performance', PerformanceSchema);
