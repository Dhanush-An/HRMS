import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformance extends Document {
    employeeId: string;
    type: string;
    title: string;
    description: string;
    rating: number;
    date: string;
}

const PerformanceSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IPerformance>('Performance', PerformanceSchema);
