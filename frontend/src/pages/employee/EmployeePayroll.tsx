import { useState, useEffect } from 'react';
import api from '../../api';
import { IndianRupee, Download, ShieldCheck, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EmployeePayroll = () => {
    const [salaryDetails, setSalaryDetails] = useState<any>(null);
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
            fetchPayrollData(user.id);
        }
    }, []);

    const fetchPayrollData = async (employeeId: string) => {
        setLoading(true);
        try {
            // 1. Fetch Salary Structure from Employee record
            const empRes = await api.get('/api/employees');
            const employees = await empRes.json();
            const employee = employees.find((e: any) => e.id === employeeId);

            // 2. Fetch Payroll History
            const payRes = await api.get('/api/payroll');
            const payrolls = await payRes.json();

            // Extract records for this employee
            const history = Array.isArray(payrolls) ? payrolls.map((p: any) => {
                const record = p.records.find((r: any) => r.employeeId === employeeId);
                if (record) {
                    return {
                        ...record,
                        month: p.month,
                        year: p.year,
                        dateGenerated: p.dateGenerated,
                        id: p.id
                    };
                }
                return null;
            }).filter(Boolean) : [];

            setPayrollHistory(history.reverse());

            // Set current month/basic from employee structure
            if (employee && employee.salary) {
                setSalaryDetails({
                    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                    basic: employee.salary.base || 0,
                    hra: employee.salary.hra || 0,
                    allowances: (employee.salary.transport || 0) + (employee.salary.other || 0),
                    deductions: 0, // Mocked for now
                    netSalary: (employee.salary.base || 0) + (employee.salary.hra || 0) + (employee.salary.transport || 0) + (employee.salary.other || 0),
                    status: history.length > 0 && history[0].month === new Date().toLocaleString('default', { month: 'long' }) ? 'Processed' : 'Draft'
                });
            }
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = (data: any) => {
        if (!data) return;

        const doc = new jsPDF();
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        // Header
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('FORGE INDIA CONNECT HRMS', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('PAYSLIP FOR ' + (data.month + ' ' + (data.year || '')).toUpperCase(), 105, 30, { align: 'center' });

        // Employee Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Employee Name: ' + (user?.name || 'N/A'), 15, 55);
        doc.text('Employee ID: ' + (user?.employeeId || user?.id || 'N/A'), 15, 62);
        doc.text('Designation: ' + (user?.role || 'Team Member'), 15, 69);
        doc.text('Date Generated: ' + new Date().toLocaleDateString(), 140, 55);

        // Salary Table
        autoTable(doc, {
            startY: 80,
            head: [['Component', 'Amount']],
            body: [
                ['Basic Pay', `INR ${data.basic?.toLocaleString() || (data.netSalary - (data.hra || 0) - (data.allowances || 0)).toLocaleString()}`],
                ['House Rent Allowance (HRA)', `INR ${data.hra?.toLocaleString() || '0'}`],
                ['Allowances', `INR ${data.allowances?.toLocaleString() || '0'}`],
                ['Deductions', `INR ${data.deductions?.toLocaleString() || '0'}`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
            columnStyles: { 1: { halign: 'right' } }
        });

        // Total Net Salary
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Net Salary: INR ' + data.netSalary.toLocaleString(), 195, finalY, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('This is a computer generated document and does not require a physical signature.', 105, 280, { align: 'center' });

        doc.save(`Payslip_${data.month}_${data.year || '2026'}.pdf`);
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-96 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary shadow-lg"></div>
            <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Decrypting Financials...</p>
        </div>
    );

    if (!salaryDetails) return (
        <div className="p-12 text-center bg-brand-surface rounded-[2.5rem] border border-brand-border border-dashed">
            <ShieldCheck className="w-12 h-12 text-brand-muted mx-auto mb-4 opacity-20" />
            <h3 className="text-brand-text font-black uppercase text-sm mb-2">No Records Found</h3>
            <p className="text-brand-muted text-xs italic">We couldn't locate any active payroll structures for your profile.</p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Payroll Hub</h1>
                <p className="text-brand-muted font-medium italic">Comprehensive oversight of your professional earnings and disbursements.</p>
            </div>

            {/* Main Overview Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Net Salary Card */}
                <div className="xl:col-span-2 relative group">
                    <div className="relative bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm overflow-hidden">
                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Active Period</span>
                                    <h2 className="text-brand-text text-xl font-black uppercase">{salaryDetails.month}</h2>
                                </div>
                                <div className="flex items-center gap-2 bg-status-approved/10 border border-status-approved/20 px-3 py-1.5 rounded-lg">
                                    <div className="w-2 h-2 rounded-full bg-status-approved"></div>
                                    <span className="text-status-approved text-[10px] font-black uppercase tracking-widest">{salaryDetails.status}</span>
                                </div>
                            </div>

                            <div className="py-4">
                                <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest">Net Payout</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-brand-text tracking-tighter tabular-nums">₹{salaryDetails.netSalary.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-brand-border">
                                <div className="space-y-1">
                                    <span className="text-brand-muted text-[9px] font-black uppercase tracking-widest">Base</span>
                                    <p className="text-brand-text text-sm font-bold">₹{salaryDetails.basic.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-brand-muted text-[9px] font-black uppercase tracking-widest">HRA</span>
                                    <p className="text-brand-text text-sm font-bold">₹{salaryDetails.hra.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-brand-muted text-[9px] font-black uppercase tracking-widest">Allowances</span>
                                    <p className="text-brand-text text-sm font-bold">₹{salaryDetails.allowances.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-status-rejected/60 text-[9px] font-black uppercase tracking-widest">Deductions</span>
                                    <p className="text-status-rejected text-sm font-bold">₹{salaryDetails.deductions.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Download Card */}
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="p-4 bg-brand-bg rounded-xl border border-brand-border shadow-inner">
                            <Receipt className="w-6 h-6 text-brand-primary mb-3" />
                            <h3 className="text-brand-text font-black uppercase text-xs mb-1">Authenticated Payslip</h3>
                            <p className="text-brand-muted text-[10px] font-medium italic">Digital certification for the current cycle.</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2.5 bg-brand-bg rounded-xl border border-brand-border">
                                <ShieldCheck className="w-4 h-4 text-status-approved" />
                                <span className="text-[10px] font-black text-brand-text uppercase tracking-widest">Bank Verified</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleDownloadPDF(salaryDetails)}
                        className="w-full mt-6 bg-brand-primary text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all active:scale-95 shadow-md shadow-brand-primary/20 uppercase tracking-widest text-xs"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Payment History Section */}
            <div className="space-y-6 mt-8">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight">Payment Archive</h2>
                    <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest px-2 py-0.5 bg-brand-surface border border-brand-border rounded-lg">History</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payrollHistory.map((item: any) => (
                        <div
                            key={item.id}
                            className="bg-brand-surface border border-brand-border rounded-2xl p-6 hover:border-brand-primary/30 transition-all group relative overflow-hidden shadow-sm"
                        >
                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 bg-brand-bg rounded-xl border border-brand-border">
                                        <IndianRupee className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <button 
                                        onClick={() => handleDownloadPDF(item)}
                                        className="p-2.5 hover:bg-brand-bg rounded-xl text-brand-muted hover:text-brand-primary transition-all active:scale-90 border border-transparent hover:border-brand-border"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>

                                <div>
                                    <h3 className="text-brand-text text-base font-black uppercase">{item.month}</h3>
                                    <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest block mb-4">{item.year}</span>

                                    <div className="flex items-baseline justify-between pt-2">
                                        <span className="text-xl font-black text-brand-text tabular-nums">₹{item.netSalary?.toLocaleString()}</span>
                                        <span className="text-[9px] font-black text-status-approved uppercase tracking-widest flex items-center gap-1 bg-status-approved/10 px-2 py-1 rounded-lg">
                                            Paid
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-brand-border/50 flex justify-between items-center text-[9px] font-bold text-brand-muted italic uppercase">
                                    <span>Credited On</span>
                                    <span className="text-brand-text not-italic font-black">{new Date(item.dateGenerated).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmployeePayroll;
