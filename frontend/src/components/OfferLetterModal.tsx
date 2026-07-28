import React, { useState, useEffect, useRef } from 'react';
import { XCircle, Download, Printer, CheckCircle, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/forge india logo.jpg';

interface EmployeeOfferData {
    id?: string;
    employeeId?: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    department: string;
    joiningDate: string;
    address?: string;
    aadharNo?: string;
    responsibilities?: string;
    offerId?: string;
    offerIssueDate?: string;
    reportsTo?: string;
    workLocation?: string;
    shiftWindow?: string;
    trainingSalary?: number;
    salary?: {
        basic?: number;
        hra?: number;
        conveyance?: number;
        medical?: number;
        special?: number;
        other?: number;
    };
}

interface OfferLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: EmployeeOfferData | null;
    isNewProcess?: boolean;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({
    isOpen,
    onClose,
    employee,
    isNewProcess = false
}) => {
    const [processStep, setProcessStep] = useState<number>(isNewProcess ? 0 : 3);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && isNewProcess) {
            setProcessStep(0);
            const timer1 = setTimeout(() => setProcessStep(1), 600);
            const timer2 = setTimeout(() => setProcessStep(2), 1400);
            const timer3 = setTimeout(() => setProcessStep(3), 2200);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        } else if (isOpen) {
            setProcessStep(3);
        }
    }, [isOpen, isNewProcess]);

    if (!isOpen || !employee) return null;

    const empName = employee.name || 'Employee Name';
    const empRole = employee.role || 'Junior AI Associate Developer';
    const empDept = employee.department || 'IT';
    const empAddress = employee.address || 'Address Not Provided';
    const empAadhar = employee.aadharNo || 'N/A';
    const offerId = employee.offerId || `FIC/HR/AP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = employee.offerIssueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const joiningDate = employee.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const reportsTo = employee.reportsTo || 'TL';
    const workLocation = employee.workLocation || 'Bangalore (Onsite)';
    const shiftWindow = employee.shiftWindow || '9:30 AM - 6:30 PM';
    const trainingSalary = employee.trainingSalary ?? 15000;

    // Salary breakdown
    const basicMonthly = employee.salary?.basic || 7500;
    const hraMonthly = employee.salary?.hra || 3750;
    const convMonthly = employee.salary?.conveyance || 3750;
    const grossMonthly = basicMonthly + hraMonthly + convMonthly;

    const basicAnnual = basicMonthly * 12;
    const hraAnnual = hraMonthly * 12;
    const convAnnual = convMonthly * 12;
    const grossAnnual = grossMonthly * 12;

    // Parse responsibilities
    const defaultResponsibilities = [
        "Develop, test, and maintain software applications and technical solutions.",
        "Integrate core application logic and backend APIs into user interfaces.",
        "Assist in building intelligent automation systems and software features.",
        "Support the development and deployment of technical models and systems.",
        "Work with data for cleaning, preprocessing, and system engineering.",
        "Evaluate application performance and optimize accuracy and efficiency."
    ];

    const parsedResponsibilities = employee.responsibilities
        ? employee.responsibilities.split('\n').map(s => s.trim()).filter(Boolean)
        : defaultResponsibilities;

    // Download PDF handler using html2canvas & jsPDF
    const handleDownloadPdf = async () => {
        if (!documentRef.current) return;
        setIsGeneratingPdf(true);
        try {
            const pages = documentRef.current.querySelectorAll('.offer-page');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i] as HTMLElement;
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            const cleanFileName = `Offer_Letter_${empName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            pdf.save(cleanFileName);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. You can also use the Print button to save as PDF.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-2 md:p-6 overflow-y-auto no-scrollbar">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto animate-in zoom-in duration-200">
                {/* Top Action & Processing Bar */}
                <div className="bg-slate-950 p-4 md:p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg tracking-tight">Appointment Letter</h3>
                            <p className="text-slate-400 text-xs font-semibold">FORGE INDIA CONNECT PVT LTD • {empName}</p>
                        </div>
                    </div>

                    {/* Progress Indicator if new process */}
                    {isNewProcess && processStep < 3 && (
                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                            <span className="text-xs font-bold text-slate-300">
                                {processStep === 0 && 'Saving Employee Record...'}
                                {processStep === 1 && 'Calculating Compensation & CTC...'}
                                {processStep === 2 && 'Generating Appointment Contract...'}
                            </span>
                        </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf || (isNewProcess && processStep < 3)}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                        >
                            {isGeneratingPdf ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" /> Download PDF
                                </>
                            )}
                        </button>

                        <button
                            onClick={handlePrint}
                            disabled={isNewProcess && processStep < 3}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>

                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"
                            title="Close"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Status Bar */}
                {processStep === 3 && (
                    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                            <CheckCircle className="w-4 h-4" /> Offer Letter Ready & Processed
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                            Ref ID: {offerId}
                        </span>
                    </div>
                )}

                {/* Printable Document View Container */}
                <div className="p-4 md:p-8 max-h-[75vh] overflow-y-auto bg-slate-950 flex flex-col items-center gap-8 no-scrollbar">
                    <div ref={documentRef} className="flex flex-col gap-10 items-center w-full">
                        {/* ================= PAGE 1 ================= */}
                        <div className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative font-serif text-[13px] leading-relaxed border border-slate-200">
                            <div>
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <img src={logo} alt="Forge India Logo" className="h-16 w-auto object-contain" />
                                        <div>
                                            <h1 className="text-2xl font-black font-sans tracking-tight text-slate-900">
                                                FORGE INDIA
                                            </h1>
                                            <h2 className="text-xl font-black font-sans tracking-tight text-slate-800 -mt-1">
                                                CONNECT PVT LTD
                                            </h2>
                                            <p className="text-[9px] font-sans font-bold tracking-[0.2em] text-amber-600 uppercase mt-0.5">
                                                Connecting Talent With Opportunity
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right font-sans text-[9px] text-slate-600 space-y-0.5">
                                        <p className="font-bold text-slate-800">CORPORATE HEADQUARTERS:</p>
                                        <p>RK Towers, Rayakottai road, Opposite to HP Petrol Bunk,</p>
                                        <p>Wahab Nager, Krishnagiri-635002</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center font-sans text-[9px] text-slate-600 mb-6 font-semibold">
                                    <span>CIN: U47G12TZ2025PTC035121</span>
                                    <span>GST: 33AAGCF4763Q1Z3</span>
                                    <span>MOB: +91 6369406416</span>
                                </div>

                                {/* Title Banner */}
                                <div className="text-center my-6">
                                    <div className="inline-block border-y-2 border-slate-900 py-1 px-8">
                                        <h2 className="text-2xl font-black font-sans tracking-[0.25em] text-slate-900">
                                            LETTER OF APPOINTMENT
                                        </h2>
                                    </div>
                                    <p className="text-[9px] font-sans font-bold tracking-[0.15em] text-slate-500 uppercase mt-1">
                                        Confidential Employment Document
                                    </p>
                                </div>

                                {/* Info Box Grid */}
                                <div className="grid grid-cols-2 gap-4 font-sans text-xs mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Employee Information:</p>
                                        <h3 className="font-black text-base text-slate-900 uppercase">{empName}</h3>
                                        <p className="text-slate-700 font-medium text-[11px] leading-tight mt-1">
                                            <span className="font-bold">Address:</span> {empAddress}
                                        </p>
                                        <p className="text-slate-700 font-medium text-[11px] mt-1">
                                            <span className="font-bold">Aadhar No:</span> {empAadhar}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reference Details:</p>
                                        <p className="text-slate-700"><span className="font-bold">DATE OF ISSUE:</span> {issueDate}</p>
                                        <p className="text-slate-700"><span className="font-bold">OFFER ID:</span> {offerId}</p>
                                        <p className="text-amber-600 font-bold text-[11px]">Validity: 7 Days</p>
                                    </div>
                                </div>

                                {/* Salutation & Intro */}
                                <div className="space-y-4 mb-6">
                                    <p>Dear <span className="font-black uppercase font-sans">{empName}</span>,</p>
                                    <p>
                                        We are pleased to offer you the formal appointment for the position of{' '}
                                        <span className="font-black underline font-sans">{empRole}</span> in the{' '}
                                        <span className="font-bold italic font-sans">{empDept}</span> division at{' '}
                                        <span className="font-black font-sans">FORGE INDIA CONNECT PVT LTD</span>.
                                    </p>
                                </div>

                                {/* Section 1 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 1. COMPANY OVERVIEW & VISION
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-justify text-slate-800 text-xs leading-relaxed">
                                        <p>
                                            <span className="font-black font-sans">FORGE INDIA CONNECT PVT LTD</span> is a professionally driven and rapidly growing organization established with a clear vision of connecting talent with opportunity and supporting businesses with reliable and result-oriented solutions. Over the past five years, the company has steadily built its presence across multiple domains including Business Development, Staffing & Payroll Management. Our mission is to bridge the gap between human potential and industry requirements through innovation, ethics, and excellence.
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2 */}
                                <div className="space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 2. TERMS OF ENGAGEMENT
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans grid grid-cols-2 gap-[12px] text-xs">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Job Title:</p>
                                            <p className="font-black text-slate-900">{empRole}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Joining Date:</p>
                                            <p className="font-black text-slate-900">{joiningDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type:</p>
                                            <p className="font-black text-slate-900">Full-Time</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location (Mode):</p>
                                            <p className="font-black text-slate-900">{workLocation}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reports To:</p>
                                            <p className="font-black text-slate-900">{reportsTo}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Shift Window:</p>
                                            <p className="font-black text-slate-900">{shiftWindow}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Page 1 */}
                            <div className="border-t border-slate-300 pt-3 flex justify-between items-center font-sans text-[9px] text-slate-500 mt-6">
                                <a href="mailto:info@forgeindiaconnec.com" className="hover:underline font-bold text-indigo-700">info@forgeindiaconnec.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>RK Towers, Rayakottai road, Wahab Nager, Krishnagiri-635002</span>
                            </div>
                        </div>


                        {/* ================= PAGE 2 ================= */}
                        <div className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative font-serif text-[13px] leading-relaxed border border-slate-200">
                            <div>
                                {/* Section 3 */}
                                <div className="mb-6 space-y-3">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 3. COMPENSATION & STRUCTURE
                                    </h3>

                                    <div className="border border-slate-900 rounded-xl overflow-hidden font-sans text-xs">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                                                    <th className="p-3 border-r border-slate-700">Remuneration Component</th>
                                                    <th className="p-3 border-r border-slate-700 text-right">Monthly (INR)</th>
                                                    <th className="p-3 text-right">Annual (INR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                <tr>
                                                    <td className="p-3 border-r border-slate-200 font-medium">Primary Basic Salary</td>
                                                    <td className="p-3 border-r border-slate-200 text-right font-bold">{basicMonthly.toLocaleString('en-IN')}</td>
                                                    <td className="p-3 text-right font-bold">{basicAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 border-r border-slate-200 font-medium">House Rent Allowance (HRA)</td>
                                                    <td className="p-3 border-r border-slate-200 text-right font-bold">{hraMonthly.toLocaleString('en-IN')}</td>
                                                    <td className="p-3 text-right font-bold">{hraAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-3 border-r border-slate-200 font-medium">Statutory Allowances (Med/Conv)</td>
                                                    <td className="p-3 border-r border-slate-200 text-right font-bold">{convMonthly.toLocaleString('en-IN')}</td>
                                                    <td className="p-3 text-right font-bold">{convAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr className="bg-slate-900 text-white font-black">
                                                    <td className="p-3 border-r border-slate-700 uppercase">GROSS COST TO COMPANY (CTC)</td>
                                                    <td className="p-3 border-r border-slate-700 text-right">INR {grossMonthly.toLocaleString('en-IN')}</td>
                                                    <td className="p-3 text-right">INR {grossAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Monthly Training Period Salary Highlight Box */}
                                    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 text-center my-4 font-sans">
                                        <p className="text-slate-800 font-black text-base">
                                            Monthly Training Period Salary: <span className="text-slate-950 font-black text-xl">INR {trainingSalary.toLocaleString('en-IN')}</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            (AFTER STATUTORY DEDUCTIONS)
                                        </p>
                                    </div>
                                </div>

                                {/* Section 4 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 4. JOB DESCRIPTION & RESPONSIBILITIES
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-xs space-y-2">
                                        {parsedResponsibilities.map((resp, idx) => (
                                            <div key={idx} className="flex items-start gap-2.5">
                                                <span className="text-amber-500 font-black text-sm leading-none mt-0.5">✓</span>
                                                <span className="text-slate-800 font-medium leading-relaxed">{resp}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 5 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 5. PROBATIONARY PERIOD
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        You will undergo a <span className="font-black font-sans">Probation for three months</span>. Confirmation is performance-contingent. Management may extend probation if performance goals are not explicitly met.
                                    </div>
                                </div>

                                {/* Section 6 */}
                                <div className="space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 6. LEAVE & HOLIDAY ENTITLEMENT
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        You are entitled to 12 Sick/Casual leaves annually (01 per month). Public holidays apply as per the annual company schedule.
                                    </div>
                                </div>
                            </div>

                            {/* Footer Page 2 */}
                            <div className="border-t border-slate-300 pt-3 flex justify-between items-center font-sans text-[9px] text-slate-500 mt-6">
                                <a href="mailto:info@forgeindiaconnec.com" className="hover:underline font-bold text-indigo-700">info@forgeindiaconnec.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>RK Towers, Rayakottai road, Wahab Nager, Krishnagiri-635002</span>
                            </div>
                        </div>


                        {/* ================= PAGE 3 ================= */}
                        <div className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative font-serif text-[13px] leading-relaxed border border-slate-200">
                            <div>
                                {/* Section 7 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 7. CONFIDENTIALITY & NDA
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-800">
                                        "You shall maintain absolute secrecy of all organizational data, proprietary software, and client lists. Any breach will result in immediate termination and legal prosecution."
                                    </div>
                                </div>

                                {/* Section 8 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 8. NOTICE PERIOD & TERMINATION
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        Separation requires a formal <span className="font-black font-sans">Notice Period of 30 Days</span> or salary in lieu. Immediate termination applies for gross misconduct, fraud, or code of conduct violations.
                                    </div>
                                </div>

                                {/* Section 9 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 9. SELECTION CONTINGENCIES
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        Engagement depends on clear Background Verification (BGV) reports. Any discrepancy in credentials will result in instant offer withdrawal.
                                    </div>
                                </div>

                                {/* Section 10 */}
                                <div className="mb-8 space-y-2">
                                    <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 10. NON-SOLICITATION
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-800">
                                        "Upon cessation, you shall not solicit clients or employees of Forge India Connect for a period of one (01) year."
                                    </div>
                                </div>

                                {/* FINAL DECLARATION & ACCEPTANCE */}
                                <div className="border-t-2 border-slate-900 pt-6 mb-12">
                                    <h2 className="text-center text-lg font-black font-sans tracking-[0.2em] text-slate-900 mb-4">
                                        FINAL DECLARATION & ACCEPTANCE
                                    </h2>
                                    <p className="text-center italic text-xs text-slate-800">
                                        "I, <span className="font-black uppercase font-sans font-not-italic">{empName}</span>, acknowledge the receipt of this Appointment Letter and hereby accept all terms and conditions specified."
                                    </p>
                                </div>

                                {/* Signatures Area */}
                                <div className="grid grid-cols-2 gap-8 font-sans text-xs pt-4 mb-10">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">MR. SANDEEP</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">CHIEF EXECUTIVE OFFICER</p>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">MR. AVINASH (MD)</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MANAGING DIRECTOR</p>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col justify-end">
                                        <div className="border-b border-slate-900 pb-1 mb-1">
                                            <p className="font-black text-slate-900 text-sm uppercase">{empName}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            ACCEPTING EMPLOYEE SIGNATURE
                                        </p>
                                    </div>
                                </div>

                                {/* Verifiable Badge */}
                                <div className="border-2 border-dashed border-amber-500/60 rounded-2xl p-3 text-center bg-amber-500/5 font-sans">
                                    <p className="text-amber-700 font-black text-xs uppercase tracking-[0.15em]">
                                        E-VERIFIABLE APPOINTMENT CONTRACT
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        FIC CORPORATE OPERATIONS UNIT
                                    </p>
                                </div>
                            </div>

                            {/* Footer Page 3 */}
                            <div className="border-t border-slate-300 pt-3 flex justify-between items-center font-sans text-[9px] text-slate-500 mt-6">
                                <a href="mailto:info@forgeindiaconnec.com" className="hover:underline font-bold text-indigo-700">info@forgeindiaconnec.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>RK Towers, Rayakottai road, Wahab Nager, Krishnagiri-635002</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
