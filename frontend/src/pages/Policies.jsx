import React from 'react';
import { Icons } from '../icons/Icons';

const Policies = () => {
    const policies = [
        {
            title: 'General Conduct',
            iconColor: 'purple',
            content: 'Antigraviity maintains a professional work environment where respect and collaboration are core values. Employees are expected to represent the company with integrity at all times.'
        },
        {
            title: 'Attendance & Punctuality',
            iconColor: 'indigo',
            content: 'Core working hours are 09:00 AM to 06:00 PM. Employees are required to clock in and out daily via the HRMS portal. Consistent punctuality is expected for all designated shifts.'
        },
        {
            title: 'Leave Policy',
            iconColor: 'pink',
            content: 'Leave requests should be submitted at least 48 hours in advance for planned absences. Sick leaves must be reported by 10 AM on the day of absence.'
        }
    ];

    return (
        <div className="animate-fade-in">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                {policies.map((policy, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50 flex flex-col h-full">
                        <div className={`w-14 h-14 bg-${policy.iconColor}-100 rounded-2xl flex items-center justify-center text-${policy.iconColor}-600 mb-6 shadow-inner`}>
                            <Icons.ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{policy.title}</h3>
                        <p className="text-gray-600 leading-relaxed flex-1">
                            {policy.content}
                        </p>
                        <button className={`mt-8 text-sm font-bold text-${policy.iconColor}-600 hover:underline uppercase tracking-wide`}>
                            Download PDF
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-3xl font-bold mb-2">Need Clarification?</h3>
                        <p className="text-purple-100 text-lg">If you have questions regarding any policy, please reach out to the HR department.</p>
                    </div>
                    <button className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-gray-50 transition-all transform hover:scale-105">
                        Contact HR Support
                    </button>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
            </div>
        </div>
    );
};

export default Policies;
