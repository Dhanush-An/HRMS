import { useState, useEffect } from 'react';
import { FileText, Download, Search, File, ChevronRight, Upload, Users, Camera, Eye } from 'lucide-react';
import api from '../../api';
import EmployeeDocuments from '../employee/EmployeeDocuments';

interface Document {
    id: string;
    title: string;
    type: string;
    url: string;
    uploadDate: string;
    uploadedBy: string;
    employeeId?: string; // Link to employee
}

interface DocumentsProps {
    defaultTab?: 'employees' | 'my-documents';
}

const Documents: React.FC<DocumentsProps> = ({ defaultTab = 'employees' }) => {
    const [activeTab, setActiveTab] = useState<'employees' | 'my-documents'>(defaultTab);
    const [view, setView] = useState<'list' | 'details'>('list');
    const [employees, setEmployees] = useState<any[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            const [empRes, docRes] = await Promise.all([
                api.get('/api/employees?all=true'),
                api.get('/api/documents')
            ]);
            setEmployees(await empRes.json());
            setDocuments(await docRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const isDocForEmployee = (doc: Document, emp: any) => {
        if (!doc || !emp) return false;
        const empId = emp.employeeId || emp.id || emp._id?.toString();
        const docEmpId = doc.employeeId;
        return (
            docEmpId === emp.employeeId ||
            docEmpId === emp.id ||
            docEmpId === emp._id?.toString() ||
            docEmpId === empId
        );
    };

    const handleEmployeeSelect = (emp: any) => {
        setSelectedEmployee(emp);
        setView('details');
    };

    const handleBack = () => {
        setSelectedEmployee(null);
        setView('list');
    };

    const handleDownload = (doc: Document) => {
        const fileUrl = doc.url || (doc as any).fileUrl;
        if (fileUrl) {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;

            const link = document.createElement('a');
            link.href = fullUrl;
            link.setAttribute('download', `${doc.title}`);
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("No file URL found for this document.");
        }
    };

    const filteredDocuments = selectedEmployee && Array.isArray(documents)
        ? documents
            .filter((d: Document) => isDocForEmployee(d, selectedEmployee))
            .filter((doc, index, self) =>
                index === self.findIndex((t) => t.type === doc.type)
            )
        : [];

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Mode Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">
                        {activeTab === 'employees' ? 'Documents' : 'My Documents'}
                    </h1>
                    <p className="text-brand-muted font-medium italic">
                        {activeTab === 'employees'
                            ? 'Securely manage and access employee documentation across the organization.'
                            : 'Manage and upload your personal verification records.'}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-brand-surface p-1.5 rounded-2xl border border-brand-border shadow-sm">
                    <button
                        onClick={() => { setActiveTab('employees'); setView('list'); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
                            activeTab === 'employees'
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        All Employees
                    </button>
                    <button
                        onClick={() => setActiveTab('my-documents')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
                            activeTab === 'my-documents'
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
                        }`}
                    >
                        <Upload className="w-4 h-4" />
                        My Documents
                    </button>
                </div>
            </div>

            {activeTab === 'my-documents' ? (
                /* Sub Admin / Admin's Personal Document Upload View */
                <EmployeeDocuments
                    onBack={() => setActiveTab('employees')}
                    title="My Documents"
                    subtitle="Upload and manage your personal certificates and employee photo."
                />
            ) : view === 'list' ? (
                /* Employee Grid View */
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="relative w-full md:w-96 shadow-sm group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border rounded-2xl py-3.5 pl-12 pr-4 text-brand-text placeholder-brand-muted text-sm font-medium focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {Array.isArray(employees) && employees.filter((e: any) =>
                            (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (e.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (e.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (e.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((emp: any) => {
                            const count = documents
                                .filter((d: Document) => isDocForEmployee(d, emp))
                                .filter((doc: Document, index: number, self: Document[]) =>
                                    index === self.findIndex((t: Document) => (
                                        t.title === doc.title && t.type === doc.type
                                    ))
                                ).length;

                            return (
                                <div
                                    key={emp._id || emp.id || emp.employeeId}
                                    onClick={() => handleEmployeeSelect(emp)}
                                    className="bg-brand-surface border border-brand-border rounded-3xl p-6 hover:border-brand-primary/30 hover:shadow-xl cursor-pointer transition-all duration-300 group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-6">
                                        {emp.avatar ? (
                                            <img
                                                src={emp.avatar.startsWith('http') ? emp.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${emp.avatar}`}
                                                alt={emp.name}
                                                className="h-16 w-16 rounded-2xl object-cover border border-brand-border shadow-inner group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-black text-xl shadow-inner group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:scale-105 group-hover:rotate-3">
                                                {emp.name ? emp.name.charAt(0) : 'E'}
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-brand-text group-hover:text-brand-primary transition-colors tracking-tight uppercase">{emp.name}</h3>
                                                {emp.employeeId && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-brand-bg px-2.5 py-0.5 rounded-md text-brand-muted border border-brand-border">
                                                        {emp.employeeId}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest">{emp.department || 'General'}</span>
                                                <span className="text-brand-muted/30">•</span>
                                                <span className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">{emp.role || 'Staff'}</span>
                                                {emp.branchName && (
                                                    <>
                                                        <span className="text-brand-muted/30">•</span>
                                                        <span className="text-brand-primary text-[10px] font-black uppercase tracking-widest">{emp.branchName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-brand-text font-black text-base leading-none">
                                                {count}
                                            </div>
                                            <div className="text-[9px] font-bold text-brand-muted uppercase tracking-tighter mt-0.5">Records Cached</div>
                                        </div>
                                        <div className="p-3 bg-brand-bg rounded-2xl group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner border border-brand-border group-hover:border-transparent">
                                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* Documents Details View */
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-3 text-brand-muted hover:text-brand-text font-black text-[10px] uppercase tracking-widest group transition-all"
                    >
                        <div className="p-2 bg-brand-surface border border-brand-border rounded-xl group-hover:border-brand-primary transition-colors">
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </div>
                        Back to Employee List
                    </button>

                    <div className="bg-brand-surface border border-brand-border p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-primary/5 to-transparent"></div>
                        <div className="flex items-center gap-6 relative z-10">
                            {selectedEmployee?.avatar ? (
                                <img
                                    src={selectedEmployee.avatar.startsWith('http') ? selectedEmployee.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedEmployee.avatar}`}
                                    alt={selectedEmployee.name}
                                    className="h-16 w-16 rounded-2xl object-cover border border-brand-border shadow-inner"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-black text-xl shadow-inner">
                                    {selectedEmployee?.name?.charAt(0) || 'E'}
                                </div>
                            )}
                            <div>
                                <h2 className="text-3xl font-black text-brand-text tracking-tight">{selectedEmployee?.name}</h2>
                                <p className="text-brand-muted font-bold tracking-wide">
                                    {selectedEmployee?.department} &bull; {selectedEmployee?.role} {selectedEmployee?.employeeId ? `(${selectedEmployee.employeeId})` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <div className="px-6 py-3 bg-brand-bg rounded-2xl border border-brand-border">
                                <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block mb-0.5">Total Records</span>
                                <span className="text-lg font-black text-brand-text">{filteredDocuments.length} Files</span>
                            </div>
                        </div>
                    </div>

                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-20 bg-brand-surface border border-brand-border rounded-[2.5rem] shadow-sm">
                            <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform">
                                <File className="w-12 h-12 text-brand-muted opacity-20" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-text mb-2">Workspace Empty</h3>
                            <p className="text-brand-muted font-medium italic">No documentation has been uploaded for this personnel yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDocuments.map((doc, idx) => {
                                const fileUrl = doc.url || (doc as any).fileUrl;
                                const isPhoto = doc.type === 'Employee Photo';
                                const fullUrl = fileUrl ? (fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`) : '';

                                return (
                                    <div
                                        key={doc.id || (doc as any)._id || idx}
                                        className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 hover:border-brand-primary/30 hover:shadow-2xl transition-all duration-300 group animate-in zoom-in-95 flex flex-col justify-between"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                {isPhoto && fullUrl ? (
                                                    <img
                                                        src={fullUrl}
                                                        alt="Employee Photo"
                                                        className="w-16 h-16 rounded-2xl object-cover border border-emerald-500/30 shadow-md group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border group-hover:border-brand-primary/30 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                                                        {isPhoto ? <Camera className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-black text-brand-muted group-hover:text-brand-primary uppercase tracking-widest bg-brand-bg px-3 py-1.5 rounded-xl border border-brand-border shadow-sm">
                                                    {doc.type}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-black text-brand-text mb-1 tracking-tight group-hover:text-brand-primary transition-colors break-words" title={doc.title}>
                                                {doc.title}
                                            </h3>
                                            <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mb-6">
                                                Uploaded: {doc.uploadDate || 'N/A'}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="w-full bg-brand-bg hover:bg-brand-primary text-brand-text hover:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-brand-border group-hover:border-transparent transition-all shadow-sm active:scale-95"
                                        >
                                            {isPhoto ? <Eye className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> : <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                                            {isPhoto ? 'View Photo' : 'Access Vault'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Documents;
