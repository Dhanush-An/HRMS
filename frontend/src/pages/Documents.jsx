import React, { useState } from 'react';
import { Icons } from '../icons/Icons';

const Documents = ({ employees, currentUser, onUpdateEmployee }) => {
    const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'admin' || currentUser.isAdmin === true || currentUser.email === 'admin@hrms.com' || currentUser.email === 'david.k@company.com';
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(isAdmin ? '' : currentUser.id);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState('Aadhar');

    const requiredDocuments = [
        { name: "Aadhar", mandatory: true },
        { name: "PAN", mandatory: true },
        { name: "10th Certificate", mandatory: true },
        { name: "12th Certificate", mandatory: true },
        { name: "Degree certificate's", mandatory: true },
        { name: "Course Certificate", mandatory: false },
        { name: "Intern Certificate", mandatory: false },
        { name: "Bank Passbook", mandatory: false },
        { name: "PF Account", mandatory: false },
        { name: "Offer Letter Acceptance", mandatory: true },
        { name: "Experience", mandatory: false }
    ];

    const selectedEmployee = isAdmin
        ? (employees.find(emp => String(emp.id) === String(selectedEmployeeId || '')) || null)
        : currentUser;

    const employeeDocs = selectedEmployee?.documents || [];

    const getUploadedDoc = (docName) => {
        return employeeDocs.find(doc => doc.name.toLowerCase().includes(docName.toLowerCase()));
    };

    const mandatoryUploadedCount = requiredDocuments.filter(d => d.mandatory && getUploadedDoc(d.name)).length;
    const totalMandatoryCount = requiredDocuments.filter(d => d.mandatory).length;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        addFilesToQueue(files);
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Add to queue with a temporary state
            const newFile = {
                id: Math.random().toString(36).substr(2, 9),
                name: files[0].name,
                size: (files[0].size / 1024).toFixed(0) + ' KB',
                rawSize: files[0].size,
                type: files[0].name.split('.').pop().toUpperCase(),
                error: files[0].size > 10 * 1024 * 1024 ? 'File size exceeds 10 MB limit' : null,
                status: 'queued',
                label: selectedDocType
            };

            if (!newFile.error) {
                // Immediate upload for checklist selections
                const newDoc = {
                    id: Date.now() + Math.random(),
                    name: (newFile.label || newFile.name.split('.')[0]),
                    filename: newFile.name, // Store actual filename
                    type: newFile.type,
                    size: (newFile.rawSize / (1024 * 1024)).toFixed(1) + ' MB',
                    date: new Date().toLocaleDateString(),
                    color: 'blue'
                };

                const updatedEmployee = {
                    ...selectedEmployee,
                    documents: [...employeeDocs, newDoc]
                };

                await onUpdateEmployee(updatedEmployee);
            } else {
                setUploadQueue(prev => [...prev, newFile]);
            }
        }
    };

    const addFilesToQueue = (files) => {
        const newFiles = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: (file.size / 1024).toFixed(0) + ' KB',
            rawSize: file.size,
            type: file.name.split('.').pop().toUpperCase(),
            error: file.size > 10 * 1024 * 1024 ? 'File size exceeds 10 MB limit' : null,
            status: 'queued',
            label: selectedDocType
        }));
        setUploadQueue(prev => [...prev, ...newFiles]);
    };

    const removeFromQueue = (id) => {
        setUploadQueue(prev => prev.filter(f => f.id !== id));
    };

    const handleUpload = async () => {
        if (!selectedEmployee || uploadQueue.length === 0) return;

        const validFiles = uploadQueue.filter(f => !f.error);
        if (validFiles.length === 0) return;

        const newDocs = validFiles.map(file => ({
            id: Date.now() + Math.random(),
            name: (file.label || file.name.split('.')[0]),
            filename: file.name,
            type: file.type,
            size: (file.rawSize / (1024 * 1024)).toFixed(1) + ' MB',
            date: new Date().toLocaleDateString(),
            color: 'blue'
        }));

        const updatedEmployee = {
            ...selectedEmployee,
            documents: [...employeeDocs, ...newDocs]
        };

        await onUpdateEmployee(updatedEmployee);
        setUploadQueue([]);
    };

    const handleDeleteDoc = async (docId) => {
        if (!selectedEmployee) return;

        const updatedEmployee = {
            ...selectedEmployee,
            documents: employeeDocs.filter(doc => doc.id !== docId)
        };

        await onUpdateEmployee(updatedEmployee);
    };

    const handleDownload = (doc) => {
        // In a real application, this would use doc.url from the backend
        // For demonstration purposes, we create a small dummy blob
        const element = document.createElement("a");
        const file = new Blob([`Simulated content for: ${doc.name}\nGenerated on: ${new Date().toLocaleString()}`], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${doc.name.replace(/\s+/g, '_')}_${selectedEmployee.name.replace(/\s+/g, '_')}.${doc.type.toLowerCase()}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleDownloadAll = () => {
        if (!employeeDocs || employeeDocs.length === 0) return;

        employeeDocs.forEach((doc, index) => {
            setTimeout(() => {
                handleDownload(doc);
            }, index * 300); // 300ms delay to prevent browser download restrictions
        });
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {isAdmin && (
                    <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">View Documents For:</span>
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="bg-transparent font-bold text-gray-800 focus:outline-none"
                        >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                        {isAdmin && (
                            <span className="ml-4 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100 flex items-center">
                                <Icons.ShieldCheck size={12} className="mr-1" />
                                View Only Mode
                            </span>
                        )}
                    </div>
                )}
            </div>

            {selectedEmployee ? (
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Compact Checklist Section */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-800 flex items-center">
                                    <Icons.Clock className="mr-2 text-purple-500" size={18} />
                                    Required Documents
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Quick upload and status tracking</p>
                            </div>
                            <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-50">
                                <div className="text-right">
                                    <span className="text-xl font-black text-purple-600 block leading-none">{mandatoryUploadedCount}/{totalMandatoryCount}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mandatory</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100"></div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-green-500 block leading-none">{employeeDocs.length}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Docs</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100"></div>
                                <button
                                    onClick={handleDownloadAll}
                                    disabled={employeeDocs.length === 0}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${employeeDocs.length > 0
                                        ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white'
                                        : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                        }`}
                                    title={employeeDocs.length === 0 ? 'No documents to download' : 'Download all documents'}
                                >
                                    <Icons.Download size={12} />
                                    <span>Download All</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {requiredDocuments.map((doc) => {
                                const uploadedDoc = getUploadedDoc(doc.name);
                                const isUploaded = !!uploadedDoc;
                                return (
                                    <div key={doc.name} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isUploaded
                                        ? 'bg-green-50/30 border-green-100/50'
                                        : 'bg-white border-gray-50 hover:border-purple-100 hover:shadow-sm'
                                        }`}>
                                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'
                                                }`}>
                                                {isUploaded ? <Icons.Check size={14} /> : <Icons.FileText size={14} />}
                                            </div>
                                            <div className="truncate">
                                                <p className={`text-xs font-bold truncate ${isUploaded ? 'text-gray-700' : 'text-gray-500'}`}>
                                                    {doc.name}
                                                    {doc.mandatory && <span className="text-red-500 ml-1">*</span>}
                                                </p>
                                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-tighter truncate max-w-[150px]">
                                                    {isUploaded ? (uploadedDoc.filename || 'Verified') : 'Required'}
                                                </p>
                                            </div>
                                        </div>

                                        {!isUploaded && (
                                            <button
                                                onClick={() => {
                                                    setSelectedDocType(doc.name);
                                                    document.getElementById('checklist-upload-input')?.click();
                                                }}
                                                className="shrink-0 p-2 text-purple-500 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-xl transition-all border border-purple-100"
                                                title={`Upload ${doc.name}`}
                                            >
                                                <Icons.Plus size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hidden File Input for the Checklist Upload Buttons */}
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="checklist-upload-input"
                    />

                    {/* Upload Queue (Visible only when files are being processed and NOT in admin view) */}
                    {uploadQueue.length > 0 && !isAdmin && (
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8 animate-bounce-subtle">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                        <Icons.Sync className="mr-3 text-purple-500 animate-spin-slow" size={24} />
                                        Upload Queue
                                    </h3>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setUploadQueue([])}
                                            className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploadQueue.some(f => f.error)}
                                            className={`px-8 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all ${!uploadQueue.some(f => f.error)
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-100 hover:scale-105'
                                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            Process Uploads
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-50 border border-gray-100 rounded-[1.5rem] overflow-hidden bg-gray-50/50">
                                    {uploadQueue.map((file) => (
                                        <div key={file.id} className="p-5 flex items-center space-x-4">
                                            <div className="w-14 h-14 bg-white text-purple-600 font-black text-xs flex items-center justify-center rounded-2xl shadow-sm flex-shrink-0 border border-gray-100">
                                                {file.type}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-black text-gray-700 truncate">{file.name}</h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md">{file.label}</span>
                                                    <span className="text-gray-300 text-xs">•</span>
                                                    <p className="text-xs text-gray-400 font-bold uppercase">{file.size}</p>
                                                </div>
                                                {file.error && (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{file.error}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromQueue(file.id)}
                                                className="p-3 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-xl shadow-sm border border-gray-50"
                                            >
                                                <Icons.X size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Compact Storage Section */}
                    {employeeDocs.length > 0 && (
                        <div className="space-y-4 pb-6">
                            <div className="flex items-center space-x-4 px-2">
                                <div className="h-px flex-1 bg-gray-100"></div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center">
                                    <Icons.FileText className="mr-2 text-purple-400" size={12} />
                                    Storage
                                </h3>
                                <div className="h-px flex-1 bg-gray-100"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {employeeDocs.map((doc) => (
                                    <div key={doc.id} className="group p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                            <Icons.FileText size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-extrabold text-gray-700 text-[11px] truncate leading-tight">{doc.name}</h4>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{doc.type} • {doc.size}</p>
                                        </div>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-400 hover:text-purple-600 transition-colors"
                                                title="Download"
                                            >
                                                <Icons.Download size={14} />
                                            </button>
                                            {!isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-300 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Icons.Trash size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl p-20 text-center border border-gray-100 max-w-3xl mx-auto">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
                        <Icons.Users size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Select an Employee</h3>
                    <p className="text-gray-500">Please select an employee from the list above to manage their documents.</p>
                </div>
            )}
        </div>
    );
};

export default Documents;
