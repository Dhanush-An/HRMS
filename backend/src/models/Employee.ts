import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    employeeId: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    role: 'admin' | 'employee';
    department: string;
    status: 'Active' | 'Inactive' | 'On Leave';
    joiningDate: string;
    phone: string;
    salary: {
        base: number;
        hra: number;
        transport: number;
        other: number;
    };
    leaveBalance: {
        sick: number;
        casual: number;
        earned: number;
        wfh: number;
        paid?: number; // Added to match index.ts approve logic
    };
}

const EmployeeSchema: Schema = new Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    department: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
    joiningDate: { type: String, required: true },
    phone: { type: String, default: '' },
    salary: {
        base: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
    },
    leaveBalance: {
        sick: { type: Number, default: 12 },
        casual: { type: Number, default: 12 },
        earned: { type: Number, default: 15 },
        wfh: { type: Number, default: 10 },
        paid: { type: Number, default: 15 },
    }
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
