import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
    id: string; // The custom EMP001 style ID
    name: string;
    email: string;
    username?: string;
    password?: string;
    role: string;
    department: string;
    status: string;
    joiningDate: string;
    phone?: string;
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
    };
}

const EmployeeSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String },
    password: { type: String },
    role: { type: String, required: true },
    department: { type: String, required: true },
    status: { type: String, default: 'Active' },
    joiningDate: { type: String },
    phone: { type: String },
    salary: {
        base: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    leaveBalance: {
        sick: { type: Number, default: 10 },
        casual: { type: Number, default: 12 },
        earned: { type: Number, default: 15 },
        wfh: { type: Number, default: 10 }
    }
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
