import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, Download, ChevronRight, X, Image, DollarSign } from 'lucide-react';
import api from '../api';
import { API_URL } from '../config';

interface JobPosting {
    _id: string;
    jobTitle: string;
    department: string;
    designation: string;
    location: string;
    workMode: string;
    vacancies: number;
    experience: string;
    salaryRange: string;
    description: string;
    applicationDeadline: string;
    recruiterName: string;
    recruiterEmail: string;
    recruiterContact: string;
    status: string;
    posterUrl?: string;
    createdAt: string;
}

const statusColors: Record<string, string> = {
    Published: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Closed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
};

const JobsTab = ({ showAll = false }: { showAll?: boolean }) => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [showPoster, setShowPoster] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/api/jobs');
                if (res.ok) {
                    const data: JobPosting[] = await res.json();
                    // Non-admins see only published jobs; admins (showAll) see all
                    setJobs(showAll ? data : data.filter(j => j.status === 'Published'));
                }
            } catch (e) {
                console.error('Error fetching jobs:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [showAll]);

    const getPosterSrc = (url?: string) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${API_URL}${url}`;
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-brand-text tracking-tight">Job Openings</h1>
                <p className="text-brand-muted font-medium mt-1">
                    {jobs.length} {showAll ? 'total' : 'published'} position{jobs.length !== 1 ? 's' : ''} available
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-24 bg-brand-surface border border-brand-border rounded-[2.5rem]">
                    <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="w-10 h-10 text-brand-muted opacity-20" />
                    </div>
                    <h3 className="text-xl font-black text-brand-text mb-2">No Open Positions</h3>
                    <p className="text-brand-muted text-sm">Check back later for new job openings.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.map((job) => {
                        const posterSrc = getPosterSrc(job.posterUrl);
                        return (
                            <div
                                key={job._id}
                                className="bg-brand-surface border border-brand-border rounded-[2rem] overflow-hidden hover:shadow-2xl hover:border-brand-primary/20 transition-all duration-300 group flex flex-col"
                            >
                                {/* Poster banner or gradient banner */}
                                {posterSrc ? (
                                    <div className="relative h-36 overflow-hidden flex-shrink-0">
                                        <img src={posterSrc} alt="Poster" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <span className={`absolute top-3 left-3 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusColors[job.status] || ''}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-2 bg-gradient-to-r from-brand-primary to-blue-500 flex-shrink-0" />
                                )}

                                <div className="p-6 flex flex-col flex-1">
                                    {!posterSrc && (
                                        <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border mb-3 w-fit ${statusColors[job.status] || ''}`}>
                                            {job.status}
                                        </span>
                                    )}

                                    <h3 className="text-lg font-black text-brand-text group-hover:text-brand-primary transition-colors tracking-tight leading-tight">
                                        {job.jobTitle}
                                    </h3>
                                    <p className="text-brand-muted text-sm font-bold mt-0.5 mb-4">{job.department} • {job.designation}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <MapPin className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                                            <span className="truncate">{job.location || 'TBD'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <Briefcase className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                            <span className="truncate">{job.workMode}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                            <span className="truncate">{job.experience}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <DollarSign className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                            <span className="truncate">{job.salaryRange}</span>
                                        </div>
                                    </div>

                                    <p className="text-brand-muted text-sm leading-relaxed line-clamp-2 mb-4 flex-1">{job.description}</p>

                                    <div className="flex gap-2 mt-auto pt-4 border-t border-brand-border">
                                        <button
                                            onClick={() => setSelectedJob(job)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            View Details
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                        {posterSrc && (
                                            <button
                                                onClick={() => { setSelectedJob(job); setShowPoster(true); }}
                                                className="p-2.5 bg-brand-bg border border-brand-border hover:border-brand-primary/40 text-brand-muted hover:text-brand-primary rounded-xl transition-all"
                                                title="View Poster"
                                            >
                                                <Image className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Job Detail Modal */}
            {selectedJob && !showPoster && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setSelectedJob(null)}
                >
                    <div
                        className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-brand-primary to-blue-600 p-8 text-white rounded-t-[2.5rem] relative">
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                {selectedJob.status}
                            </span>
                            <h2 className="text-2xl font-black tracking-tight">{selectedJob.jobTitle}</h2>
                            <p className="text-white/80 mt-1">{selectedJob.department} • {selectedJob.designation}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Location', value: selectedJob.location || '—', icon: MapPin, color: 'text-brand-primary bg-brand-primary/10' },
                                    { label: 'Work Mode', value: selectedJob.workMode, icon: Briefcase, color: 'text-emerald-500 bg-emerald-500/10' },
                                    { label: 'Experience', value: selectedJob.experience, icon: Clock, color: 'text-indigo-500 bg-indigo-500/10' },
                                    { label: 'Salary Range', value: selectedJob.salaryRange, icon: DollarSign, color: 'text-amber-500 bg-amber-500/10' },
                                    { label: 'Vacancies', value: `${selectedJob.vacancies} Position(s)`, icon: Briefcase, color: 'text-purple-500 bg-purple-500/10' },
                                    { label: 'Deadline', value: new Date(selectedJob.applicationDeadline).toLocaleDateString(), icon: Clock, color: 'text-rose-500 bg-rose-500/10' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="flex items-center gap-3 bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                        <div className={`p-2 rounded-xl ${color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{label}</p>
                                            <p className="text-sm font-bold text-brand-text">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-black text-brand-text uppercase tracking-widest mb-2">Description</h3>
                                <p className="text-brand-muted text-sm leading-relaxed whitespace-pre-wrap bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                    {selectedJob.description}
                                </p>
                            </div>

                            {/* Recruiter */}
                            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                <h3 className="text-xs font-black text-brand-muted uppercase tracking-widest mb-3">Recruiter</h3>
                                <p className="font-bold text-brand-text">{selectedJob.recruiterName}</p>
                                <p className="text-sm text-brand-muted">{selectedJob.recruiterEmail}</p>
                                <p className="text-sm text-brand-muted">{selectedJob.recruiterContact}</p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                {selectedJob.posterUrl && (() => {
                                    const src = getPosterSrc(selectedJob.posterUrl);
                                    return (
                                        <>
                                            <button
                                                onClick={() => setShowPoster(true)}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-bg border border-brand-border hover:border-brand-primary/50 text-brand-text hover:text-brand-primary rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                <Image className="w-4 h-4" />
                                                View Poster
                                            </button>
                                            <a
                                                href={src!}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-bg border border-brand-border hover:border-brand-primary/50 text-brand-text hover:text-brand-primary rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </a>
                                        </>
                                    );
                                })()}
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="flex-1 py-3 bg-brand-primary hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-screen Poster Lightbox */}
            {showPoster && selectedJob?.posterUrl && (() => {
                const src = getPosterSrc(selectedJob.posterUrl)!;
                return (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowPoster(false)}
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur-md border-b border-white/10">
                            <span className="text-white font-black text-sm uppercase tracking-widest">{selectedJob.jobTitle} — Poster</span>
                            <div className="flex items-center gap-3">
                                <a
                                    href={src}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    ⬇ Download
                                </a>
                                <button
                                    onClick={() => setShowPoster(false)}
                                    className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-center p-6" onClick={e => e.stopPropagation()}>
                            <img src={src} alt="Job Poster" className="w-full max-w-3xl rounded-3xl shadow-2xl" />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default JobsTab;
