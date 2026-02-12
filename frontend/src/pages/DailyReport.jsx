import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { reportService } from '../api/services/reportService';

const DailyReport = () => {
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [allReports, setAllReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        department: 'Tech',
        morningReport: '',
        afternoonReport: ''
    });

    const fetchAllReports = async () => {
        try {
            setLoading(true);
            const data = await reportService.getAllReports();
            setAllReports(data);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyReports = async () => {
        try {
            setLoading(true);
            const data = await reportService.getMyReports();
            setAllReports(data);
        } catch (err) {
            console.error('Error fetching my reports:', err);
            // Don't set global error to avoid blocking the form
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem('role');
        const isUserAdmin = role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'hr manager');
        setIsAdmin(isUserAdmin);

        if (isUserAdmin) {
            fetchAllReports();
        } else {
            fetchMyReports(); // Fetch user's own reports
        }
    }, []);

    const getCharCount = (text) => text.length;
    const isMorningValid = getCharCount(formData.morningReport) >= 10;
    const isAfternoonValid = getCharCount(formData.afternoonReport) >= 10;
    const isFormValid = isMorningValid && isAfternoonValid;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        try {
            await reportService.submitReport({
                date: formData.date,
                department: formData.department,
                morningReport: formData.morningReport,
                afternoonReport: formData.afternoonReport
            });
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
            setFormData(prev => ({ ...prev, morningReport: '', afternoonReport: '' }));
            setError(null);
            fetchMyReports(); // Refresh the list
        } catch (err) {
            console.error('Error submitting report:', err);
            setError(err.response?.data?.message || 'Failed to submit report');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Admin View ---
    if (isAdmin) {
        return (
            <div className="animate-fade-in pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Team Daily Reports</h2>
                    <div className="flex space-x-2">
                        <button onClick={fetchAllReports} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors">
                            <Icons.RefreshCcw size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading reports...</div>
                ) : allReports.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                        <Icons.FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">No Reports Yet</h3>
                        <p className="text-gray-500 text-sm">Employees haven't submitted any daily reports.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {allReports.map((report) => (
                            <div key={report.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {report.employeeName ? report.employeeName.split(' ').map(n => n[0]).join('') : 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{report.employeeName}</h4>
                                            <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">{report.role || 'Employee'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center space-x-2 text-gray-400 text-xs font-medium mb-1">
                                            <Icons.Calendar size={12} />
                                            <span>{report.date}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${report.department === 'Tech' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                            {report.department} Team
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-50">
                                        <h5 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center space-x-2">
                                            <Icons.Clock size={12} />
                                            <span>Morning Progress</span>
                                        </h5>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{report.morningReport}</p>
                                    </div>
                                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-50">
                                        <h5 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center space-x-2">
                                            <Icons.User size={12} />
                                            <span>Afternoon Progress</span>
                                        </h5>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{report.afternoonReport}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- Employee View (Submission Form & History) ---
    return (
        <div className="animate-fade-in pb-8">
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 relative overflow-hidden mb-8">
                <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                                <Icons.FileText className="text-purple-600 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 tracking-tight">Daily Status Report</h3>
                                <p className="text-gray-400 text-xs font-medium">Capture your progress for {formData.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${formData.department === 'Tech' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                {formData.department} Team
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pl-1 mb-1">
                                    <div className="flex items-center space-x-2">
                                        <Icons.Clock className="text-amber-500 w-4 h-4" />
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Morning Progress</label>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMorningValid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {getCharCount(formData.morningReport)} / 10 Letters
                                    </span>
                                </div>
                                <textarea
                                    name="morningReport"
                                    value={formData.morningReport}
                                    onChange={handleChange}
                                    placeholder="Briefly describe your morning activities (min. 10 letters)..."
                                    className={`w-full border-2 bg-gray-50 focus:bg-white rounded-2xl p-5 text-gray-700 font-medium min-h-[160px] transition-all outline-none placeholder:text-gray-300 resize-none shadow-sm ${formData.morningReport && !isMorningValid ? 'border-amber-200' : 'border-transparent focus:border-purple-200'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between pl-1 mb-1">
                                    <div className="flex items-center space-x-2">
                                        <Icons.User className="text-blue-500 w-4 h-4" />
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Afternoon Progress</label>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAfternoonValid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {getCharCount(formData.afternoonReport)} / 10 Letters
                                    </span>
                                </div>
                                <textarea
                                    name="afternoonReport"
                                    value={formData.afternoonReport}
                                    onChange={handleChange}
                                    placeholder="Briefly describe your afternoon activities (min. 10 letters)..."
                                    className={`w-full border-2 bg-gray-50 focus:bg-white rounded-2xl p-5 text-gray-700 font-medium min-h-[160px] transition-all outline-none placeholder:text-gray-300 resize-none shadow-sm ${formData.afternoonReport && !isAfternoonValid ? 'border-amber-200' : 'border-transparent focus:border-purple-200'}`}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                            <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2 text-xs font-medium text-gray-400">
                                    <Icons.Calendar className="w-4 h-4" />
                                    <span>Auto-dated: {formData.date}</span>
                                </div>
                                {!isFormValid && (
                                    <p className="text-[10px] font-bold text-amber-500 animate-pulse">
                                        * Please fill at least 10 letters in each section to submit
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className={`px-10 py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center space-x-3 ${isFormValid
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-200 hover:scale-[1.02] active:scale-95 cursor-pointer'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none grayscale'
                                    }`}
                            >
                                <Icons.Check className="w-5 h-5" />
                                <span>Submit Final Report</span>
                            </button>
                        </div>
                    </form>
                </div>

                {submitted && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                                <Icons.Check className="text-green-500 w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 mb-1">Status Updated!</h4>
                            <p className="text-gray-500 text-sm font-medium">Your daily report has been filed successfully.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* My Reports History */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800 ml-2">My Reports</h3>
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading your history...</div>
                ) : allReports.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <p className="text-gray-400 text-sm">No reports submitted yet.</p>
                    </div>
                ) : (
                    allReports.map((report) => (
                        <div key={report.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <Icons.Calendar className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <span className="font-bold text-gray-700">{report.date}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${report.department === 'Tech' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                    {report.department} Team
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center space-x-2">
                                        <Icons.Clock size={12} />
                                        <span>Morning</span>
                                    </h5>
                                    <p className="text-gray-600 text-sm leading-relaxed">{report.morningReport}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center space-x-2">
                                        <Icons.User size={12} />
                                        <span>Afternoon</span>
                                    </h5>
                                    <p className="text-gray-600 text-sm leading-relaxed">{report.afternoonReport}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DailyReport;
