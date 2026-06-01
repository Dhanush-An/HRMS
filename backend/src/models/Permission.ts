import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
    employeeId: string;
    employeeName: string;
    branchId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Declined';
    approvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PermissionSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    branchId: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' },
    approvedBy: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IPermission>('Permission', PermissionSchema);
