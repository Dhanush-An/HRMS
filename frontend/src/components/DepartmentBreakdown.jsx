import React, { useMemo } from 'react';

const DepartmentBreakdown = ({ employees }) => {
    const departments = useMemo(() => {
        const deptMap = {};
        employees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            deptMap[dept] = (deptMap[dept] || 0) + 1;
        });
        return Object.entries(deptMap).map(([name, count]) => ({ name, count }));
    }, [employees]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Department Overview</h3>
            <div className="space-y-4">
                {departments.map((dept, idx) => (
                    <div key={dept.name}>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                            <span className="text-sm font-semibold text-gray-800">{dept.count} employees</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full bg-gradient-to-r ${idx === 0 ? 'from-purple-500 to-purple-600' :
                                    idx === 1 ? 'from-blue-500 to-blue-600' :
                                        idx === 2 ? 'from-green-500 to-green-600' :
                                            'from-orange-500 to-orange-600'
                                    }`}
                                style={{ width: `${employees.length > 0 ? (dept.count / employees.length) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DepartmentBreakdown;
