import { Book, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

const CompanyPolicies = () => {
    const policies = [
        {
            id: 1,
            title: 'Code of Conduct',
            description: 'Guidelines on professional behavior, workplace ethics, and compliance with company values.',
            icon: ShieldCheck,
            color: 'text-brand-primary',
            bgColor: 'bg-brand-primary/10',
            borderColor: 'border-brand-primary/20',
            lastUpdated: 'Jan 2026'
        },
        {
            id: 2,
            title: 'Leave Policy',
            description: 'Details on annual leave, sick leave, compassionate leave, and holiday entitlement.',
            icon: Clock,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            lastUpdated: 'Dec 2025'
        },
        {
            id: 3,
            title: 'Remote Work Policy',
            description: 'Rules and expectations for working from home or remote locations securely.',
            icon: CheckCircle,
            color: 'text-status-approved',
            bgColor: 'bg-status-approved/10',
            borderColor: 'border-status-approved/20',
            lastUpdated: 'Nov 2025'
        },
        {
            id: 4,
            title: 'IT & Security Policy',
            description: 'Protocols for data security, device usage, and internet safety within the organization.',
            icon: Book,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            lastUpdated: 'Jan 2026'
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-brand-text mb-2 tracking-tight">Company Policies</h1>
                <p className="text-brand-muted font-medium italic opacity-80">Official guidelines and standards for institutional excellence.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {policies.map((policy) => (
                    <div key={policy.id} className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 flex items-start gap-8 hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className={`p-5 rounded-2xl ${policy.bgColor} border ${policy.borderColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            <policy.icon className={`w-10 h-10 ${policy.color}`} />
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
                ))}
            </div>

            <div className="mt-12 p-8 rounded-[2.5rem] bg-brand-bg border border-brand-border border-dashed text-center">
                <p className="text-brand-muted font-bold text-sm italic">Need clarification? Contact our HR Compliance Team.</p>
            </div>
        </div>
    );
};

export default CompanyPolicies;
