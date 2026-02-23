import React from 'react';
import { TrendingUp, Award, Target, MessageSquare } from 'lucide-react';
import api from '../../api';

const EmployeePerformance = () => {
    const [performanceData, setPerformanceData] = React.useState<any>({
        reviews: [],
        promotions: [],
        warnings: [],
        goals: []
    });

    React.useEffect(() => {
        const fetchPerformance = async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            try {
                const response = await api.get('/api/performance');
                const data = await response.json();

                console.log("Performance data fetched:", data);
                // Filter for current user
                const userRecords = data.filter((r: any) => r.employeeId === user.id);
                console.log("Filtered user records:", userRecords);

                setPerformanceData({
                    reviews: userRecords.filter((r: any) => r.type === 'Review'),
                    promotions: userRecords.filter((r: any) => r.type === 'Promotion'),
                    warnings: userRecords.filter((r: any) => r.type === 'Warning'),
                    goals: userRecords.filter((r: any) => r.type === 'Goal')
                });
            } catch (error) {
                console.error("Error fetching performance:", error);
            }
        };

        fetchPerformance();
    }, []);

    const latestReview = performanceData.reviews[performanceData.reviews.length - 1];
    const averageRating = performanceData.reviews.length > 0
        ? (performanceData.reviews.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / performanceData.reviews.length).toFixed(1)
        : 'New';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-black text-brand-text mb-6 tracking-tight">Performance & Goals</h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24 text-brand-primary" />
                    </div>
                    <h3 className="text-brand-muted text-[10px] font-black uppercase tracking-widest mb-2 pl-1">Current Rating</h3>
                    <div className="flex items-end gap-2 text-brand-text">
                        <span className="text-4xl font-black">{averageRating}</span>
                        <span className="text-lg text-brand-muted font-bold mb-1">/ 5.0</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mt-3 opacity-60">Overall Performance</p>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Award className="w-24 h-24 text-purple-500" />
                    </div>
                    <h3 className="text-brand-muted text-[10px] font-black uppercase tracking-widest mb-2 pl-1">Last Review</h3>
                    <div className="flex items-end gap-2 text-brand-text">
                        <span className="text-2xl font-black">{latestReview?.date || 'N/A'}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mt-3 opacity-60">{latestReview?.title || 'No reviews yet'}</p>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Target className="w-24 h-24 text-status-approved" />
                    </div>
                    <h3 className="text-brand-muted text-[10px] font-black uppercase tracking-widest mb-2 pl-1">Promotions</h3>
                    <div className="flex items-end gap-2 text-brand-text">
                        <span className="text-4xl font-black">{performanceData.promotions.length}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-status-approved mt-3 opacity-60">Career Milestones</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Manager Feedback (Latest Review) */}
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm">
                    <h2 className="text-xl font-black text-brand-text mb-6 flex items-center gap-3 uppercase tracking-tighter">
                        <MessageSquare className="w-5 h-5 text-brand-primary" />
                        Latest Feedback
                    </h2>
                    {latestReview ? (
                        <div className="bg-brand-bg rounded-2xl p-6 border border-brand-border shadow-inner relative">
                            <h3 className="text-brand-text font-black text-lg mb-3">{latestReview.title}</h3>
                            <p className="text-brand-muted font-medium leading-relaxed italic text-sm">"{latestReview.description}"</p>
                            <div className="mt-6 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-xs font-black text-brand-primary">HR</div>
                                <div>
                                    <p className="text-xs font-black text-brand-text uppercase tracking-widest">Admin / Manager</p>
                                    <p className="text-[10px] font-bold text-brand-muted mt-0.5">{latestReview.date}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-brand-muted font-bold italic text-sm">
                            No feedback available yet.
                        </div>
                    )}
                </div>

                {/* Performance History */}
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm">
                    <h2 className="text-xl font-black text-brand-text mb-6 flex items-center gap-3 uppercase tracking-tighter">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        Performance History
                    </h2>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                        {[...performanceData.reviews, ...performanceData.promotions, ...performanceData.warnings, ...performanceData.goals]
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((record: any) => (
                                <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-brand-bg transition-all border border-transparent hover:border-brand-border group">
                                    <div className={`p-2.5 rounded-xl transition-colors ${record.type === 'Review' ? 'bg-blue-500/10 text-blue-500' :
                                        record.type === 'Promotion' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-rose-500/10 text-rose-500'
                                        }`}>
                                        {record.type === 'Review' ? <TrendingUp className="w-5 h-5" /> :
                                            record.type === 'Promotion' ? <Award className="w-5 h-5" /> :
                                                <MessageSquare className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-brand-text font-black text-sm">{record.title}</h4>
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-1">{record.date}</p>
                                    </div>
                                    {record.rating && (
                                        <div className="text-brand-primary font-black flex items-center gap-1.5 bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10">
                                            <span className="text-sm">{record.rating}</span>
                                            <span className="text-xs opacity-50">★</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        {performanceData.reviews.length === 0 && performanceData.promotions.length === 0 && (
                            <div className="py-12 text-center text-brand-muted font-bold italic text-sm">
                                No history records found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeePerformance;
