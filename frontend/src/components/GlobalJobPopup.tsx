import { useState, useEffect } from 'react';
import { Briefcase, X, MapPin, Clock, ArrowRight, DollarSign, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    posterUrl?: string;
}

const GlobalJobPopup = () => {
    const [latestJob, setLatestJob] = useState<JobPosting | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkLatestJob = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Don't show popup for admin users
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user?.role === 'admin') return;
                }
            } catch {}

            try {
                const response = await api.get('/api/jobs');
                if (response.ok) {
                    const jobs = await response.json();
                    const publishedJobs = jobs.filter((job: any) => job.status === 'Published');
                    if (publishedJobs.length > 0) {
                        const mostRecent = publishedJobs[0];
                        const seenJobs = JSON.parse(localStorage.getItem('seenJobs') || '[]');
                        
                        if (!seenJobs.includes(mostRecent._id)) {
                            setLatestJob(mostRecent);
                            setIsVisible(true);
                            seenJobs.push(mostRecent._id);
                            localStorage.setItem('seenJobs', JSON.stringify(seenJobs));
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching latest job:', error);
            }
        };

        checkLatestJob();
        const interval = setInterval(checkLatestJob, 60000);
        window.addEventListener('jobPublished', checkLatestJob);

        return () => {
            clearInterval(interval);
            window.removeEventListener('jobPublished', checkLatestJob);
        };
    }, []);

    if (!latestJob) return null;

    // Resolve poster URL - handle both Cloudinary (absolute) and local (relative) URLs
    const posterSrc = latestJob.posterUrl
        ? latestJob.posterUrl.startsWith('http')
            ? latestJob.posterUrl
            : `${API_URL}${latestJob.posterUrl}`
        : null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsVisible(false)}
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-brand-surface border-2 border-brand-primary/20 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {posterSrc ? (
                            /* Poster Image Header */
                            <div className="relative w-full flex-shrink-0" style={{ height: '220px' }}>
                                <img
                                    src={posterSrc}
                                    alt="Job Poster"
                                    className="w-full h-full object-cover"
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                {/* Job title over poster */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-white/20 text-white">
                                        New Internal Opening
                                    </span>
                                    <h2 className="text-2xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
                                        {latestJob.jobTitle}
                                    </h2>
                                    <p className="text-white/80 font-medium text-sm mt-0.5">
                                        {latestJob.department} • {latestJob.designation}
                                    </p>
                                </div>
                                {/* Close button */}
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ) : (
                            /* Default Gradient Header (no poster) */
                            <div className="bg-gradient-to-r from-brand-primary to-blue-600 p-8 text-white relative overflow-hidden flex-shrink-0">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20">
                                            New Internal Opening
                                        </span>
                                        <h2 className="text-3xl font-black tracking-tight leading-tight">
                                            {latestJob.jobTitle}
                                        </h2>
                                        <p className="text-white/80 font-medium mt-1">
                                            {latestJob.department} • {latestJob.designation}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-sm border border-white/10"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Scrollable Content */}
                        <div className="p-8 space-y-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                    <div className="p-2 bg-brand-primary/10 rounded-xl">
                                        <MapPin className="w-5 h-5 text-brand-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Location</p>
                                        <p className="text-sm font-bold text-brand-text">{latestJob.location || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <Briefcase className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Work Mode</p>
                                        <p className="text-sm font-bold text-brand-text">{latestJob.workMode}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                                        <Clock className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Experience</p>
                                        <p className="text-sm font-bold text-brand-text">{latestJob.experience}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-brand-bg p-4 rounded-2xl border border-brand-border">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <DollarSign className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Salary Range</p>
                                        <p className="text-sm font-bold text-brand-text">{latestJob.salaryRange}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-brand-text uppercase tracking-widest mb-2">Description</h3>
                                <p className="text-brand-muted text-sm leading-relaxed line-clamp-3">
                                    {latestJob.description}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                {posterSrc && (
                                    <a
                                        href={posterSrc}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-4 bg-brand-bg border border-brand-border hover:border-brand-primary/50 text-brand-text hover:text-brand-primary rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Poster
                                    </a>
                                )}
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="flex-1 py-4 bg-brand-primary hover:opacity-90 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/20 text-xs"
                                >
                                    Got it
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GlobalJobPopup;
