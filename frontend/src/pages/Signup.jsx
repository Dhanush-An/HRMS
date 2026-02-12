import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import { authService } from '../api/services/authService';
import { Link } from 'react-router-dom';

const Signup = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Password strength logic
    const getPasswordStrength = (pass) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length > 6) score++;
        if (pass.length > 10) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };

    const strength = getPasswordStrength(password);

    const getStrengthColor = (score) => {
        if (score === 0) return 'bg-gray-200';
        if (score < 3) return 'bg-red-500';
        if (score < 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (score) => {
        if (score === 0) return '';
        if (score < 3) return 'Weak';
        if (score < 4) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (strength < 3) {
            setError('Password is too weak. Try adding numbers, symbols, or uppercase letters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const data = await authService.register(name, email, password);
            if (data.status === 'Pending') {
                setError('Registration successful! Please wait for admin approval.');
                setLoading(false);
                return;
            }
            // Auto-login after successful registration (if not pending)
            onLogin(data.role, data.user);
        } catch (err) {
            console.error('Signup error:', err);
            if (!err.response) {
                setError('Server connection failed. Please ensure the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Registration failed');
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
                    <p className="text-gray-500 mt-2">Create your account</p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter your email"
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
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10 ${error && error.includes('Password') ? 'border-red-300 focus:ring-red-200' : 'border-gray-300'
                                    }`}
                                placeholder="Create a password"
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
                        {/* Password Strength Meter */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 font-medium">Strength</span>
                                    <span className={`text-xs font-bold ${strength < 3 ? 'text-red-500' : strength < 4 ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        {getStrengthText(strength)}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getStrengthColor(strength)} transition-all duration-300 ease-out`}
                                        style={{ width: `${(strength / 5) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 flex gap-2">
                                    <span className={password.length >= 8 ? 'text-green-600' : ''}>• 8+ chars</span>
                                    <span className={/[0-9]/.test(password) ? 'text-green-600' : ''}>• Numbers</span>
                                    <span className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>• Uppercase</span>
                                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>• Symbols</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10"
                                placeholder="Confirm your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                            >
                                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
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
                        <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                        {!loading && <Icons.ArrowRight />}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-500 hover:underline transition-all">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
