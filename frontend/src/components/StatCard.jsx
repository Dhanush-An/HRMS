import React from 'react';

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
                {icon}
            </div>
        </div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
);

export default StatCard;
