import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XCircle, Download, Printer, CheckCircle, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { OFFICIAL_LOGO_BASE64 } from '../assets/logoBase64';

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
    workMode?: string;
    noticePeriod?: string;
    noticePeriodCondition?: string;
    shiftWindow?: string;
    trainingSalary?: number;
    engagementType?: 'Training' | 'Employment';
    salary?: {
        basic?: number;
        hra?: number;
        conveyance?: number;
        pf?: number;
        esi?: number;
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

    // Stable, deterministic offer ID per employee that never changes on re-renders
    const offerId = useMemo(() => {
        if (employee?.offerId) return employee.offerId;
        const empIdentifier = String(employee?.id || employee?.employeeId || employee?.name || '1000');
        let hash = 0;
        for (let i = 0; i < empIdentifier.length; i++) {
            hash = (hash * 31 + empIdentifier.charCodeAt(i)) % 9000;
        }
        const num = 1000 + Math.abs(hash);
        return `FIC/HR/AP/${new Date().getFullYear()}/${num}`;
    }, [employee]);

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
    const issueDate = employee.offerIssueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const joiningDate = employee.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const reportsTo = employee.reportsTo || 'TL';
    const workLocation = employee.workLocation || 'Bangalore (Onsite)';
    const noticePeriod = employee.noticePeriod || '30 Days';
    const noticePeriodCondition = employee.noticePeriodCondition || 'Separation requires a formal Notice Period of 30 Days or salary in lieu. Immediate termination applies for gross misconduct, fraud, or code of conduct violations.';
    const shiftWindow = employee.shiftWindow || '9:30 AM - 6:30 PM';
    const trainingSalary = employee.trainingSalary ?? 15000;

    const isTrainingMode = employee.engagementType === 'Training' ||
        (Boolean(empRole) && (
            empRole.toLowerCase().includes('trainee') ||
            empRole.toLowerCase().includes('intern') ||
            empRole.toLowerCase().includes('training')
        ));

    // Salary breakdown
    const basicMonthly = employee.salary?.basic || 7500;
    const hraMonthly = employee.salary?.hra || 3750;
    const convMonthly = employee.salary?.conveyance || 3750;
    const grossSalaryMonthly = basicMonthly + hraMonthly + convMonthly;

    const pfMonthly = employee.salary?.pf || 0;
    const esiMonthly = employee.salary?.esi || 0;
    const totalDeductionMonthly = pfMonthly + esiMonthly;

    const netMonthly = grossSalaryMonthly - totalDeductionMonthly;

    const basicAnnual = basicMonthly * 12;
    const hraAnnual = hraMonthly * 12;
    const convAnnual = convMonthly * 12;
    const grossSalaryAnnual = grossSalaryMonthly * 12;

    const pfAnnual = pfMonthly * 12;
    const esiAnnual = esiMonthly * 12;

    const netAnnual = (isTrainingMode ? (trainingSalary || netMonthly) : netMonthly) * 12;

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
    // Download PDF handler: captures 3-page document cleanly and saves PDF file
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
                await new Promise((r) => setTimeout(r, 100));

                const canvas = await html2canvas(pageEl, {
                    scale: 3,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    scrollX: 0,
                    scrollY: 0,
                });

                const imgData = canvas.toDataURL('image/png', 1.0);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            const cleanFileName = `Offer_Letter_${empName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            pdf.save(cleanFileName);
        } catch (err) {
            console.error('Error generating PDF file:', err);
            window.print();
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        if (!documentRef.current) {
            window.print();
            return;
        }

        // Create hidden iframe for dedicated clean printing of ONLY the offer letter pages
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = '0';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            window.print();
            return;
        }

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Appointment Letter - ${empName}</title>
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }
                        * {
                            box-sizing: border-box !important;
                            font-family: Georgia, 'Times New Roman', Times, serif !important;
                            -webkit-font-smoothing: antialiased !important;
                            text-rendering: optimizeLegibility !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            color: #0f172a !important;
                            width: 100% !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        div, p, span, table, th, td, tr, h1, h2, h3, h4, h5, h6 {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .printable-document {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                        }
                        .offer-page {
                            position: relative !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            min-height: 297mm !important;
                            max-height: 297mm !important;
                            margin: 0 auto !important;
                            padding: 16mm !important;
                            box-shadow: none !important;
                            border: none !important;
                            background: #ffffff !important;
                            color: #0f172a !important;
                            page-break-before: auto !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            box-sizing: border-box !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: space-between !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        img {
                            max-height: 64px !important;
                            width: auto !important;
                            object-fit: contain !important;
                        }
                    </style>
                </head>
                <body>
                    ${documentRef.current.innerHTML}
                </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('Iframe print error:', e);
                window.print();
            } finally {
                setTimeout(() => {
                    try {
                        document.body.removeChild(iframe);
                    } catch (_e) {}
                }, 2000);
            }
        }, 300);
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
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
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
                    <div className="offer-modal-statusbar bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
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
                                color: #0f172a !important;
                                width: 100% !important;
                                height: auto !important;
                                min-height: auto !important;
                                overflow: visible !important;
                            }
                            header, nav, aside, .offer-modal-header, .offer-modal-statusbar {
                                display: none !important;
                            }
                            .offer-modal-overlay {
                                position: static !important;
                                inset: auto !important;
                                width: 100% !important;
                                height: auto !important;
                                max-height: none !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                display: block !important;
                            }
                            .offer-modal-content {
                                position: static !important;
                                width: 100% !important;
                                height: auto !important;
                                max-height: none !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                box-shadow: none !important;
                                border: none !important;
                                border-radius: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                display: block !important;
                            }
                            .offer-modal-header,
                            .offer-modal-statusbar {
                                display: none !important;
                            }
                            .offer-document-scroll {
                                position: static !important;
                                width: 100% !important;
                                height: auto !important;
                                max-height: none !important;
                                overflow: visible !important;
                                background: #ffffff !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                display: block !important;
                            }
                            .printable-document {
                                position: static !important;
                                width: 100% !important;
                                height: auto !important;
                                overflow: visible !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                display: block !important;
                            }
                            .offer-page {
                                position: relative !important;
                                width: 210mm !important;
                                height: 297mm !important;
                                min-height: 297mm !important;
                                max-height: 297mm !important;
                                margin: 0 auto !important;
                                padding: 16mm !important;
                                box-shadow: none !important;
                                border: none !important;
                                background: #ffffff !important;
                                color: #0f172a !important;
                                page-break-before: auto !important;
                                page-break-after: always !important;
                                break-after: page !important;
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                                box-sizing: border-box !important;
                                display: flex !important;
                                flex-direction: column !important;
                                justify-content: space-between !important;
                            }
                        }
                    `}</style>
                    <div ref={documentRef} className="printable-document flex flex-col gap-10 items-center w-full">
                        {/* ================= PAGE 1 ================= */}
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif", backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', minHeight: '297mm', padding: '16mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', fontSize: '13px', lineHeight: 1.6, border: '1px solid #e2e8f0', boxSizing: 'border-box' }} className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative text-[13px] leading-relaxed border border-slate-200">
                            {/* Background Watermark */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', opacity: 0.09, pointerEvents: 'none', zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <img src={OFFICIAL_LOGO_BASE64} alt="Forge India Watermark" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                 {/* Header */}
                                <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px' }} className="border-b-2 border-slate-900 pb-2.5 mb-4">
                                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }} className="flex justify-between items-start">
                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }} className="flex items-center gap-4">
                                            <img src={OFFICIAL_LOGO_BASE64} alt="Forge India Logo" style={{ height: '64px', width: 'auto', maxHeight: '64px', objectFit: 'contain' }} className="h-16 w-auto object-contain" />
                                            <div>
                                                <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0, padding: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }} className="text-2xl font-black tracking-tight text-slate-900">
                                                    FORGE INDIA
                                                </h1>
                                                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', margin: 0, padding: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }} className="text-xl font-black tracking-tight text-slate-800 -mt-1">
                                                    CONNECT PVT LTD
                                                </h2>
                                                <p style={{ fontSize: '9px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '4px' }} className="text-[9px] font-bold tracking-[0.2em] text-amber-600 uppercase mt-0.5">
                                                    Connecting Talent With Opportunity
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '9px', color: '#475569', lineHeight: 1.4 }} className="text-right text-[9px] text-slate-600 space-y-0.5">
                                            <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }} className="font-bold text-slate-800">CORPORATE HEADQUARTERS:</p>
                                            <p style={{ margin: 0 }}>2nd floor, No 62, 11th Block, Marilingappa Extension,</p>
                                            <p style={{ margin: 0 }}>Nagarbhavi, Bengaluru, Karnataka 560072</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: 700, color: '#1e293b', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '10px', whiteSpace: 'nowrap' }} className="flex justify-between items-center text-[9px] font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2.5 whitespace-nowrap">
                                        <span style={{ whiteSpace: 'nowrap' }}>CIN: U47G12TZ2025PTC035121</span>
                                        <span style={{ whiteSpace: 'nowrap' }}>GST: 33AAGCF4763Q1Z3</span>
                                        <span style={{ whiteSpace: 'nowrap' }}>MOB: +91 6369406416</span>
                                    </div>
                                </div>

                                {/* Title Banner */}
                                <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }} className="text-center my-6">
                                    <div style={{ display: 'inline-block', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', paddingTop: '6px', paddingBottom: '6px', paddingLeft: '32px', paddingRight: '32px' }} className="inline-block border-y-2 border-slate-900 py-1 px-8">
                                        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.25em', margin: 0 }} className="text-2xl font-black tracking-[0.25em] text-slate-900">
                                            LETTER OF APPOINTMENT
                                        </h2>
                                    </div>
                                    <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '4px' }} className="text-[9px] font-bold tracking-[0.15em] text-slate-500 uppercase mt-1">
                                        Confidential Employment Document
                                    </p>
                                </div>

                                {/* Info Box Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px', marginBottom: '24px', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="grid grid-cols-2 gap-4 text-xs mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Employee Information:</p>
                                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', margin: 0 }} className="font-black text-base text-slate-900 uppercase">{empName}</h3>
                                        <p style={{ color: '#334155', fontWeight: 500, fontSize: '11px', marginTop: '4px', lineHeight: 1.3 }} className="text-slate-700 font-medium text-[11px] leading-tight mt-1">
                                            <span style={{ fontWeight: 700 }}>Address:</span> {empAddress}
                                        </p>
                                        <p style={{ color: '#334155', fontWeight: 500, fontSize: '11px', marginTop: '4px' }} className="text-slate-700 font-medium text-[11px] mt-1">
                                            <span style={{ fontWeight: 700 }}>Aadhar No:</span> {empAadhar}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }} className="text-right space-y-1">
                                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reference Details:</p>
                                        <p style={{ color: '#334155', margin: 0 }} className="text-slate-700"><span style={{ fontWeight: 700 }}>DATE OF ISSUE:</span> {issueDate}</p>
                                        <p style={{ color: '#334155', margin: '4px 0 0 0' }} className="text-slate-700"><span style={{ fontWeight: 700 }}>OFFER ID:</span> {offerId}</p>
                                        <p style={{ color: '#d97706', fontWeight: 700, fontSize: '11px', margin: '4px 0 0 0' }} className="text-amber-600 font-bold text-[11px]">Validity: 7 Days</p>
                                    </div>
                                </div>

                                {/* Salutation & Intro */}
                                <div style={{ marginBottom: '24px', lineHeight: 1.6 }} className="space-y-4 mb-6">
                                    <p style={{ marginBottom: '12px' }}>Dear <span style={{ fontWeight: 900, textTransform: 'uppercase' }} className="font-black uppercase">{empName}</span>,</p>
                                    <p style={{ margin: 0 }}>
                                        We are pleased to offer you the formal appointment for the position of{' '}
                                        <span style={{ fontWeight: 900, textDecoration: 'underline' }} className="font-black underline">{empRole}</span> in the{' '}
                                        <span style={{ fontWeight: 700, fontStyle: 'italic' }} className="font-bold italic">{empDept}</span> division at{' '}
                                        <span style={{ fontWeight: 900 }} className="font-black">FORGE INDIA CONNECT PVT LTD</span>.
                                    </p>
                                </div>

                                {/* Section 1 */}
                                <div style={{ marginBottom: '24px' }} className="mb-6 space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 1. COMPANY OVERVIEW & VISION
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'justify', color: '#1e293b', fontSize: '12px', lineHeight: 1.6, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-justify text-slate-800 text-xs leading-relaxed">
                                        <p style={{ margin: 0 }}>
                                            <span style={{ fontWeight: 900 }} className="font-black">FORGE INDIA CONNECT PVT LTD</span> is a professionally driven and rapidly growing organization established with a clear vision of connecting talent with opportunity and supporting businesses with reliable and result-oriented solutions. Over the past five years, the company has steadily built its presence across multiple domains including Business Development, Staffing & Payroll Management. Our mission is to bridge the gap between human potential and industry requirements through innovation, ethics, and excellence.
                                        </p>
                                    </div>
                                </div>

                                {/* Section 2 */}
                                <div style={{ marginBottom: '24px' }} className="space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 2. TERMS OF ENGAGEMENT
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-[12px] text-xs">
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Job Title:</p>
                                            <p style={{ fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }} className="font-black text-slate-900">{empRole}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Joining Date:</p>
                                            <p style={{ fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }} className="font-black text-slate-900">{joiningDate}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Type:</p>
                                            <p style={{ fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }} className="font-black text-slate-900">Full-Time</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Location (Mode):</p>
                                            <p style={{ fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }} className="font-black text-slate-900">{workLocation}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Reports To:</p>
                                            <p style={{ fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }} className="font-black text-slate-900">{reportsTo}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Shift Window:</p>
                                            <p style={{ fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }} className="font-black text-slate-900">{shiftWindow}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Page 1 */}
                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#64748b', marginTop: '24px', position: 'relative', zIndex: 1 }} className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] text-slate-500 mt-6">
                                <a href="mailto:infoblr@forgeindiaconnect.com" style={{ fontWeight: 700, color: '#4338ca', textDecoration: 'none' }} className="hover:underline font-bold text-indigo-700">infoblr@forgeindiaconnect.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none' }} className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>2nd floor, No 62, 11th Block, Marilingappa Ext, Nagarbhavi, Bengaluru - 560072</span>
                            </div>
                        </div>


                        {/* ================= PAGE 2 ================= */}
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif", backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', minHeight: '297mm', padding: '16mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', fontSize: '13px', lineHeight: 1.6, border: '1px solid #e2e8f0', boxSizing: 'border-box' }} className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative text-[13px] leading-relaxed border border-slate-200">
                            {/* Background Watermark */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', opacity: 0.09, pointerEvents: 'none', zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <img src={OFFICIAL_LOGO_BASE64} alt="Forge India Watermark" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {/* Section 3 */}
                                <div style={{ marginBottom: '14px' }} className="mb-3 space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 3. COMPENSATION & STRUCTURE
                                    </h3>

                                    <div style={{ border: '1px solid #0f172a', borderRadius: '12px', overflow: 'hidden', fontSize: '11px', marginBottom: '10px' }} className="border border-slate-900 rounded-xl overflow-hidden text-xs">
                                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }} className="w-full text-left border-collapse">
                                            <thead>
                                                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                                                    <th style={{ padding: '6px 10px', borderRight: '1px solid #334155' }} className="p-2 border-r border-slate-700">Remuneration Component</th>
                                                    <th style={{ padding: '6px 10px', borderRight: '1px solid #334155', textAlign: 'right' }} className="p-2 border-r border-slate-700 text-right">Monthly (INR)</th>
                                                    <th style={{ padding: '6px 10px', textAlign: 'right' }} className="p-2 text-right">Annual (INR)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 500 }} className="p-2 border-r border-slate-200 font-medium">Primary Basic Salary</td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }} className="p-2 border-r border-slate-200 text-right font-bold">{basicMonthly.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }} className="p-2 text-right font-bold">{basicAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 500 }} className="p-2 border-r border-slate-200 font-medium">House Rent Allowance (HRA)</td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }} className="p-2 border-r border-slate-200 text-right font-bold">{hraMonthly.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }} className="p-2 text-right font-bold">{hraAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 500 }} className="p-2 border-r border-slate-200 font-medium">Statutory Allowances (Med/Conv)</td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700 }} className="p-2 border-r border-slate-200 text-right font-bold">{convMonthly.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }} className="p-2 text-right font-bold">{convAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '2px solid #0f172a', backgroundColor: '#f8fafc', fontWeight: 900, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', color: '#0f172a', textTransform: 'uppercase' }} className="p-2 border-r border-slate-300 uppercase font-black">GROSS SALARY (TOTAL EARNINGS)</td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', color: '#0f172a' }} className="p-2 border-r border-slate-300 text-right font-black">INR {grossSalaryMonthly.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#0f172a' }} className="p-2 text-right font-black">INR {grossSalaryAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 500, color: '#dc2626' }} className="p-2 border-r border-slate-200 font-medium text-red-600">Less: Provident Fund (PF Deduction)</td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, color: '#dc2626' }} className="p-2 border-r border-slate-200 text-right font-bold text-red-600">- {pfMonthly.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }} className="p-2 text-right font-bold text-red-600">- {pfAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 500, color: '#dc2626' }} className="p-2 border-r border-slate-200 font-medium text-red-600">Less: Employee State Insurance (ESI)</td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, color: '#dc2626' }} className="p-2 border-r border-slate-200 text-right font-bold text-red-600">- {esiMonthly.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }} className="p-2 text-right font-bold text-red-600">- {esiAnnual.toLocaleString('en-IN')}</td>
                                                </tr>
                                                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-900 text-white font-black">
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #334155', textTransform: 'uppercase' }} className="p-2 border-r border-slate-700 uppercase">
                                                        {isTrainingMode ? 'NET STIPEND (TAKE HOME)' : 'NET SALARY (TAKE HOME)'}
                                                    </td>
                                                    <td style={{ padding: '6px 10px', borderRight: '1px solid #334155', textAlign: 'right' }} className="p-2 border-r border-slate-700 text-right">
                                                        INR {(isTrainingMode ? (trainingSalary || netMonthly) : netMonthly).toLocaleString('en-IN')}
                                                    </td>
                                                    <td style={{ padding: '6px 10px', textAlign: 'right' }} className="p-2 text-right">
                                                        INR {netAnnual.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Monthly Training or Employment Salary Highlight Box */}
                                    <div style={{ backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '14px', padding: '10px 16px', textAlign: 'center', marginTop: '10px', marginBottom: '10px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-3 text-center my-2">
                                        <p style={{ color: '#1e293b', fontWeight: 900, fontSize: '14px', margin: 0 }} className="text-slate-800 font-black text-sm">
                                            {isTrainingMode ? 'Monthly Training Period Stipend: ' : 'Monthly Net Take-Home Salary: '}
                                            <span style={{ color: '#030712', fontWeight: 900, fontSize: '18px' }} className="text-slate-950 font-black text-lg">
                                                INR {(isTrainingMode ? (trainingSalary || netMonthly) : netMonthly).toLocaleString('en-IN')}
                                            </span>
                                        </p>
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                            {isTrainingMode ? '(STIPEND AMOUNT DURING TRAINING PERIOD)' : '(AFTER STATUTORY DEDUCTIONS - PF & ESI)'}
                                        </p>
                                    </div>
                                </div>

                                {/* Section 4 */}
                                <div style={{ marginBottom: '12px' }} className="mb-3 space-y-1.5">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 4. JOB DESCRIPTION & RESPONSIBILITIES
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                                        {parsedResponsibilities.map((resp, idx) => (
                                            <div key={idx} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px', marginBottom: '4px' }} className="flex items-start gap-2.5">
                                                <span style={{ color: '#d97706', fontWeight: 900, fontSize: '13px', lineHeight: 1 }} className="text-amber-500 font-black text-sm leading-none mt-0.5">✓</span>
                                                <span style={{ color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }} className="text-slate-800 font-medium leading-relaxed">{resp}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 5 */}
                                <div style={{ marginBottom: '12px' }} className="mb-3 space-y-1.5">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 5. PROBATIONARY PERIOD
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800">
                                        You will undergo a <span style={{ fontWeight: 900 }} className="font-black">Probation for three months</span>. Confirmation is performance-contingent. Management may extend probation if performance goals are not explicitly met.
                                    </div>
                                </div>

                                {/* Section 6 */}
                                <div style={{ marginBottom: '12px' }} className="mb-3 space-y-1.5">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '6px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 6. LEAVE & HOLIDAY ENTITLEMENT
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800">
                                        You are entitled to 12 Sick/Casual leaves annually (01 per month). Public holidays apply as per the annual company schedule.
                                    </div>
                                </div>
                            </div>

                            {/* Footer Page 2 */}
                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#64748b', marginTop: '24px', position: 'relative', zIndex: 1 }} className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] text-slate-500 mt-6">
                                <a href="mailto:infoblr@forgeindiaconnect.com" style={{ fontWeight: 700, color: '#4338ca', textDecoration: 'none' }} className="hover:underline font-bold text-indigo-700">infoblr@forgeindiaconnect.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none' }} className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>2nd floor, No 62, 11th Block, Marilingappa Ext, Nagarbhavi, Bengaluru - 560072</span>
                            </div>
                        </div>


                        {/* ================= PAGE 3 ================= */}
                        <div style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif", backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', minHeight: '297mm', padding: '16mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', fontSize: '13px', lineHeight: 1.6, border: '1px solid #e2e8f0', boxSizing: 'border-box' }} className="offer-page bg-white text-slate-900 w-[210mm] min-h-[297mm] p-[16mm] shadow-2xl flex flex-col justify-between relative text-[13px] leading-relaxed border border-slate-200">
                            {/* Background Watermark */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', opacity: 0.09, pointerEvents: 'none', zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <img src={OFFICIAL_LOGO_BASE64} alt="Forge India Watermark" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {/* Section 7 */}
                                <div style={{ marginBottom: '24px' }} className="mb-6 space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 7. CONFIDENTIALITY & NDA
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', fontSize: '12px', fontStyle: 'italic', color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-800">
                                        "You shall maintain absolute secrecy of all organizational data, proprietary software, and client lists. Any breach will result in immediate termination and legal prosecution."
                                    </div>
                                </div>

                                {/* Section 8 */}
                                <div style={{ marginBottom: '24px' }} className="mb-6 space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 8. NOTICE PERIOD & TERMINATION
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        {noticePeriodCondition || (<>Separation requires a formal <span style={{ fontWeight: 900 }} className="font-black">Notice Period of {noticePeriod}</span> or salary in lieu. Immediate termination applies for gross misconduct, fraud, or code of conduct violations.</>)}
                                    </div>
                                </div>

                                {/* Section 9 */}
                                <div style={{ marginBottom: '24px' }} className="mb-6 space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 9. SELECTION CONTINGENCIES
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800">
                                        Engagement depends on clear Background Verification (BGV) reports. Any discrepancy in credentials will result in instant offer withdrawal.
                                    </div>
                                </div>

                                {/* Section 10 */}
                                <div style={{ marginBottom: '32px' }} className="mb-8 space-y-2">
                                    <h3 style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '0.05em', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }} className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <span style={{ width: '8px', height: '16px', backgroundColor: '#f59e0b', display: 'inline-block' }} className="w-2 h-4 bg-amber-500 inline-block"></span> 10. NON-SOLICITATION
                                    </h3>
                                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', fontSize: '12px', fontStyle: 'italic', color: '#1e293b', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs italic text-slate-800">
                                        "Upon cessation, you shall not solicit clients or employees of Forge India Connect for a period of one (01) year."
                                    </div>
                                </div>

                                {/* FINAL DECLARATION & ACCEPTANCE */}
                                <div style={{ borderTop: '2px solid #0f172a', paddingTop: '24px', marginBottom: '32px' }} className="border-t-2 border-slate-900 pt-6 mb-12">
                                    <h2 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 900, letterSpacing: '0.2em', color: '#0f172a', marginBottom: '16px' }} className="text-center text-lg font-black tracking-[0.2em] text-slate-900 mb-4">
                                        FINAL DECLARATION & ACCEPTANCE
                                    </h2>
                                    <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '12px', color: '#1e293b' }} className="text-center italic text-xs text-slate-800">
                                        "I, <span style={{ fontWeight: 900, textTransform: 'uppercase', fontStyle: 'normal' }} className="font-black uppercase not-italic">{empName}</span>, acknowledge the receipt of this Appointment Letter and hereby accept all terms and conditions specified."
                                    </p>
                                </div>

                                {/* Signatures Area */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', fontSize: '12px', paddingTop: '16px', marginBottom: '32px' }} className="grid grid-cols-2 gap-8 text-xs pt-4 mb-10">
                                    <div className="flex flex-col justify-end">
                                         <div style={{ marginBottom: '-10px', position: 'relative', zIndex: 10 }}>
                                             <img 
                                                 src="/dhanush_signature.png" 
                                                 alt="Dhanush Signature" 
                                                 style={{ height: '55px', objectFit: 'contain', mixBlendMode: 'multiply' }} 
                                             />
                                         </div>
                                         <p style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px', margin: 0 }} className="font-black text-slate-900 text-sm">MR. DHANUSH</p>
                                         <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0 0' }} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">HR MANAGER</p>
                                    </div>

                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} className="text-right flex flex-col justify-end">
                                        <div style={{ borderBottom: '1px solid #0f172a', paddingBottom: '4px', marginBottom: '4px' }} className="border-b border-slate-900 pb-1 mb-1">
                                            <p style={{ fontWeight: 900, color: '#0f172a', fontSize: '14px', textTransform: 'uppercase', margin: 0 }} className="font-black text-slate-900 text-sm uppercase">{empName}</p>
                                        </div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            ACCEPTING EMPLOYEE SIGNATURE
                                        </p>
                                    </div>
                                </div>

                                {/* Verifiable Badge */}
                                <div style={{ border: '2px dashed #f59e0b', borderRadius: '16px', padding: '12px', textAlign: 'center', backgroundColor: '#fffbeb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="border-2 border-dashed border-amber-500/60 rounded-2xl p-3 text-center bg-amber-500/5">
                                    <p style={{ color: '#b45309', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }} className="text-amber-700 font-black text-xs uppercase tracking-[0.15em]">
                                        E-VERIFIABLE APPOINTMENT CONTRACT
                                    </p>
                                    <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                        FIC CORPORATE OPERATIONS UNIT
                                    </p>
                                </div>
                            </div>

                            {/* Footer Page 3 */}
                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#64748b', marginTop: '24px', position: 'relative', zIndex: 1 }} className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] text-slate-500 mt-6">
                                <a href="mailto:infoblr@forgeindiaconnect.com" style={{ fontWeight: 700, color: '#4338ca', textDecoration: 'none' }} className="hover:underline font-bold text-indigo-700">infoblr@forgeindiaconnect.com</a>
                                <a href="http://www.forgeindiaconnect.com" target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none' }} className="hover:underline">www.forgeindiaconnect.com</a>
                                <span>2nd floor, No 62, 11th Block, Marilingappa Ext, Nagarbhavi, Bengaluru - 560072</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
