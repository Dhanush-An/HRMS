import mongoose, { Document, Schema } from 'mongoose';

export interface IJobPosting extends Document {
    jobTitle: string;
    department: string;
    designation: string;
    location: string;
    workMode: string;
    vacancies: number;
    qualification: string;
    experience: string;
    requiredSkills: string;
    salaryRange: string;
    description: string;
    applicationDeadline: Date;
    recruiterName: string;
    recruiterEmail: string;
    recruiterContact: string;
    status: 'Draft' | 'Published' | 'Closed';
    posterUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const JobPostingSchema: Schema = new Schema({
    jobTitle: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    location: { type: String, required: true },
    workMode: { type: String, required: true },
    vacancies: { type: Number, required: true },
    qualification: { type: String, required: true },
    experience: { type: String, required: true },
    requiredSkills: { type: String, required: true },
    salaryRange: { type: String, required: true },
    description: { type: String, required: true },
    applicationDeadline: { type: Date, required: true },
    recruiterName: { type: String, required: true },
    recruiterEmail: { type: String, required: true },
    recruiterContact: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Draft', 'Published', 'Closed'], 
        default: 'Draft' 
    },
    posterUrl: { type: String, required: false }
}, { timestamps: true });

export default mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
