import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import { getInitials } from '../utils/utils';

const Profile = ({ currentUser, onUpdateEmployee }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [photo, setPhoto] = useState(currentUser.photo || null);
    const [formData, setFormData] = useState({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        personal_email: currentUser.personal_contact?.email || '',
        personal_phone: currentUser.personal_contact?.phone || '',
        location: currentUser.location || 'Bangalore',
        employeeId: currentUser.employeeId || '',
        joiningDate: currentUser.joiningDate || '',
        reporting_manager: currentUser.reporting_manager || ''
    });

    // Synchronize state with props when currentUser changes
    useEffect(() => {
        setPhoto(currentUser.photo || null);
        setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            personal_email: currentUser.personal_contact?.email || '',
            personal_phone: currentUser.personal_contact?.phone || '',
            location: currentUser.location || 'Bangalore',
            employeeId: currentUser.employeeId || '',
            joiningDate: currentUser.joiningDate || '',
            reporting_manager: currentUser.reporting_manager || ''
        });
    }, [currentUser]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'personal_phone') {
            const numericVal = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericVal }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Phone validation
        if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            alert('Work phone number must be exactly 10 digits');
            return;
        }
        if (formData.personal_phone && !/^\d{10}$/.test(formData.personal_phone)) {
            alert('Personal phone number must be exactly 10 digits');
            return;
        }
        const updatedEmployee = {
            ...currentUser,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            photo: photo,
            personal_contact: {
                email: formData.personal_email,
                phone: formData.personal_phone
            },
            location: formData.location,
            employeeId: formData.employeeId,
            joiningDate: formData.joiningDate,
            reporting_manager: formData.reporting_manager
        };
        onUpdateEmployee(updatedEmployee);
        setIsEditing(false);
    };

    return (
        <div className="animate-fade-in pb-12">
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-48 relative">
                    <div className="absolute bottom-6 left-12 flex items-center space-x-6">
                        <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-2xl relative group">
                            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden border border-gray-100">
                                {photo ? (
                                    <img src={photo} alt={currentUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(currentUser.name)
                                )}
                            </div>
                            {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Icons.Camera className="text-white w-8 h-8" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            )}
                        </div>
                        <div className="pt-8">
                            <h2 className="text-3xl font-bold text-white drop-shadow-lg">{currentUser.name}</h2>
                            <p className="text-purple-100 font-bold uppercase tracking-wider text-sm">{currentUser.role} • {currentUser.department}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="absolute bottom-4 right-8 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-2 rounded-xl font-bold transition-all border border-white/30"
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>

                <div className="pt-24 px-12 pb-12">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Professional Details */}
                            <div className="space-y-8">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2 border-b border-gray-100 pb-2">
                                    <Icons.Briefcase className="text-purple-600" />
                                    <span>Professional Details</span>
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-gray-500 font-medium">Employee ID</span>
                                        {isEditing ? (
                                            <input
                                                name="employeeId"
                                                value={formData.employeeId}
                                                onChange={handleChange}
                                                className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-800">{currentUser.employeeId}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-gray-500 font-medium">Reporting Manager</span>
                                        {isEditing ? (
                                            <input
                                                name="reporting_manager"
                                                value={formData.reporting_manager}
                                                onChange={handleChange}
                                                className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-800">{currentUser.reporting_manager || 'CEO'}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-gray-500 font-medium">Joining Date</span>
                                        {isEditing ? (
                                            <input
                                                name="joiningDate"
                                                value={formData.joiningDate}
                                                onChange={handleChange}
                                                className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-800">{currentUser.joiningDate}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-gray-500 font-medium">Location</span>
                                        {isEditing ? (
                                            <input
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            <span className="font-bold text-gray-800">{currentUser.location}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-8">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2 border-b border-gray-100 pb-2">
                                    <Icons.Email className="text-indigo-600" />
                                    <span>Contact Information</span>
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Work Email</label>
                                        {isEditing ? (
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-2xl p-4 font-semibold text-gray-800 transition-all outline-none"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-2xl font-semibold text-gray-800">{currentUser.email}</div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Personal Email</label>
                                        {isEditing ? (
                                            <input
                                                name="personal_email"
                                                value={formData.personal_email}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-2xl p-4 font-semibold text-gray-800 transition-all outline-none"
                                            />
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-2xl font-semibold text-gray-800">{currentUser.personal_contact?.email || 'Not Provided'}</div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Work Phone</label>
                                            {isEditing ? (
                                                <input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-2xl p-4 font-semibold text-gray-800 transition-all outline-none"
                                                />
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-2xl font-semibold text-gray-800 text-sm">{currentUser.phone}</div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Personal Phone</label>
                                            {isEditing ? (
                                                <input
                                                    name="personal_phone"
                                                    value={formData.personal_phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500 rounded-2xl p-4 font-semibold text-gray-800 transition-all outline-none"
                                                />
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-2xl font-semibold text-gray-800 text-sm">{currentUser.personal_contact?.phone || 'Not Provided'}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-12 flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
