import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    projectName?: string;
    description: string;
    employeeId: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    date: string;
    priority: 'Low' | 'Medium' | 'High';
}

const TaskSchema: Schema = new Schema({
    projectName: { type: String },
    description: { type: String, required: true },
    employeeId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    date: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
