import { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Megaphone, Bell, Calendar, CheckCircle } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'Company' | 'HR' | 'Salary' | 'Holiday' | 'Personal';
    date: string;
}

const EmployeeAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch company announcements
            const response = await fetch(`${API_URL}/api/announcements`);
            const data = await response.json();

            // Mock Personal Notifications
            const personalNotifications: Announcement[] = [
                {
                    id: 'p1',
                    title: 'Leave Approved',
                    message: 'Your leave request for Feb 24th - Feb 25th has been approved by HR.',
                    type: 'Personal',
                    date: 'Today, 10:30 AM'
                },
                {
                    id: 'p2',
                    title: 'Salary Credited',
                    message: 'Your salary for the month of January 2026 has been credited to your account.',
                    type: 'Salary',
                    date: 'Feb 01, 2026'
                }
            ];

            // Merge and Sort (Mock sorting for now)
            setAnnouncements([...personalNotifications, ...data.reverse()]);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            // Fallback mock if API fails
            setAnnouncements([]);
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'Holiday': return 'bg-status-approved/10 text-status-approved border-status-approved/20';
            case 'HR': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'Salary': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Personal': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/20';
            default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Personal': return CheckCircle;
            case 'Salary': return Bell;
            default: return Megaphone;
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-brand-text mb-2 tracking-tight">Announcements</h1>
                    <p className="text-brand-muted font-medium italic opacity-80">Stay informed with the latest updates and alerts.</p>
                </div>
            </div>

            <div className="space-y-4 max-w-4xl">
                {announcements.length === 0 ? (
                    <div className="text-center py-16 bg-brand-surface rounded-[2.5rem] border border-brand-border shadow-sm">
                        <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-border opacity-50">
                            <Megaphone className="w-8 h-8 text-brand-muted" />
                        </div>
                        <p className="text-brand-muted font-black uppercase tracking-widest text-xs">No active announcements</p>
                    </div>
                ) : (
                    announcements.map((ann) => {
                        const Icon = getTypeIcon(ann.type);
                        const styles = getTypeStyles(ann.type);
                        return (
                            <div key={ann.id} className="bg-brand-surface border border-brand-border rounded-[2rem] p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-brand-primary/5 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border ${styles.split(' ').slice(0, 3).join(' ')} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                            <h3 className="text-lg font-black text-brand-text uppercase tracking-tight">{ann.title}</h3>
                                            <div className="flex items-center gap-2 group/date">
                                                <Calendar className="w-3.5 h-3.5 text-brand-muted group-hover/date:text-brand-primary transition-colors" />
                                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{ann.date}</span>
                                            </div>
                                        </div>

                                        <p className="text-brand-muted text-sm leading-relaxed font-medium italic mb-5">"{ann.message}"</p>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border shadow-sm ${styles}`}>
                                                {ann.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default EmployeeAnnouncements;
