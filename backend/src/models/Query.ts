import mongoose from 'mongoose';

const QuerySchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Resolved', 'In Progress'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Query', QuerySchema);
