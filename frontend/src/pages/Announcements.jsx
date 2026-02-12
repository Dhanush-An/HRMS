import React, { useState, useEffect } from 'react';
import { announcementService } from '../api/services/announcementService';
import { Icons } from '../icons/Icons';

const Announcements = ({ currentUser }) => {
    const isAdmin = currentUser?.role === 'Admin' ||
        currentUser?.role === 'admin' ||
        currentUser?.role === 'HR Manager' ||
        currentUser?.isAdmin === true ||
        currentUser?.email === 'david.k@company.com';
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        type: 'General Update',
        content: '',
        color: 'purple'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementService.getAllAnnouncements();
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await announcementService.createAnnouncement(newAnnouncement);
            setIsModalOpen(false);
            setNewAnnouncement({ type: 'General Update', content: '', color: 'purple' });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error creating announcement:', error);
            const status = error.response?.status;
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Error ${status || ''}: ${msg}`);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-medium italic">Loading announcements...</div>;
    }

    return (
        <div className="animate-fade-in relative">
            {isAdmin && (
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
                    >
                        <Icons.Plus size={18} />
                        <span>New Announcement</span>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.length > 0 ? (
                    announcements.map((ann) => (
                        <div key={ann.id} className={`bg-${ann.color || 'purple'}-50 p-6 rounded-3xl border border-${ann.color || 'purple'}-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`bg-${ann.color || 'purple'}-100 text-${ann.color || 'purple'}-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}>
                                    {ann.type}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ann.time}</span>
                            </div>
                            <p className="text-gray-700 text-lg font-medium leading-relaxed mb-4">{ann.content}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{ann.date}</span>
                                <button className={`text-xs font-black text-${ann.color || 'purple'}-600 hover:text-${ann.color || 'purple'}-700 transition-colors uppercase tracking-widest flex items-center`}>
                                    View Details <Icons.ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <Icons.Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">No announcements yet</h3>
                    </div>
                )}
            </div>

            {/* Modal for new announcement */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800">New Announcement</h3>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Broadcast to all employees</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100 text-gray-400 hover:text-red-500">
                                <Icons.X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Announcement Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['General Update', 'Company Policy', 'Event', 'Urgent'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setNewAnnouncement({ ...newAnnouncement, type, color: type === 'Urgent' ? 'red' : type === 'Company Policy' ? 'blue' : 'purple' });
                                            }}
                                            className={`py-3 px-4 rounded-2xl text-xs font-bold transition-all border ${newAnnouncement.type === type
                                                ? 'bg-purple-600 text-white border-transparent shadow-lg shadow-purple-100'
                                                : 'bg-white text-gray-500 border-gray-100 hover:border-purple-200'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Content</label>
                                <textarea
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 min-h-[120px] transition-all"
                                    placeholder="Type your announcement here..."
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.15em] shadow-xl shadow-purple-100 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Publish Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
