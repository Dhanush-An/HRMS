import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../icons/Icons';
import { authService } from '../api/services/authService';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('Admin');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authService.login(email, password, selectedRole);
            // Use the role returned by backend, prioritized over the UI selection
            onLogin(data.role, data.user);
        } catch (err) {
            console.error('Login error:', err);
            if (!err.response) {
                setError('Server connection failed. Please ensure the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Antigraviity
                    </h1>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
                </div>

                {/* Role Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => setSelectedRole('Admin')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${selectedRole === 'Admin'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('Employee')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${selectedRole === 'Employee'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Employee
                    </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email or Username
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter your email or username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                            >
                                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-2">
                            <Link to="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium text-purple-600 hover:text-purple-500 hover:underline transition-all">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                        {!loading && <Icons.ArrowRight />}
                    </button>

                    {/* Signup Link Removed as per request */}
                </form>


            </div>
        </div>
    );
};

export default Login;
