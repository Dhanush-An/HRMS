import { useState, useEffect } from 'react';
import { Book, ShieldCheck, Clock, CheckCircle, Info } from 'lucide-react';
import api from '../../api';

interface Policy {
    id: number;
    title: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    lastUpdated: string;
}

const ICON_MAP: Record<string, any> = {
    ShieldCheck,
    Clock,
    CheckCircle,
    Book,
    Info
};

const CompanyPolicies = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const response = await api.get('/api/policies');
            const data = await response.json();
            setPolicies(data);
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-brand-text mb-2 tracking-tight">Company Policies</h1>
                <p className="text-brand-muted font-medium italic opacity-80">Official guidelines and standards for institutional excellence.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {policies.map((policy) => {
                    const Icon = ICON_MAP[policy.icon] || Info;
                    return (
                        <div key={policy.id} className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 flex items-start gap-8 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className={`p-5 rounded-2xl ${policy.bgColor} border ${policy.borderColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <Icon className={`w-10 h-10 ${policy.color}`} />
                            </div>

                            <div className="flex-1 relative z-10">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                                    <h3 className="text-xl font-black text-brand-text uppercase tracking-tight group-hover:text-brand-primary transition-colors">{policy.title}</h3>
                                    <span className="text-[10px] font-black text-brand-muted bg-brand-bg px-4 py-1.5 rounded-full border border-brand-border uppercase tracking-[0.2em] shadow-inner">Updated: {policy.lastUpdated}</span>
                                </div>
                                <p className="text-brand-muted font-medium leading-relaxed italic opacity-85">"{policy.description}"</p>
                            </div>

                            <div className="self-center px-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl border border-brand-border flex items-center justify-center bg-brand-bg text-brand-muted group-hover:border-brand-primary group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-all duration-300 shadow-sm overflow-hidden">
                                    <div className="group-hover:translate-x-1 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {policies.length === 0 && !loading && (
                    <div className="text-center py-20 bg-brand-bg border border-brand-border border-dashed rounded-[2.5rem]">
                        <p className="text-brand-muted font-bold italic">No institutional policies have been published yet.</p>
                    </div>
                )}
                {loading && (
                    <div className="text-center py-20 animate-pulse">
                        <p className="text-brand-muted font-bold tracking-widest uppercase text-xs">Syncing institutional records...</p>
                    </div>
                )}
            </div>

            <div className="mt-12 p-8 rounded-[2.5rem] bg-brand-bg border border-brand-border border-dashed text-center">
                <p className="text-brand-muted font-bold text-sm italic">Need clarification? Contact our HR Compliance Team.</p>
            </div>
        </div>
    );
};

export default CompanyPolicies;
