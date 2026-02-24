import { useState, useEffect } from 'react';
import { FileText, Download, Search, File, ChevronRight } from 'lucide-react';
import api from '../../api';

interface Document {
    id: string;
    title: string;
    type: string;
    url: string;
    uploadDate: string;
    uploadedBy: string;
    employeeId?: string; // Link to employee
}

const Documents = () => {
    const [view, setView] = useState<'list' | 'details'>('list');
    const [employees, setEmployees] = useState<any[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, docRes] = await Promise.all([
                api.get('/api/employees'),
                api.get('/api/documents')
            ]);
            setEmployees(await empRes.json());
            setDocuments(await docRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleEmployeeSelect = (emp: any) => {
        setSelectedEmployee(emp);
        setView('details');
    };

    const handleBack = () => {
        setSelectedEmployee(null);
        setView('list');
    };

    const filteredDocuments = selectedEmployee && Array.isArray(documents)
        ? documents
            .filter((d: Document) => d.employeeId === selectedEmployee.id)
            .filter((doc, index, self) =>
                index === self.findIndex((t) => t.type === doc.type)
            )
        : [];

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight uppercase">Documents</h1>
                    <p className="text-brand-muted font-medium italic">Securely manage and access employee documentation.</p>
                </div>
            </div>

            {view === 'list' ? (
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
                            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            e.role.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((emp: any) => (
                            <div
                                key={emp.id}
                                onClick={() => handleEmployeeSelect(emp)}
                                className="bg-brand-surface border border-brand-border rounded-3xl p-6 hover:border-brand-primary/30 hover:shadow-xl cursor-pointer transition-all duration-300 group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-black text-xl shadow-inner group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:scale-105 group-hover:rotate-3">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-brand-text group-hover:text-brand-primary transition-colors tracking-tight uppercase">{emp.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-brand-muted text-[10px] font-black uppercase tracking-widest">{emp.department}</span>
                                            <span className="text-brand-muted/30">•</span>
                                            <span className="text-brand-muted text-[10px] font-bold uppercase tracking-widest">{emp.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-brand-text font-black text-base leading-none">
                                            {documents
                                                .filter((d: Document) => d.employeeId === emp.id)
                                                .filter((doc: Document, index: number, self: Document[]) =>
                                                    index === self.findIndex((t: Document) => (
                                                        t.title === doc.title && t.type === doc.type
                                                    ))
                                                ).length}
                                        </div>
                                        <div className="text-[9px] font-bold text-brand-muted uppercase tracking-tighter mt-0.5">Records Cached</div>
                                    </div>
                                    <div className="p-3 bg-brand-bg rounded-2xl group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner border border-brand-border group-hover:border-transparent">
                                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
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
                            <div className="h-16 w-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-black text-xl shadow-inner">
                                {selectedEmployee?.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-brand-text tracking-tight">{selectedEmployee?.name}</h2>
                                <p className="text-brand-muted font-bold tracking-wide">{selectedEmployee?.department} &bull; {selectedEmployee?.role}</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredDocuments.map((doc, idx) => (
                                <div
                                    key={doc.id}
                                    className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-8 hover:border-brand-primary/30 hover:shadow-2xl transition-all duration-300 group animate-in zoom-in-95"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border group-hover:border-brand-primary/30 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <span className="text-[10px] font-black text-brand-muted group-hover:text-brand-primary uppercase tracking-widest bg-brand-bg px-3 py-1.5 rounded-xl border border-brand-border shadow-sm">{doc.type}</span>
                                    </div>

                                    <h3 className="text-xl font-black text-brand-text mb-1 truncate tracking-tight group-hover:text-brand-primary transition-colors" title={doc.title}>{doc.title}</h3>
                                    <p className="text-brand-muted text-[10px] font-bold uppercase tracking-widest mb-6">Uploaded: {doc.uploadDate}</p>

                                    <button
                                        className="w-full bg-brand-bg hover:bg-brand-primary text-brand-text hover:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-brand-border group-hover:border-transparent transition-all shadow-sm active:scale-95"
                                    >
                                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                        Access Vault
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Documents;
