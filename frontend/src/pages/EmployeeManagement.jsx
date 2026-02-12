import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';

const EmployeeCard = ({ employee, onClick }) => (
    <div
        onClick={onClick}
        className="bg-white rounded-xl shadow-lg p-6 card-hover cursor-pointer"
    >
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {employee.photo ? (
                        <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
                    ) : (
                        getInitials(employee.name)
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{employee.name}</h3>
                    <p className="text-sm text-gray-500">{employee.employeeId}</p>
                </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {employee.status}
            </span>
        </div>
        <div className="space-y-2">
            <p className="text-sm text-gray-600"><span className="font-semibold">Role:</span> {employee.role}</p>
            <p className="text-sm text-gray-600"><span className="font-semibold">Department:</span> {employee.department}</p>
            <p className="text-sm text-gray-600"><span className="font-semibold">Location:</span> {employee.location}</p>
            <p className="text-sm text-gray-600"><span className="font-semibold">Joined:</span> {employee.joiningDate}</p>
        </div>
    </div>
);

const InfoField = ({ label, value, isEditing, onChange }) => (
    <div className="min-w-0">
        <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
        {isEditing ? (
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
        ) : (
            <p className="text-gray-800 break-words">{value}</p>
        )}
    </div>
);

const EmployeeDetailsModal = ({ employee, onClose, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(employee);
    const fileInputRef = useRef(null);

    // Sync state with props
    useEffect(() => {
        setFormData(employee);
    }, [employee]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800">Employee Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icons.X />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="relative group">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                                {formData.photo ? (
                                    <img src={formData.photo} alt={formData.name} className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(formData.name)
                                )}
                            </div>
                            {isEditing && (
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Icons.Edit size={20} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="text-2xl font-bold text-gray-800 border-b-2 border-purple-500 focus:outline-none"
                                />
                            ) : (
                                <h4 className="text-2xl font-bold text-gray-800">{employee.name}</h4>
                            )}
                            <p className="text-gray-500">{employee.employeeId}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <InfoField label="Email" value={formData.email} isEditing={isEditing} onChange={(val) => setFormData({ ...formData, email: val })} />
                        <InfoField label="Username" value={formData.username || ''} isEditing={isEditing} onChange={(val) => setFormData({ ...formData, username: val })} />
                        <InfoField
                            label="Phone"
                            value={formData.phone}
                            isEditing={isEditing}
                            onChange={(val) => {
                                const numericVal = val.replace(/\D/g, '').slice(0, 10);
                                setFormData({ ...formData, phone: numericVal });
                            }}
                        />
                        {isEditing && (
                            <div className="min-w-0">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Update Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        )}
                        <InfoField label="Role" value={formData.role} isEditing={isEditing} onChange={(val) => setFormData({ ...formData, role: val })} />
                        <InfoField label="Department" value={formData.department} isEditing={isEditing} onChange={(val) => setFormData({ ...formData, department: val })} />
                        <InfoField label="Location" value={formData.location} isEditing={isEditing} onChange={(val) => setFormData({ ...formData, location: val })} />
                        <InfoField label="Joining Date" value={formData.joiningDate} isEditing={isEditing} onChange={(val) => setFormData({ ...formData, joiningDate: val })} />
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-700">Documents</h5>
                            {isEditing && (
                                <button
                                    onClick={() => {/* Mock upload logic or trigger hidden input */ }}
                                    className="text-xs font-bold text-purple-600 hover:text-purple-700 uppercase"
                                >
                                    + Upload Document
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.documents?.length > 0 ? (
                                formData.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                        <span>{typeof doc === 'string' ? doc : doc.name}</span>
                                        {isEditing && (
                                            <button
                                                onClick={() => {
                                                    const newDocs = formData.documents.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, documents: newDocs });
                                                }}
                                                className="hover:text-red-600"
                                            >
                                                <Icons.X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm italic">No documents uploaded</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // Phone validation
                                        const phoneRegex = /^\d{10}$/;
                                        if (!phoneRegex.test(formData.phone)) {
                                            alert('Phone number must be exactly 10 digits');
                                            return;
                                        }

                                        onUpdate(formData);
                                        setIsEditing(false);
                                    }}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this employee?')) {
                                            onDelete(employee.id);
                                            onClose();
                                        }
                                    }}
                                    className="px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center space-x-2 transition-all"
                                >
                                    <Icons.Trash size={18} />
                                    <span>Delete</span>
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg flex items-center space-x-2"
                                >
                                    <Icons.Edit />
                                    <span>Edit</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddEmployeeModal = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', role: '', department: '',
        location: '', joiningDate: '', employeeId: '', status: 'Active',
        photo: '', salary: '', documents: [], password: '', username: ''
    });
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Phone validation
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            alert('Phone number must be exactly 10 digits');
            return;
        }

        onAdd(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800">Add New Employee</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icons.X />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                                {formData.photo ? (
                                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(formData.name)
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg text-purple-600 hover:text-purple-700 transition-all border border-gray-100"
                            >
                                <Icons.Plus size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Full Name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Employee ID"
                            required
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Phone (10 digits)"
                            required
                            maxLength={10}
                            value={formData.phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setFormData({ ...formData, phone: val });
                            }}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Role"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Department"
                            required
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="date"
                            placeholder="Joining Date"
                            required
                            value={formData.joiningDate}
                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg"
                        >
                            Add Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EmployeeManagement = ({ employees, onAdd, onUpdate, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDepartment = selectedDepartment === 'All' || emp.department === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    const departments = ['All', ...new Set(employees.map(e => e.department))];

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div></div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 hover:shadow-lg transition-all"
                >
                    <Icons.Plus />
                    <span>Add Employee</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <div className="absolute left-3 top-3.5 text-gray-400">
                            <Icons.Search />
                        </div>
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Employee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(employee => (
                    <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        onClick={() => setSelectedEmployee(employee)}
                    />
                ))}
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddEmployeeModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={(newEmployee) => {
                        onAdd(newEmployee);
                        setShowAddModal(false);
                    }}
                />
            )}

            {selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                    onUpdate={(updated) => {
                        onUpdate(updated);
                        setSelectedEmployee(null);
                    }}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
};

export default EmployeeManagement;

