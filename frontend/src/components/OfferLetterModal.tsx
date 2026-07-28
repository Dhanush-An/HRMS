import React, { useState, useEffect, useRef } from 'react';
import { XCircle, Download, Printer, CheckCircle, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const OFFICIAL_LOGO_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/7QCEUGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAGgcAigAYkZCTUQwYTAwMGFiNzAxMDAwMGQwMDMwMDAwOWEwNTAwMDBlYTA2MDAwMDRlMDkwMDAwNzcwYjAwMDBlNDBlMDAwMDcyMGYwMDAwZDExMDAwMDA5ZjEyMDAwMDYxMTYwMDAwAP/bAIQABQYGCwgLCwsLCw0LCwsNDg4NDQ4ODw0ODg4NDxAQEBEREBAQEA8TEhMPEBETFBQTERMWFhYTFhUVFhkWGRYWEgEFBQUKBwoICQkICwgKCAsKCgkJCgoMCQoJCgkMDQsKCwsKCw0MCwsICwsMDAwNDQwMDQoLCg0MDQ0MExQTExOc/8IAEQgAyADIAwEiAAIRAQMRAf/EAIIAAQACAwEBAAAAAAAAAAAAAAAFBgIDBAEHEAABAgMDBwgIBQMFAAAAAAABAhEAAyEEEjEFICIwQVFhEBMUMnGBkaEzQEJScrHB0SNiguHwFVCSBmCy0vERAQABAwIFBAIDAQEBAAAAAAERACExQVEgYXGBoRAwkcGx8EDR8eFQYP/aAAw0AAreserved...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";

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

    // Download PDF handler: captures 3-page document cleanly and saves PDF file
    const handleDownloadPdf = async () => {
        if (!documentRef.current) return;
        setIsGeneratingPdf(true);

        const parentContainer = documentRef.current.parentElement;
        const prevOverflow = parentContainer?.style.overflowY || '';
        const prevMaxHeight = parentContainer?.style.maxHeight || '';

        try {
            if (parentContainer) {
                parentContainer.style.overflowY = 'visible';
                parentContainer.style.maxHeight = 'none';
            }

            const pages = documentRef.current.querySelectorAll('.offer-page');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            for (let i = 0; i < pages.length; i++) {
                const pageEl = pages[i] as HTMLElement;
                
                await new Promise((r) => setTimeout(r, 100));

                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: 0
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            const cleanFileName = `Offer_Letter_${empName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            
            // Binary Blob URL download trigger
            const pdfBlob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = cleanFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch (err) {
            console.error('Error generating PDF file:', err);
            alert('Failed to process PDF download. Please try using the Print button to Save as PDF.');
        } finally {
            if (parentContainer) {
                parentContainer.style.overflowY = prevOverflow;
                parentContainer.style.maxHeight = prevMaxHeight;
            }
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="offer-modal-overlay fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-2 md:p-6 overflow-y-auto no-scrollbar">
            <div className="offer-modal-content bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto animate-in zoom-in duration-200">
                {/* Top Action & Processing Bar */}
                <div className="offer-modal-header bg-slate-950 p-4 md:p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
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
                    <div className="offer-modal-statusbar bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                            <CheckCircle className="w-4 h-4" /> Offer Letter Ready & Processed
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                            Ref ID: {offerId}
                        </span>
                    </div>
                )}

                {/* Printable Document View Container */}
                <div className="offer-document-scroll p-4 md:p-8 max-h-[75vh] overflow-y-auto bg-slate-950 flex flex-col items-center gap-8 no-scrollbar">
                    <style>{`
                        .offer-page, .offer-page * {
                            font-family: Georgia, 'Times New Roman', Times, serif !important;
                        }
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 0;
                            }
                            html, body {
                                margin: 0 !important;
                                padding: 0 !important;
                                background: #ffffff !important;
                                height: auto !important;
                                overflow: visible !important;
                            }
                            body * {
                                visibility: hidden !important;
                            }
                            .offer-modal-overlay,
                            .offer-modal-overlay * {
                                visibility: visible !important;
                            }
                            .offer-modal-overlay {
                                position: absolute !important;
                                top: 0 !important;
                                left: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                                max-height: none !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                z-index: 999999 !important;
                                padding: 0 !important;
                                margin: 0 !important;
                            }
                            .offer-modal-content {
                                position: relative !important;
                                width: 100% !important;
                                height: auto !important;
                                max-height: none !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                border: none !important;
                                box-shadow: none !important;
                                border-radius: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            .offer-modal-header,
                            .offer-modal-statusbar {
                                display: none !important;
                            }
                            .offer-document-scroll {
                                position: relative !important;
                                max-height: none !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                gap: 0 !important;
                            }
                            .offer-page {
                                visibility: visible !important;
                                position: relative !important;
                                width: 210mm !important;
                                min-height: 297mm !important;
                                height: 297mm !important;
                                margin: 0 auto !important;
                                padding: 16mm !important;
                                box-shadow: none !important;
                                border: none !important;
                                page-break-after: always !important;
                                break-after: page !important;
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                                box-sizing: border-box !important;
                            }
                        }
                    `}</style>
                    <div ref={documentRef} className="flex flex-col gap-10 items-center w-full">
                        {/* ================= PAGE 1 ================= */}
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }} className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative text-[13px] leading-relaxed border border-slate-200">
                            <div>
                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <img src={OFFICIAL_LOGO_BASE64} alt="Forge India Logo" className="h-16 w-auto object-contain" />
                                        <div>
                                            <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                                FORGE INDIA
                                            </h1>
                                            <h2 className="text-xl font-black tracking-tight text-slate-800 -mt-1">
                                                CONNECT PVT LTD
                                            </h2>
                                            <p className="text-[9px] font-bold tracking-[0.2em] text-amber-600 uppercase mt-0.5">
                                                Connecting Talent With Opportunity
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right text-[9px] text-slate-600 space-y-0.5">
                                        <p className="font-bold text-slate-800">CORPORATE HEADQUARTERS:</p>
                                        <p>RK Towers, Rayakottai road, Opposite to HP Petrol Bunk,</p>
                                        <p>Wahab Nager, Krishnagiri-635002</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[9px] text-slate-600 mb-6 font-semibold">
                                    <span>CIN: U47G12TZ2025PTC035121</span>
                                    <span>GST: 33AAGCF4763Q1Z3</span>
                                    <span>MOB: +91 6369406416</span>
                                </div>

                                {/* Title Banner */}
                                <div className="text-center my-6">
                                    <div className="inline-block border-y-2 border-slate-900 py-1 px-8">
                                        <h2 className="text-2xl font-black tracking-[0.25em] text-slate-900">
                                            LETTER OF APPOINTMENT
                                        </h2>
                                    </div>
                                    <p className="text-[9px] font-bold tracking-[0.15em] text-slate-500 uppercase mt-1">
                                        Confidential Employment Document
                                    </p>
                                </div>

                                {/* Info Box Grid */}
                                <div className="grid grid-cols-2 gap-4 text-xs mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
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
                                    <p>Dear <span className="font-black uppercase">{empName}</span>,</p>
                                    <p>
                                        We are pleased to offer you the formal appointment for the position of{' '}
                                        <span className="font-black underline">{empRole}</span> in the{' '}
                                        <span className="font-bold italic">{empDept}</span> division at{' '}
                                        <span className="font-black">FORGE INDIA CONNECT PVT LTD</span>.
                                    </p>
                                </div>

                                {/* Section 1 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 1. COMPANY OVERVIEW & VISION
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-justify text-slate-800 text-xs leading-relaxed">
                                        <p>
                                            <span className="font-black">FORGE INDIA CONNECT PVT LTD</span> is a professionally driven and rapidly growing organization established with a clear vision of connecting talent with opportunity and supporting businesses with reliable and result-oriented solutions. Over the past five years, the company has steadily built its presence across multiple domains including Business Development, Staffing & Payroll Management. Our mission is to bridge the gap between human potential and industry requirements through innovation, ethics, and excellence.
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2 */}
                                <div className="space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 2. TERMS OF ENGAGEMENT
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-[12px] text-xs">
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
                            <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] text-slate-500 mt-6">
                                <a href="mailto:info@forgeindiaconnec.com" className="hover:underline font-bold text-indigo-700">info@forgeindiaconnec.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>RK Towers, Rayakottai road, Wahab Nager, Krishnagiri-635002</span>
                            </div>
                        </div>


                        {/* ================= PAGE 2 ================= */}
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }} className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative text-[13px] leading-relaxed border border-slate-200">
                            <div>
                                {/* Section 3 */}
                                <div className="mb-6 space-y-3">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 3. COMPENSATION & STRUCTURE
                                    </h3>

                                    <div className="border border-slate-900 rounded-xl overflow-hidden text-xs">
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
                                    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 text-center my-4">
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
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 4. JOB DESCRIPTION & RESPONSIBILITIES
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
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
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 5. PROBATIONARY PERIOD
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        You will undergo a <span className="font-black">Probation for three months</span>. Confirmation is performance-contingent. Management may extend probation if performance goals are not explicitly met.
                                    </div>
                                </div>

                                {/* Section 6 */}
                                <div className="space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 6. LEAVE & HOLIDAY ENTITLEMENT
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        You are entitled to 12 Sick/Casual leaves annually (01 per month). Public holidays apply as per the annual company schedule.
                                    </div>
                                </div>
                            </div>

                            {/* Footer Page 2 */}
                            <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] text-slate-500 mt-6">
                                <a href="mailto:info@forgeindiaconnec.com" className="hover:underline font-bold text-indigo-700">info@forgeindiaconnec.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>RK Towers, Rayakottai road, Wahab Nager, Krishnagiri-635002</span>
                            </div>
                        </div>


                        {/* ================= PAGE 3 ================= */}
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }} className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative text-[13px] leading-relaxed border border-slate-200">
                            <div>
                                {/* Section 7 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 7. CONFIDENTIALITY & NDA
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-800">
                                        "You shall maintain absolute secrecy of all organizational data, proprietary software, and client lists. Any breach will result in immediate termination and legal prosecution."
                                    </div>
                                </div>

                                {/* Section 8 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 8. NOTICE PERIOD & TERMINATION
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        Separation requires a formal <span className="font-black">Notice Period of 30 Days</span> or salary in lieu. Immediate termination applies for gross misconduct, fraud, or code of conduct violations.
                                    </div>
                                </div>

                                {/* Section 9 */}
                                <div className="mb-6 space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 9. SELECTION CONTINGENCIES
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        Engagement depends on clear Background Verification (BGV) reports. Any discrepancy in credentials will result in instant offer withdrawal.
                                    </div>
                                </div>

                                {/* Section 10 */}
                                <div className="mb-8 space-y-2">
                                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-4 bg-amber-500 inline-block"></span> 10. NON-SOLICITATION
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-800">
                                        "Upon cessation, you shall not solicit clients or employees of Forge India Connect for a period of one (01) year."
                                    </div>
                                </div>

                                {/* FINAL DECLARATION & ACCEPTANCE */}
                                <div className="border-t-2 border-slate-900 pt-6 mb-12">
                                    <h2 className="text-center text-lg font-black tracking-[0.2em] text-slate-900 mb-4">
                                        FINAL DECLARATION & ACCEPTANCE
                                    </h2>
                                    <p className="text-center italic text-xs text-slate-800">
                                        "I, <span className="font-black uppercase not-italic">{empName}</span>, acknowledge the receipt of this Appointment Letter and hereby accept all terms and conditions specified."
                                    </p>
                                </div>

                                {/* Signatures Area */}
                                <div className="grid grid-cols-2 gap-8 text-xs pt-4 mb-10">
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
                                <div className="border-2 border-dashed border-amber-500/60 rounded-2xl p-3 text-center bg-amber-500/5">
                                    <p className="text-amber-700 font-black text-xs uppercase tracking-[0.15em]">
                                        E-VERIFIABLE APPOINTMENT CONTRACT
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        FIC CORPORATE OPERATIONS UNIT
                                    </p>
                                </div>
                            </div>

                            {/* Footer Page 3 */}
                            <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] text-slate-500 mt-6">
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
