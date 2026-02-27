import React from 'react';
import { TrendingUp, Target, Users, Shield, Cpu, Globe, Clock, Award, Eye, Lock, Zap } from 'lucide-react';
import BackgroundParticles from './BackgroundParticles';

const About = () => {
    return (
        <section id="about" className="py-16 bg-slate-50 dark:bg-gray-900 transition-colors duration-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950"></div>

            <BackgroundParticles isDarkOnly={true} />

            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 dark:from-emerald-400/5 dark:to-blue-400/5"></div>
                <div className="relative container mx-auto px-4 py-16 sm:py-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl mb-8 mx-auto shadow-lg">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-emerald-700 to-emerald-900 dark:from-white dark:via-emerald-300 dark:to-emerald-100 bg-clip-text text-transparent mb-6">
                            About USDT Check
                        </h1>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 mx-auto mb-8 rounded-full"></div>
                        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Protecting your digital assets through <span className="text-emerald-600 dark:text-emerald-400 font-semibold">advanced verification technology</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative container mx-auto px-4 py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {[
                            { value: "2023", label: "Founded" },
                            { value: "100K+", label: "Wallets Checked" },
                            { value: "99.9%", label: "Accuracy Rate" },
                            { value: "24/7", label: "Protection" }
                        ].map((stat, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800">
                                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{stat.value}</div>
                                    <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative container mx-auto px-4 pb-16">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Column 1 */}
                        <div className="space-y-8">
                            {/* Our Story */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl mr-4">
                                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    Our Story
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg">
                                    USDT Check was founded in 2023 by a team of blockchain security experts with a mission to make cryptocurrency safer for everyone. We recognized that as Tether (USDT) became one of the most widely used stablecoins in the world, the need for reliable verification tools grew exponentially.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                    What started as a small research project has evolved into a comprehensive security platform trusted by thousands of users worldwide. Our commitment to innovation drives us to continuously enhance our algorithms.
                                </p>
                            </div>

                            {/* Our Mission */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Target className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Our Mission
                                </h3>
                                <div className="bg-gradient-to-r from-emerald-500/5 to-blue-500/5 p-6 rounded-2xl border border-emerald-500/10">
                                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium mb-4 text-lg">
                                        To create a safer cryptocurrency ecosystem by providing accessible tools that empower users to check the security and legitimacy of USDT wallets.
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        We envision a future where cryptocurrency transactions are as secure and trusted as traditional banking.
                                    </p>
                                </div>
                            </div>

                            {/* Key Features */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Zap className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Key Features
                                </h4>
                                <div className="space-y-4">
                                    {[
                                        { icon: Cpu, title: "AI-Powered Analysis", desc: "Advanced machine learning algorithms for threat detection" },
                                        { icon: Globe, title: "Global Network", desc: "Worldwide blockchain monitoring and analysis" },
                                        { icon: Clock, title: "Real-time Scanning", desc: "Instant verification results within seconds" },
                                        { icon: Award, title: "Industry Leading", desc: "Recognized by top security experts worldwide" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-emerald-500/5 transition-colors border border-transparent hover:border-emerald-500/10">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h6>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Achievements */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Award className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Achievements
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        "Top 10 Security Tool 2024",
                                        "Major Blockchain Partners",
                                        "Zero False Positives",
                                        "Trusted Globally",
                                        "ISO 27001 Certified",
                                        "Innovation Award Winner"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            <p className="text-gray-600 dark:text-gray-300 text-sm">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-8">
                            {/* Why Choose Us */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Target className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Why Choose Us
                                </h4>
                                <div className="space-y-5">
                                    {[
                                        "Lightning-fast verification in under 3 seconds",
                                        "Comprehensive risk scoring and detailed reports",
                                        "Multi-chain support beyond just USDT networks",
                                        "24/7 customer support from security experts",
                                        "Regular security audits by third-party firms",
                                        "Free tier available with premium features"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start space-x-4">
                                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-emerald-500/20">
                                                <span className="text-white text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Our Team */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Users className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Our Team
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 text-lg">
                                    Our team consists of blockchain developers, cybersecurity experts, and financial technology specialists passionate about safety.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                    We collaborate with leading blockchain security firms and participate in industry forums to stay at the forefront of security practices.
                                </p>
                            </div>

                            {/* Core Values */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Lock className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Core Values
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { icon: Shield, title: "Security", desc: "Top priority protection of digital assets." },
                                        { icon: Eye, title: "Transparency", desc: "Clear, honest communication about risks." },
                                        { icon: Users, title: "Accessibility", desc: "Advanced tools for everyone." },
                                        { icon: Zap, title: "Innovation", desc: "Continuous improvement of methods." }
                                    ].map((item, idx) => (
                                        <div key={idx} className="group hover:bg-emerald-500/5 p-3 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-500/10">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">{item.title}</h5>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Security Standards */}
                            <div className="bg-white/5 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-200/20 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                                        <Shield className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Security Standards
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { title: "Bank-Grade Security", desc: "Military-grade encryption protecting all user data" },
                                        { title: "Real-Time Monitoring", desc: "24/7 blockchain analysis and threat detection" },
                                        { title: "Compliance Ready", desc: "GDPR, SOC 2, and regulatory compliance" },
                                        { title: "Zero Downtime", desc: "99.99% uptime with global redundancy" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <h6 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.title}</h6>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* CTA at the bottom of About */}
            <div className="relative container mx-auto px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to Secure Your Assets?</h2>
                        <p className="text-emerald-100 mb-8 text-lg">Join thousands of users who trust completely in our verification process.</p>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all duration-300 shadow-lg">
                            Get Started Now
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
