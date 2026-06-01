import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    receiptName?: string;
    receiptUrl?: string;
}

const ExpenseSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeRole: { type: String, default: 'employee' },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    receiptName: { type: String },
    receiptUrl: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
