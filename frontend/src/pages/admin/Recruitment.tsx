import { useState, useEffect, memo } from 'react';
import { Briefcase, Send, Sparkles, Filter, MoreHorizontal, Edit2, Trash2, X, Clock, Upload, Image } from 'lucide-react';
import api from '../../api';
import { API_URL } from '../../config';

interface JobPosting {
    _id?: string;
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
    applicationDeadline: string;
    recruiterName: string;
    recruiterEmail: string;
    recruiterContact: string;
    status: 'Draft' | 'Published' | 'Closed';
    posterUrl?: string;
    createdAt?: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Published': return 'bg-emerald-500';
        case 'Draft': return 'bg-amber-500';
        case 'Closed': return 'bg-rose-500';
        default: return 'bg-brand-primary';
    }
};

const getStatusStyles = (status: string) => {
    switch (status) {
        case 'Published': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        case 'Draft': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        case 'Closed': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        default: return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
    }
};

const JobCard = memo(({ job, idx, onEdit, onDelete, onStatusChange }: { job: JobPosting; idx: number; onEdit: (job: JobPosting) => void; onDelete: (id: string) => void; onStatusChange: (job: JobPosting, status: string) => void }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [showPoster, setShowPoster] = useState(false);

    return (
        <div
            className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-2xl hover:border-brand-primary/20 transition-all duration-500 animate-in slide-in-from-right-4"
            style={{ animationDelay: `${idx * 100}ms` }}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(job.status)} shadow-[2px_0_10px_rgba(0,0,0,0.1)]`}></div>

            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(job.status)}`}>
                        {job.status}
                    </span>
                    <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-brand-bg px-3 py-1.5 rounded-xl border border-brand-border">
                        <Clock className="w-3.5 h-3.5" />
                        Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                    </span>
                </div>
                <div className="relative">
                    <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-bg rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showOptions && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-brand-border rounded-2xl shadow-xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => {
                                    onEdit(job);
                                    setShowOptions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors border-b border-brand-border"
                            >
                                <Edit2 className="w-4 h-4 text-brand-primary" />
                                Edit Posting
                            </button>
                            {job.status !== 'Published' && (
                                <button
                                    onClick={() => {
                                        onStatusChange(job, 'Published');
                                        setShowOptions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-emerald-600 hover:bg-brand-bg transition-colors border-b border-brand-border"
                                >
                                    <Send className="w-4 h-4" />
                                    Publish
                                </button>
                            )}
                            {job.status !== 'Closed' && (
                                <button
                                    onClick={() => {
                                        onStatusChange(job, 'Closed');
                                        setShowOptions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-brand-bg transition-colors border-b border-brand-border"
                                >
                                    <X className="w-4 h-4" />
                                    Close Posting
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    onDelete(job._id!);
                                    setShowOptions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-status-rejected hover:bg-brand-bg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="text-2xl font-black text-brand-text mb-2 group-hover:text-brand-primary transition-colors tracking-tight">{job.jobTitle}</h3>
            <p className="text-brand-muted font-bold text-sm mb-4">{job.department} • {job.designation}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-brand-muted uppercase font-black">Experience</span>
                    <span className="text-sm font-semibold text-brand-text">{job.experience}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-brand-muted uppercase font-black">Salary</span>
                    <span className="text-sm font-semibold text-brand-text">{job.salaryRange}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-brand-muted uppercase font-black">Vacancies</span>
                    <span className="text-sm font-semibold text-brand-text">{job.vacancies} Position(s)</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-brand-muted uppercase font-black">Work Mode</span>
                    <span className="text-sm font-semibold text-brand-text">{job.workMode}</span>
                </div>
            </div>

            <p className="text-brand-muted font-medium whitespace-pre-wrap leading-relaxed text-sm bg-brand-bg/30 p-6 rounded-3xl border border-brand-border/50 group-hover:border-brand-border transition-all line-clamp-3">{job.description}</p>

            {/* View Poster Button */}
            {job.posterUrl && (
                <button
                    type="button"
                    onClick={() => setShowPoster(true)}
                    className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    <Image className="w-4 h-4" />
                    View Poster
                </button>
            )}

            {/* Full-screen Poster Lightbox */}
            {showPoster && job.posterUrl && (() => {
                const src = job.posterUrl.startsWith('http') ? job.posterUrl : `${API_URL}${job.posterUrl}`;
                return (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowPoster(false)}
                    >
                        {/* Toolbar */}
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur-md border-b border-white/10">
                            <span className="text-white font-black text-sm uppercase tracking-widest">{job.jobTitle} — Poster</span>
                            <div className="flex items-center gap-3">
                                <a
                                    href={src}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    ⬇ Download Poster
                                </a>
                                <button
                                    onClick={() => setShowPoster(false)}
                                    className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Full poster — click inside doesn't close */}
                        <div className="flex justify-center p-6" onClick={e => e.stopPropagation()}>
                            <img
                                src={src}
                                alt="Job Poster"
                                className="w-full max-w-3xl rounded-3xl shadow-2xl"
                                style={{ height: 'auto' }}
                            />
                        </div>
                    </div>
                );
            })()}

            <div className="mt-6 flex justify-end">
                <div className="h-1 w-20 bg-brand-border/30 rounded-full group-hover:bg-brand-primary/20 transition-all duration-700"></div>
            </div>
        </div>
    );
});

const JobForm = ({ onPostSuccess, editingJob, onCancelEdit }: { onPostSuccess: () => void; editingJob?: JobPosting | null; onCancelEdit?: () => void }) => {
    const initialFormState: JobPosting = {
        jobTitle: '',
        department: '',
        designation: '',
        location: '',
        workMode: 'On-site',
        vacancies: 1,
        qualification: '',
        experience: '',
        requiredSkills: '',
        salaryRange: '',
        description: '',
        applicationDeadline: new Date().toISOString().split('T')[0],
        recruiterName: '',
        recruiterEmail: '',
        recruiterContact: '',
        status: 'Draft',
        posterUrl: ''
    };

    const [formData, setFormData] = useState<JobPosting>(initialFormState);
    const [isPosting, setIsPosting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'Draft' | 'Published'>('Published');
    const [uploadingPoster, setUploadingPoster] = useState(false);

    const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        
        setUploadingPoster(true);
        try {
            const res = await api.postForm('/api/upload', formDataObj);
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, posterUrl: data.url }));
            }
        } catch (err: any) {
            console.error("Upload error", err);
            alert(`Failed to upload image: ${err.message || 'Unknown error'}`);
        } finally {
            setUploadingPoster(false);
            // Reset input value so same file can be selected again
            e.target.value = '';
        }
    };

    useEffect(() => {
        if (editingJob) {
            setFormData({
                ...editingJob,
                applicationDeadline: new Date(editingJob.applicationDeadline).toISOString().split('T')[0]
            });
        } else {
            setFormData(initialFormState);
        }
    }, [editingJob]);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            const submitData = { ...formData };
            if (!editingJob) {
                submitData.status = submitStatus;
            }

            const url = editingJob ? `/api/jobs/${editingJob._id}` : '/api/jobs';
            const method = editingJob ? 'PUT' : 'POST';
            
            const response = await api[method === 'POST' ? 'post' : 'put'](url, submitData);
            if (response.ok) {
                if (submitData.status === 'Published') {
                    window.dispatchEvent(new Event('jobPublished'));
                }
                onPostSuccess();
                setFormData(initialFormState);
                if (onCancelEdit) onCancelEdit();
            } else {
                console.error("API returned error:", await response.text());
            }
        } catch (error) {
            console.error("Error posting job:", error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 shadow-xl sticky top-8 animate-in slide-in-from-left-4 duration-700 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
                        <Briefcase className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-brand-text tracking-tight">
                            {editingJob ? 'Edit Job Posting' : 'New Job Posting'}
                        </h2>
                        <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">Find your next talent</p>
                    </div>
                </div>
                {editingJob && (
                    <button 
                        onClick={onCancelEdit}
                        className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-text transition-colors"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <form onSubmit={handlePost} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-text tracking-tight border-b border-brand-border pb-2">Basic Info</h3>
                    <div>
                        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Job Title</label>
                        <input
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-black text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                            placeholder="e.g. Senior Frontend Developer"
                            value={formData.jobTitle}
                            onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Department</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="e.g. Engineering"
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Designation</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="e.g. Team Lead"
                                value={formData.designation}
                                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Location & Mode */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-text tracking-tight border-b border-brand-border pb-2">Location & Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Location</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="e.g. New York, NY"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Work Mode</label>
                            <select
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all appearance-none"
                                value={formData.workMode}
                                onChange={e => setFormData({ ...formData, workMode: e.target.value })}
                                required
                            >
                                <option value="On-site">On-site</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Vacancies</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                value={formData.vacancies}
                                onChange={e => setFormData({ ...formData, vacancies: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Requirements */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-text tracking-tight border-b border-brand-border pb-2">Requirements</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Qualification</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="e.g. B.Tech CS"
                                value={formData.qualification}
                                onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Experience</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="e.g. 3-5 Years"
                                value={formData.experience}
                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Required Skills</label>
                        <input
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                            placeholder="e.g. React, Node.js, TypeScript"
                            value={formData.requiredSkills}
                            onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Salary Range</label>
                        <input
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                            placeholder="e.g. $80k - $120k"
                            value={formData.salaryRange}
                            onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-3 ml-1 block">Job Description</label>
                    <textarea
                        className="w-full bg-brand-bg border border-brand-border rounded-2xl p-5 text-brand-text font-medium text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-sm placeholder-brand-muted/50 resize-none min-h-[150px]"
                        placeholder="Write detailed job description..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    ></textarea>
                </div>

                {/* Recruiter & Deadline */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-brand-text tracking-tight border-b border-brand-border pb-2">Recruiter & Deadline</h3>
                    <div>
                        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Application Deadline</label>
                        <input
                            type="date"
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                            value={formData.applicationDeadline}
                            onChange={e => setFormData({ ...formData, applicationDeadline: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Recruiter Name</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="Name"
                                value={formData.recruiterName}
                                onChange={e => setFormData({ ...formData, recruiterName: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Email</label>
                            <input
                                type="email"
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="Email"
                                value={formData.recruiterEmail}
                                onChange={e => setFormData({ ...formData, recruiterEmail: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 ml-1 block">Contact</label>
                            <input
                                className="w-full bg-brand-bg border border-brand-border rounded-2xl p-4 text-brand-text font-bold text-sm focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
                                placeholder="Phone"
                                value={formData.recruiterContact}
                                onChange={e => setFormData({ ...formData, recruiterContact: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pb-4">
                    <h3 className="text-sm font-black text-brand-text tracking-tight border-b border-brand-border pb-2">Poster Image</h3>
                    <div className="flex items-center gap-4">
                        <label className={`flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all flex-1 group ${formData.posterUrl ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-brand-bg border-brand-border hover:border-brand-primary/50'}`}>
                            {uploadingPoster ? (
                                <span className="text-sm font-bold text-brand-muted animate-pulse">Uploading...</span>
                            ) : formData.posterUrl ? (
                                <>
                                    <Image className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Poster Uploaded Successfully</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-brand-muted group-hover:text-brand-primary transition-colors" />
                                    <span className="text-sm font-bold text-brand-muted group-hover:text-brand-text transition-colors">Upload Poster Image (Optional)</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handlePosterUpload}
                                disabled={uploadingPoster}
                            />
                        </label>
                        {formData.posterUrl && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, posterUrl: '' }))}
                                className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-500/20 transition-colors"
                                title="Remove Poster"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-brand-border">
                    {editingJob ? (
                        <>
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                className="flex-1 bg-brand-bg border border-brand-border hover:bg-brand-surface text-brand-text py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isPosting}
                                className="flex-[2] bg-brand-primary hover:opacity-90 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                            >
                                {isPosting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="submit"
                                onClick={() => setSubmitStatus('Draft')}
                                disabled={isPosting}
                                className="flex-1 bg-brand-bg border border-brand-border hover:bg-brand-surface text-brand-text py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                Save Draft
                            </button>
                            <button
                                type="submit"
                                onClick={() => setSubmitStatus('Published')}
                                disabled={isPosting}
                                className="flex-[2] bg-brand-primary hover:opacity-90 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {isPosting ? 'Publishing...' : 'Publish Job'}
                            </button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

const Recruitment = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

    const fetchData = async () => {
        try {
            const jobsRes = await api.get('/api/jobs');
            if (jobsRes.ok) {
                const data = await jobsRes.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this job posting?')) return;
        try {
            const response = await api.delete(`/api/jobs/${id}`);
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    const handleStatusChange = async (job: JobPosting, newStatus: string) => {
        try {
            const response = await api.put(`/api/jobs/${job._id}`, { ...job, status: newStatus });
            if (response.ok) {
                if (newStatus === 'Published') {
                    window.dispatchEvent(new Event('jobPublished'));
                }
                fetchData();
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight">Recruitment Center</h1>
                    <p className="text-brand-muted font-medium">Manage job postings and attract new talent.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Create Job Form */}
                <div className="lg:col-span-1">
                    <JobForm 
                        onPostSuccess={fetchData} 
                        editingJob={editingJob}
                        onCancelEdit={() => setEditingJob(null)}
                    />
                </div>

                {/* Job List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-6 h-6 text-brand-primary" />
                            <h2 className="text-xl font-black text-brand-text tracking-tight uppercase">Recent Job Postings</h2>
                        </div>
                        <button className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-muted hover:text-brand-text">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>

                    {Array.isArray(jobs) && jobs.length === 0 ? (
                        <div className="text-center py-20 bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-brand-muted opacity-20" />
                            </div>
                            <h3 className="text-xl font-black text-brand-text mb-2">No Openings</h3>
                            <p className="text-brand-muted font-medium text-sm">No job postings available at the moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Array.isArray(jobs) && jobs.map((job, idx) => (
                                <JobCard 
                                    key={job._id} 
                                    job={job} 
                                    idx={idx} 
                                    onEdit={setEditingJob}
                                    onDelete={handleDelete}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recruitment;
