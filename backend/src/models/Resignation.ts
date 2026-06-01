import mongoose, { Schema, Document } from 'mongoose';

export interface IResignation extends Document {
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    employeeDepartment: string;
    submissionDate: string;
    lastWorkingDate: string;
    noticePeriodDuration: string;
    reason?: string;
    comments?: string;
    companyAssets: {
        laptop: boolean;
        idCard: boolean;
        simCard: boolean;
        accessCard: boolean;
        otherAssets: boolean;
    };
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: Date;
    updatedAt: Date;
}

const ResignationSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeRole: { type: String, required: true },
    employeeDepartment: { type: String, required: true },
    submissionDate: { type: String, required: true },
    lastWorkingDate: { type: String, required: true },
    noticePeriodDuration: { type: String, required: true },
    reason: { type: String, default: '' },
    comments: { type: String, default: '' },
    companyAssets: {
        laptop: { type: Boolean, default: false },
        idCard: { type: Boolean, default: false },
        simCard: { type: Boolean, default: false },
        accessCard: { type: Boolean, default: false },
        otherAssets: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, {
    timestamps: true,
});

export default mongoose.model<IResignation>('Resignation', ResignationSchema);
