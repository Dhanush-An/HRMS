import { useState, useEffect } from 'react';
import { FileText, Download, FileCheck, Shield, Upload, X, AlertCircle } from 'lucide-react';
import api from '../../api';

interface DocumentParams {
    id: string;
    title: string;
    type: string;
    uploadDate?: string;
    status: 'Pending' | 'Uploaded';
    url?: string;
    size?: string;
}

const EmployeeDocuments = () => {
    // List of required documents
    const requiredDocs = [
        "10th Certificate",
        "11th Certificate",
        "12th Certificate",
        "Provisional Certificate",
        "Consolidated Marksheet",
        "Course Certificate",
        "Internship Certificate",
        "Aadhar Card",
        "PAN Card",
        "Bank Passbook",
        "PF Account",
        "Offer Letter Acceptance",
        "Experience Letter"
    ];

    // Initialize state with required docs, all pending initially (or fetch from API)
    const [documents, setDocuments] = useState<DocumentParams[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<string>('');
    const [uploadData, setUploadData] = useState({ file: null as File | null });

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const fetchDocuments = async () => {
        if (!user?.id) return;
        try {
            const response = await api.get(`/api/documents?employeeId=${user.id}`);
            const apiDocs = await response.json();

            // Merge required docs with uploaded ones
            const mergedDocs: DocumentParams[] = requiredDocs.map((title, index) => {
                const uploaded = Array.isArray(apiDocs) ? apiDocs.find((d: any) => d.type === title) : null;
                return {
                    id: uploaded?.id || `req-${index}`,
                    title: title,
                    type: title,
                    status: uploaded ? 'Uploaded' : 'Pending',
                    uploadDate: uploaded?.uploadDate || undefined,
                    url: uploaded?.fileUrl || uploaded?.url || undefined
                };
            });
            setDocuments(mergedDocs);
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDocuments();
        }
    }, [user?.id]);

    const handleOpenUpload = (docType: string) => {
        setSelectedDocType(docType);
        setUploadData({ file: null });
        setShowUploadModal(true);
    };

    const handleDownload = (doc: DocumentParams) => {
        if (doc.url) {
            const link = document.createElement('a');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const fullUrl = doc.url.startsWith('http') ? doc.url : `${baseUrl}${doc.url}`;
            link.href = fullUrl;
            link.setAttribute('download', `${doc.title}.pdf`); // Attempt to force download
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.warn("Document URL not found.");
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !uploadData.file) return;

        try {
            const formData = new FormData();
            formData.append('title', selectedDocType);
            formData.append('type', selectedDocType);
            formData.append('employeeId', user.id);
            formData.append('uploadedBy', user.name);
            formData.append('file', uploadData.file);

            // Use fetch directly for FormData or update api.post if it supports it
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                await fetchDocuments();
                setShowUploadModal(false);
            } else {
                const err = await response.json();
                alert(`Upload failed: ${err.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("An error occurred during upload.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-brand-text mb-2 tracking-tight">My Documents</h1>
                    <p className="text-brand-muted font-medium italic opacity-80">Manage and verify your professional records.</p>
                </div>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] overflow-hidden shadow-sm shadow-brand-primary/5">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full">
                        <thead className="bg-table-header border-b border-brand-border">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Document Name</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Verification Date</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-brand-bg/40 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-2xl border transition-all duration-300 group-hover:scale-110 ${doc.status === 'Uploaded'
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                                : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'}`}>
                                                {doc.status === 'Uploaded' ? (
                                                    <FileCheck className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-brand-text font-black text-sm uppercase tracking-tight">{doc.title}</div>
                                                <div className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mt-1 opacity-70 italic">{doc.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <span className={`px-4 py-1.5 inline-flex text-[10px] leading-5 font-black rounded-full border uppercase tracking-widest shadow-sm ${doc.status === 'Uploaded'
                                            ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'
                                            : 'bg-amber-500/5 text-amber-600 border-amber-500/20 animate-pulse'
                                            }`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-brand-muted uppercase tracking-tighter italic">
                                        {doc.uploadDate || 'Pending Submission'}
                                    </td>
                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                        {doc.status === 'Uploaded' ? (
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="bg-brand-bg text-brand-muted hover:bg-emerald-500 hover:text-white p-2.5 rounded-xl border border-brand-border hover:border-emerald-500 transition-all active:scale-95 shadow-sm"
                                                title="Secure Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenUpload(doc.title)}
                                                className="bg-brand-primary text-white hover:opacity-90 px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 ml-auto shadow-lg shadow-brand-primary/20 text-[10px] font-black uppercase tracking-widest border-t border-white/20"
                                            >
                                                <span>Upload</span>
                                                <Upload className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] w-full max-w-md p-8 shadow-[0_32px_128px_rgba(0,0,0,0.4)] relative group/modal max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-brand-text tracking-tight uppercase">Upload File</h2>
                                <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em]">Secure Document Verification</p>
                            </div>
                            <button onClick={() => setShowUploadModal(false)} className="w-10 h-10 flex items-center justify-center text-brand-muted hover:bg-brand-bg hover:text-brand-primary rounded-2xl transition-all active:scale-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-8 p-5 bg-brand-primary/5 border border-brand-primary/10 rounded-[1.5rem] flex items-start gap-4 shadow-inner">
                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-brand-text font-black uppercase tracking-tight">Active Requirement</p>
                                <p className="text-[10px] text-brand-muted font-bold mt-1 uppercase tracking-widest italic">{selectedDocType}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-4 border-dashed border-brand-bg rounded-[2rem] p-10 text-center hover:border-brand-primary/30 transition-all cursor-pointer relative group bg-brand-surface shadow-inner">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => setUploadData({ file: e.target.files ? e.target.files[0] : null })}
                                    required
                                />
                                <div className="group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-16 h-16 bg-brand-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-primary/10">
                                        <Upload className="w-8 h-8 text-brand-primary group-hover:text-brand-primary/80 transition-colors" />
                                    </div>
                                </div>
                                <p className="text-brand-text text-sm font-black uppercase tracking-tight">{uploadData.file ? uploadData.file.name : "Select Document"}</p>
                                <p className="text-brand-muted text-[10px] font-bold mt-2 uppercase tracking-widest italic opacity-60">PDF, JPG, or PNG (Max 10MB)</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 py-4 bg-brand-bg text-brand-muted rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest border border-brand-border hover:bg-brand-surface transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-brand-primary text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/30 border-t border-white/20"
                                >
                                    <Upload className="w-4 h-4" />
                                    Deploy File
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Secure Info Section */}
            <div className="mt-8 p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 flex items-start gap-6 shadow-sm">
                <div className="p-4 bg-brand-surface rounded-2xl border border-emerald-500/20 shadow-sm transition-transform hover:scale-110">
                    <Shield className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-brand-text mb-2 uppercase tracking-tight">Enterprise Protocol Storage</h3>
                    <p className="text-brand-muted text-sm leading-relaxed max-w-2xl font-medium italic opacity-80">
                        Sensitive data is encrypted with AES-256 standards. Our secure vault architecture ensures that your personal records are only accessible to authorized HR verification systems.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDocuments;
