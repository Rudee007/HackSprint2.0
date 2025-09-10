import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Leaf, Sparkles, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { therapistAuthService } from '../services/therapistAuthService';

const TherapistLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await therapistAuthService.loginTherapist(username, password);

        if (result.success) {
            navigate('/therapist-dashboard');
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-green-400/25 to-emerald-500/15 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3.5s' }}></div>
                <div className="absolute top-1/5 right-1/5 w-64 h-64 bg-gradient-to-bl from-teal-300/20 to-emerald-400/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '22s' }}></div>
                <div className="absolute bottom-1/5 left-1/5 w-52 h-52 bg-gradient-to-tr from-green-400/15 to-teal-500/20 rounded-full blur-2xl animate-ping" style={{ animationDuration: '4.5s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-conic from-emerald-400/5 via-teal-400/10 to-green-400/5 rounded-full blur-3xl animate-spin" style={{ animationDuration: '28s' }}></div>
                <div className="absolute top-3/4 right-1/3 w-40 h-40 bg-gradient-to-br from-teal-400/20 to-emerald-300/15 rounded-full blur-xl animate-pulse" style={{ animationDuration: '2s' }}></div>
                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-radial from-emerald-500/3 via-transparent to-transparent animate-pulse" style={{ animationDuration: '8s' }}></div>
                {/* Modern grid overlay */}
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 0 0'}}></div>
                {/* Vignette */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35))]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 flex items-center justify-center min-h-screen">
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500 w-full">
                    {/* Gradient border animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-[1px] bg-emerald-900/90 rounded-3xl"></div>
                    {/* Sheen */}
                    <div className="pointer-events-none absolute -top-1/2 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent translate-y-0 group-hover:translate-y-full transition-transform duration-700"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="relative mx-auto mb-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                    <Heart className="w-10 h-10 text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                                    <Sparkles className="w-3 h-3 text-green-900" />
                                </div>
                            </div>
                            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-3">Therapist Portal</h1>
                            <p className="text-emerald-100/80 text-lg font-medium">Healing & wellness center</p>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center justify-center space-x-8">
                                <div className="flex flex-col items-center space-y-2 group">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                        <Heart className="w-6 h-6 text-emerald-300" />
                                    </div>
                                    <span className="text-xs text-emerald-200 font-medium">Healing</span>
                                </div>
                                <div className="w-px h-12 bg-gradient-to-b from-transparent via-teal-400/50 to-transparent"></div>
                                <div className="flex flex-col items-center space-y-2 group">
                                    <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                                        <Leaf className="w-6 h-6 text-teal-300" />
                                    </div>
                                    <span className="text-xs text-teal-200 font-medium">Wellness</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6" aria-label="Therapist login form">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    <p className="text-red-300 font-medium">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-emerald-200 font-medium mb-2" htmlFor="therapist-username">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        id="therapist-username"
                                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus-visible:outline-none"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-emerald-200 font-medium mb-2" htmlFor="therapist-password">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        id="therapist-password"
                                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-400 focus:border-transparent focus-visible:outline-none"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100 transition-all duration-200 flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/40"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Logging in...</span>
                                    </>
                                ) : (
                                    <span>Login to Dashboard</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TherapistLogin;