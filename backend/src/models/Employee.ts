import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    employeeId: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    role: string;
    department: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    joiningDate: string;
    phone: string;
    avatar?: string;
    branchId: string;
    branchName: string;
    responsibilities?: string;
    salary: {
        basic: number;
        hra: number;
        conveyance: number;
        medical: number;
        special: number;
        other: number;
        pf: number;
        tax: number;
    };
    leaveBalance: {
        sick: number;
        casual: number;
        earned: number;
        wfh: number;
        paid?: number; // Added to match index.ts approve logic
    };
    address?: string;
    aadharNo?: string;
    trainingSalary?: number;
    engagementType?: 'Training' | 'Employment';
    reportsTo?: string;
    workLocation?: string;
    shiftWindow?: string;
    offerId?: string;
    offerIssueDate?: string;
    offerLetterUrl?: string;
    pan?: string;
    uan?: string;
    pfNo?: string;
    esiNo?: string;
    bankName?: string;
    bankAccount?: string;
    ifsc?: string;
}

const EmployeeSchema: Schema = new Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'employee' },
    department: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
    joiningDate: { type: String, required: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    branchId: { type: String, default: 'BR001' },
    branchName: { type: String, default: 'Chennai' },
    responsibilities: { type: String, default: '' },
    address: { type: String, default: '' },
    aadharNo: { type: String, default: '' },
    trainingSalary: { type: Number, default: 15000 },
    engagementType: { type: String, enum: ['Training', 'Employment'], default: 'Training' },
    reportsTo: { type: String, default: 'TL' },
    workLocation: { type: String, default: 'Bangalore (Onsite)' },
    shiftWindow: { type: String, default: '9:30 AM - 6:30 PM' },
    offerId: { type: String, default: '' },
    offerIssueDate: { type: String, default: '' },
    offerLetterUrl: { type: String, default: '' },
    salary: {
        basic: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        conveyance: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        special: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
        pf: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
    },
    leaveBalance: {
        sick: { type: Number, default: 12 },
        casual: { type: Number, default: 12 },
        earned: { type: Number, default: 15 },
        wfh: { type: Number, default: 10 },
        paid: { type: Number, default: 15 },
    },
    pan: { type: String, default: '' },
    uan: { type: String, default: '' },
    pfNo: { type: String, default: '' },
    esiNo: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    ifsc: { type: String, default: '' }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret: any) => {
            ret.id = ret.employeeId;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
