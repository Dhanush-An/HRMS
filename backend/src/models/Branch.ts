import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
    branchId: string;
    name: string;
    branchCode: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    managerName?: string;
    phone?: string;
    email?: string;
    employeeStrength: number;
    openingDate?: string;
    branchType: 'Head Office' | 'Regional Office' | 'Franchise';
    status: 'Active' | 'Inactive';
}

const BranchSchema: Schema = new Schema({
    branchId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    branchCode: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
    managerName: { type: String },
    phone: { type: String },
    email: { type: String },
    employeeStrength: { type: Number, default: 0 },
    openingDate: { type: String },
    branchType: { type: String, enum: ['Head Office', 'Regional Office', 'Franchise'], default: 'Regional Office' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IBranch>('Branch', BranchSchema);
