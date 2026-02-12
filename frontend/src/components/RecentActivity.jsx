import React from 'react';

const RecentActivity = ({ leaves }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Leave Requests</h3>
        <div className="space-y-3">
            {leaves.slice(0, 3).map(leave => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-semibold text-gray-800">{leave.employeeName || 'Unknown Employee'}</p>
                        <p className="text-sm text-gray-600">{(leave.leaveType || 'General Leave')} • {leave.days || 0} days</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {leave.status}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

export default RecentActivity;
