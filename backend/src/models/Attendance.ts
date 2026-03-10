import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'Present' | 'Absent' | 'Late' | 'Half Day';
    location?: {
        lat: number;
        lng: number;
    };
    workMode?: string;
    workLocation?: string;
}

const AttendanceSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    date: { type: String, required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day'], default: 'Present' },
    workMode: { type: String },
    workLocation: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret: any) => {
            ret.id = ret._id;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
