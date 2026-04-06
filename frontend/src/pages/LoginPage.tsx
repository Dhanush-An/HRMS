import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import logo from '../assets/antigraviity logo 2.jpg';



const LoginPage: React.FC = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }) // email state captures "Email or Username" input
            });

            const data = await response.json();

            if (data.success) {
                // Validate data before storage
                if (!data.token) {
                    throw new Error('Server returned success but no token was provided');
                }
                if (!data.user || !data.user.role) {
                    throw new Error('Server returned success but user data is incomplete');
                }

                // Store JWT token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                console.log(`[LOGIN] Storage successful for user: ${data.user.email} with role: ${data.user.role}`);
                if (import.meta.env.DEV) {
                    console.debug(`[LOGIN DEBUG] Token prefix: ${data.token.substring(0, 10)}...`);
                }

                const role = (data.user.role || 'employee').toLowerCase();
                if (role === 'admin') {
                    navigate('/admin-dashboard');
                } else if (role === 'hr') {
                    navigate('/hr-dashboard');
                } else {
                    navigate('/employee-dashboard');
                }
            } else {
                const detail = data.error ? ` - ${data.error}` : '';
                setError((data.message || 'Invalid credentials') + detail);
            }
        } catch (err: any) {
            console.error("[LOGIN DEBUG] Fetch attempt to:", `${API_URL}/api/login`);
            console.error("[LOGIN DEBUG] Error message:", err.message);
            console.error("[LOGIN DEBUG] Full error object:", err);
            setError(`Network Error: ${err.message || 'Check connection to backend'}`);
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#6366f1] overflow-hidden font-sans p-6 md:p-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[450px] bg-white rounded-[32px] p-8 shadow-2xl"
            >
                <div className="text-center mb-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#6366f1] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366f1]/20 mb-4 overflow-hidden">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-[#6366f1] mb-2 tracking-tight">
                        Antigraviity
                    </h1>
                    <p className="text-gray-500 text-base uppercase tracking-wide">
                        Sign in to your account
                    </p>
                </div>



                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-base font-semibold text-gray-700 block ml-1">
                            Email or Username
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full bg-[#f0f4ff] border-transparent rounded-xl py-3.5 px-5 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-base font-semibold text-gray-700 block ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-5 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all placeholder:text-gray-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-[#6366f1]/60 hover:text-[#6366f1] transition-all z-10 rounded-xl hover:bg-[#6366f1]/5"
                            >
                                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-100 rounded-xl p-3"
                        >
                            <p className="text-red-700 text-sm font-medium text-center">
                                {error}
                            </p>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 group transition-all active:scale-[0.98]"
                    >
                        <span className="text-xl">Sign In</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default LoginPage;
