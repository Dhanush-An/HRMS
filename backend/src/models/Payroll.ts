import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRecord {
    employeeId: string;
    name: string;
    base: number;
    bonus: number;
    deductions: number;
    netSalary: number;
    tax?: number;
    pf?: number;
    attendanceStats?: {
        totalWorkingDays: number;
        presentDays: number;
        leaveDays: number;
        lossOfPayDays: number;
        paidDays: number;
    };
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
        tax: { type: Number, default: 0 },
        pf: { type: Number, default: 0 },
        netSalary: { type: Number, required: true },
        attendanceStats: {
            totalWorkingDays: { type: Number },
            presentDays: { type: Number },
            leaveDays: { type: Number },
            lossOfPayDays: { type: Number },
            paidDays: { type: Number }
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
