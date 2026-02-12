import React, { useState } from 'react';
import ProfileModal from './ProfileModal';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';
import logo from '../assets/logo.svg';

const Navbar = ({ currentUser, onLogout, hideTabs }) => {
    const [showProfileModal, setShowProfileModal] = useState(false);

    return (
        <>
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            {/* Left side spacer - branding is in Sidebar */}
                        </div>
                        <div className="flex items-center space-x-6">
                            <div
                                onClick={() => setShowProfileModal(true)}
                                className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer group hover:scale-105 transition-transform shadow-sm overflow-hidden border-2 border-white ring-2 ring-purple-100"
                            >
                                {currentUser.photo ? (
                                    <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(currentUser.name)
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {showProfileModal && (
                <ProfileModal
                    currentUser={currentUser}
                    onClose={() => setShowProfileModal(false)}
                />
            )}
        </>
    );
};

export default Navbar;
