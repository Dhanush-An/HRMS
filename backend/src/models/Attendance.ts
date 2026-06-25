import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    employeeId: string;
    employeeName?: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    workHours?: number;
    status: 'Present' | 'Absent' | 'Late' | 'Half Day';
    location?: {
        lat: number;
        lng: number;
    };
    workMode?: string;
    workLocation?: string;
    shiftType?: string;
    faceImage?: string;
    breaks?: Array<{
        type: 'Break' | 'Lunch';
        startTime: string;
        endTime?: string;
        duration?: number;
    }>;
}

const AttendanceSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String },
    date: { type: String, required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    workHours: { type: Number },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day'], default: 'Present' },
    workMode: { type: String },
    workLocation: { type: String },
    shiftType: { type: String },
    faceImage: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    breaks: [{
        type: { type: String, enum: ['Break', 'Lunch'] },
        startTime: { type: String },
        endTime: { type: String },
        duration: { type: Number }
    }]
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

AttendanceSchema.index({ employeeId: 1, date: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);

