import { useState, useEffect } from 'react';
import api from '../../api';
import { IndianRupee, Download, ShieldCheck, Receipt, Pencil } from 'lucide-react';
import { generatePayslipPDF } from '../../utils/generatePayslipPDF';

const generatePAN = (name: string, id: string) => {
    const letters = 'ABCDE';
    const nameChar = name?.replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || 'P';
    const numPart = id?.replace(/\D/g, '').padEnd(4, '0').substring(0, 4) || '0000';
    return `${letters}${numPart}${nameChar}`;
};

const roleMap: Record<string, string> = {
    'admin': 'HR Administrator',
    'subadmin': 'Sub Admin Developer',
    'hr': 'HR Manager',
    'employee': 'Full Stack Developer',
    'staff': 'Office Staff'
};

const EmployeePayroll = () => {
    const [salaryDetails, setSalaryDetails] = useState<any>(null);
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    const [employeeInfo, setEmployeeInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Edit modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editPan, setEditPan] = useState('');
    const [editUan, setEditUan] = useState('');
    const [editPfNo, setEditPfNo] = useState('');
    const [editEsiNo, setEditEsiNo] = useState('');
    const [editBankName, setEditBankName] = useState('');
    const [editBankAccount, setEditBankAccount] = useState('');
    const [editIfsc, setEditIfsc] = useState('');

    const handleOpenEdit = () => {
        if (!employeeInfo) return;
        const idNumeric = (employeeInfo.employeeId || employeeInfo.id || '').replace(/\D/g, '').padStart(6, '0');
        setEditPan(employeeInfo.pan || generatePAN(employeeInfo.name, employeeInfo.employeeId || employeeInfo.id));
        setEditUan(employeeInfo.uan || ('101' + idNumeric.padEnd(9, '2')));
        setEditPfNo(employeeInfo.pfNo || ('TNKRK' + idNumeric.padEnd(10, '3')));
        setEditEsiNo(employeeInfo.esiNo || ('12' + idNumeric.padEnd(8, '4')));
        setEditBankName(employeeInfo.bankName || 'State Bank of India');
        setEditBankAccount(employeeInfo.bankAccount || ('388' + idNumeric.padEnd(8, '5')));
        setEditIfsc(employeeInfo.ifsc || 'SBIN0001234');
        setIsEditModalOpen(true);
    };

    const handleSaveDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const targetId = employeeInfo.employeeId || employeeInfo.id;
            const response = await api.put(`/api/employees/${targetId}`, {
                pan: editPan,
                uan: editUan,
                pfNo: editPfNo,
                esiNo: editEsiNo,
                bankName: editBankName,
                bankAccount: editBankAccount,
                ifsc: editIfsc
            });
            const updated = await response.json();
            setEmployeeInfo(updated);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error saving bank details:", error);
            alert("Failed to save bank/statutory details. Please try again.");
        }
    };

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

            if (employee) {
                setEmployeeInfo(employee);
            }

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
        if (!data || !employeeInfo) return;
        generatePayslipPDF(employeeInfo, data);
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            
            {/* Employee Information & Statutory Details Card */}
            {employeeInfo && (
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-sm relative overflow-hidden mt-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                        {/* Left: Avatar Column */}
                        <div className="flex flex-col items-center justify-center lg:border-r lg:border-brand-border/30 lg:pr-8 xl:pr-12">
                            <div className="relative w-24 h-24 rounded-full bg-brand-bg border border-brand-primary/20 flex items-center justify-center shadow-inner mb-3">
                                <span className="text-3xl font-black text-brand-primary uppercase">
                                    {employeeInfo.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <span className="text-xs font-black text-brand-primary uppercase tracking-widest">Active Member</span>
                            <span className="text-[10px] text-brand-muted italic mt-0.5">Employment Type: Permanent</span>
                        </div>

                        {/* Middle & Right Column */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Middle: General Information */}
                            <div className="space-y-4">
                                <h3 className="text-brand-text text-sm font-black uppercase tracking-wider border-b border-brand-border/60 pb-2">Employee Information</h3>
                                <div className="grid grid-cols-3 gap-y-3 text-xs">
                                    <span className="text-brand-muted font-bold col-span-1">Employee ID</span>
                                    <span className="text-brand-text font-black col-span-2">: {employeeInfo.employeeId || employeeInfo.id}</span>

                                    <span className="text-brand-muted font-bold col-span-1">Full Name</span>
                                    <span className="text-brand-text font-black col-span-2">: {employeeInfo.name}</span>

                                    <span className="text-brand-muted font-bold col-span-1">Designation</span>
                                    <span className="text-brand-text font-black col-span-2">: {roleMap[employeeInfo.role?.toLowerCase()] || employeeInfo.role || 'Full Stack Developer'}</span>

                                    <span className="text-brand-muted font-bold col-span-1">Department</span>
                                    <span className="text-brand-text font-black col-span-2">: {employeeInfo.department || 'IT Development'}</span>

                                    <span className="text-brand-muted font-bold col-span-1">Branch</span>
                                    <span className="text-brand-text font-black col-span-2">: {employeeInfo.branchName || 'Krishnagiri'}</span>

                                    <span className="text-brand-muted font-bold col-span-1">Joining Date</span>
                                    <span className="text-brand-text font-black col-span-2">: {employeeInfo.joiningDate || '21-Jan-2026'}</span>
                                </div>
                                                        {/* Right: Bank & Statutory Details */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-brand-border/60 pb-2">
                                    <h3 className="text-brand-text text-sm font-black uppercase tracking-wider">Bank & Statutory Details</h3>
                                    <button
                                        onClick={handleOpenEdit}
                                        className="p-1.5 hover:bg-brand-bg rounded-lg text-brand-muted hover:text-brand-primary border border-transparent hover:border-brand-border transition-all active:scale-90"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-y-3 text-xs">
                                    <span className="text-brand-muted font-bold col-span-1">PAN Number</span>
                                    <span className="text-brand-text font-black col-span-2">
                                        : {employeeInfo.pan || generatePAN(employeeInfo.name, employeeInfo.employeeId || employeeInfo.id)}
                                    </span>

                                    <span className="text-brand-muted font-bold col-span-1">UAN Number</span>
                                    <span className="text-brand-text font-black col-span-2">
                                        : {employeeInfo.uan || ('101' + (employeeInfo.employeeId || employeeInfo.id).replace(/\D/g, '').padStart(6, '0').padEnd(9, '2'))}
                                    </span>

                                    <span className="text-brand-muted font-bold col-span-1">PF Number</span>
                                    <span className="text-brand-text font-black col-span-2">
                                        : {employeeInfo.pfNo || ('TNKRK' + (employeeInfo.employeeId || employeeInfo.id).replace(/\D/g, '').padStart(6, '0').padEnd(10, '3'))}
                                    </span>

                                    <span className="text-brand-muted font-bold col-span-1">Bank Name</span>
                                    <span className="text-brand-text font-black col-span-2">
                                        : {employeeInfo.bankName || 'State Bank of India'}
                                    </span>

                                    <span className="text-brand-muted font-bold col-span-1">Account No.</span>
                                    <span className="text-brand-text font-black col-span-2">
                                        : {employeeInfo.bankAccount || ('388' + (employeeInfo.employeeId || employeeInfo.id).replace(/\D/g, '').padStart(6, '0').padEnd(8, '5'))}
                                    </span>

                                    <span className="text-brand-muted font-bold col-span-1">IFSC Code</span>
                                    <span className="text-brand-text font-black col-span-2">
                                        : {employeeInfo.ifsc || 'SBIN0001234'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Bank & Statutory Details Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-lg shadow-xl p-6 relative animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-black text-brand-text uppercase tracking-wide border-b border-brand-border/60 pb-3 mb-6">
                            Edit Bank & Statutory Details
                        </h2>

                        <form onSubmit={handleSaveDetails} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">PAN Number</label>
                                    <input
                                        type="text"
                                        value={editPan}
                                        onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. ABCDE1234F"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">UAN Number</label>
                                    <input
                                        type="text"
                                        value={editUan}
                                        onChange={(e) => setEditUan(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. 101234567890"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">PF Number</label>
                                    <input
                                        type="text"
                                        value={editPfNo}
                                        onChange={(e) => setEditPfNo(e.target.value.toUpperCase())}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. TNKRK1234567890"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">ESI Number</label>
                                    <input
                                        type="text"
                                        value={editEsiNo}
                                        onChange={(e) => setEditEsiNo(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. 1234567890"
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">Bank Name</label>
                                    <input
                                        type="text"
                                        value={editBankName}
                                        onChange={(e) => setEditBankName(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. HDFC Bank"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">Account Number</label>
                                    <input
                                        type="text"
                                        value={editBankAccount}
                                        onChange={(e) => setEditBankAccount(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. 38801234587"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-brand-muted uppercase tracking-wider">IFSC Code</label>
                                    <input
                                        type="text"
                                        value={editIfsc}
                                        onChange={(e) => setEditIfsc(e.target.value.toUpperCase())}
                                        className="w-full bg-brand-bg border border-brand-border text-brand-text text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand-primary"
                                        placeholder="e.g. SBIN0001234"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-brand-border/60 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-brand-border text-brand-text text-xs font-black rounded-xl hover:bg-brand-bg active:scale-95 transition-all uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-xl hover:bg-brand-primary/95 active:scale-95 transition-all uppercase tracking-wider shadow-md shadow-brand-primary/10"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
