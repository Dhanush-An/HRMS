import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
    employeeId: string;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    appliedOn: string;
}

const LeaveSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    type: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedOn: { type: String, required: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<ILeave>('Leave', LeaveSchema);
