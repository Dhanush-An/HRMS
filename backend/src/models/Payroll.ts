import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRecord {
    employeeId: string;
    name: string;
    base: number;
    bonus: number;
    deductions: number;
    netSalary: number;
}

export interface IPayroll extends Document {
    month: string;
    year: number;
    dateGenerated: string;
    records: IPayrollRecord[];
}

const PayrollSchema: Schema = new Schema({
    month: { type: String, required: true },
    year: { type: Number, required: true },
    dateGenerated: { type: String, required: true },
    records: [{
        employeeId: { type: String, required: true },
        name: { type: String, required: true },
        base: { type: Number, required: true },
        bonus: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 },
        netSalary: { type: Number, required: true }
    }]
}, { timestamps: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
