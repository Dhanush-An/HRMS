import React from 'react';
import logo from '../assets/logo.svg';

const Sidebar = ({ adminTabs, activeTab, setActiveTab, currentUser, onLogout, getInitials }) => (
    <div className="w-64 bg-white shadow-xl h-screen flex flex-col border-r border-gray-200">
        <div className="p-8 pb-4 flex items-center space-x-3">
            <img src={logo} alt="Antigraviity Logo" className="w-10 h-10 rounded-xl shadow-lg border border-gray-100" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Antigraviity
            </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {adminTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'
                        }`}
                >
                    <span className={`transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                        {tab.icon}
                    </span>
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{tab.label}</span>
                </button>
            ))}
        </nav>

        <div className="p-4 mt-auto">
            <div
                onClick={() => setActiveTab('user-profile')}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 flex items-center space-x-3 border border-gray-200 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group/profile"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden group-hover/profile:scale-110 transition-transform">
                    {currentUser.photo ? (
                        <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                        getInitials(currentUser.name)
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate group-hover/profile:text-purple-600 transition-colors">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate">{currentUser.role}</p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLogout();
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Logout"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
);

export default Sidebar;
