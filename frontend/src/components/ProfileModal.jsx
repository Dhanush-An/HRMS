import React from 'react';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';

const ProfileModal = ({ currentUser, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                {/* Header/Cover */}
                <div className="pt-12 pb-16 bg-gradient-to-r from-purple-600 to-indigo-600 relative text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <Icons.X size={24} />
                    </button>
                    <h3 className="text-3xl font-bold text-white mb-2">{currentUser.name}</h3>
                    <p className="text-purple-100 font-medium capitalize">{currentUser.role}</p>
                </div>

                {/* Profile Info */}
                <div className="px-8 pb-8 -mt-10 text-center relative z-10">
                    <div className="inline-flex w-20 h-20 bg-white rounded-full p-1 shadow-xl mb-6">
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white">
                            {getInitials(currentUser.name)}
                        </div>
                    </div>

                    <div className="space-y-4 text-left">
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-purple-600">
                                <Icons.Email size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                                <p className="text-gray-700 font-medium">{currentUser.email}</p>
                            </div>
                        </div>

                        {currentUser.employee_id && (
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="text-purple-600">
                                    <Icons.User size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Employee ID</p>
                                    <p className="text-gray-700 font-medium">{currentUser.employee_id}</p>
                                </div>
                            </div>
                        )}

                        {currentUser.department && (
                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="text-purple-600">
                                    <Icons.Briefcase size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Department</p>
                                    <p className="text-gray-700 font-medium">{currentUser.department}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-8 bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
