/**
 * Director App Grid - Ultra Premium App Launcher
 * 
 * Luxury-grade interface with:
 * - Playfair Display serif font for elegant headings
 * - Rich jewel-tone color palette (deep navy, gold, emerald)
 * - Glassmorphism with backdrop blur
 * - Refined micro-animations
 * - Prominent Ergopack banner with dark luxury aesthetic
 * 
 * @module components/dashboard/DirectorAppGrid
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

/**
 * All director app modules with luxury jewel-tone palette
 */
const DIRECTOR_APPS = [
    { title: 'Dashboard', subtitle: 'Sales Overview', href: '/dashboard?view=analytics', gradient: 'linear-gradient(145deg, #4F46E5, #7C3AED)', shadowColor: 'rgba(99,102,241,0.35)', icon: 'grid' },
    { title: 'Documents', subtitle: 'Quotes & Orders', href: '/documents', gradient: 'linear-gradient(145deg, #0284C7, #0EA5E9)', shadowColor: 'rgba(14,165,233,0.35)', icon: 'file' },
    { title: 'Tasks', subtitle: 'Team Tasks', href: '/tasks', gradient: 'linear-gradient(145deg, #D97706, #F59E0B)', shadowColor: 'rgba(245,158,11,0.35)', icon: 'check' },
    { title: 'Pipeline', subtitle: 'CRM Deals', href: '/crm/pipeline', gradient: 'linear-gradient(145deg, #059669, #10B981)', shadowColor: 'rgba(16,185,129,0.35)', icon: 'flow' },
    { title: 'Customers', subtitle: 'Client Database', href: '/customers', gradient: 'linear-gradient(145deg, #DB2777, #EC4899)', shadowColor: 'rgba(236,72,153,0.35)', icon: 'users' },
    { title: 'Analytics', subtitle: 'Deep Insights', href: '/analytics', gradient: 'linear-gradient(145deg, #2563EB, #3B82F6)', shadowColor: 'rgba(59,130,246,0.35)', icon: 'chart' },
    { title: 'Performance', subtitle: 'Scoreboards', href: '/performance', gradient: 'linear-gradient(145deg, #B45309, #D97706)', shadowColor: 'rgba(217,119,6,0.35)', icon: 'trophy' },
    { title: 'Inventory', subtitle: 'Stock Control', href: '/inventory', gradient: 'linear-gradient(145deg, #57534E, #78716C)', shadowColor: 'rgba(120,113,108,0.35)', icon: 'box' },
    { title: 'Comparison', subtitle: 'Quote Analysis', href: '/comparison', gradient: 'linear-gradient(145deg, #0D9488, #14B8A6)', shadowColor: 'rgba(20,184,166,0.35)', icon: 'compare' },
    { title: 'Products', subtitle: 'Catalog', href: '/products', gradient: 'linear-gradient(145deg, #9333EA, #A855F7)', shadowColor: 'rgba(168,85,247,0.35)', icon: 'package' },
    { title: 'Regions', subtitle: 'Territory Map', href: '/regions', gradient: 'linear-gradient(145deg, #DC2626, #EF4444)', shadowColor: 'rgba(239,68,68,0.35)', icon: 'map' },
    { title: 'Targets', subtitle: 'Goals & KPIs', href: '/targets', gradient: 'linear-gradient(145deg, #16A34A, #22C55E)', shadowColor: 'rgba(34,197,94,0.35)', icon: 'target' },
    { title: 'Reports', subtitle: 'AI Generated', href: '/reports', gradient: 'linear-gradient(145deg, #4338CA, #6366F1)', shadowColor: 'rgba(99,102,241,0.35)', icon: 'report' },
    { title: 'Director Hub', subtitle: 'Admin Panel', href: '/admin/dashboard', gradient: 'linear-gradient(145deg, #1E293B, #334155)', shadowColor: 'rgba(51,65,85,0.35)', icon: 'shield' },
    { title: 'Settings', subtitle: 'Preferences', href: '/settings', gradient: 'linear-gradient(145deg, #475569, #64748B)', shadowColor: 'rgba(100,116,139,0.35)', icon: 'gear' },
];

/**
 * Premium SVG icon set — crisp white icons on gradient backgrounds
 */
function TileIcon({ name }) {
    const svgs = {
        grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" /><rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" opacity="0.7" /><rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.7" /><rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" opacity="0.5" /></>,
        file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="white" opacity="0.3" /><polyline points="14,2 14,8 20,8" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="17" x2="12" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></>,
        check: <><rect x="3" y="3" width="18" height="18" rx="3" fill="white" opacity="0.2" /><polyline points="8,12 11,15 16,9" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></>,
        flow: <><circle cx="5" cy="6" r="2.5" fill="white" /><circle cx="19" cy="18" r="2.5" fill="white" /><circle cx="19" cy="6" r="2.5" fill="white" opacity="0.5" /><path d="M7.5 6c3 0 4 6 6 6s3-6 6-6" fill="none" stroke="white" strokeWidth="1.5" /><path d="M7.5 12c3 0 4 6 6 6" fill="none" stroke="white" strokeWidth="1.5" /></>,
        users: <><circle cx="9" cy="7" r="3.5" fill="white" /><path d="M2 20c0-3.5 3.5-6 7-6s7 2.5 7 6" fill="white" opacity="0.4" /><circle cx="17" cy="8" r="2.5" fill="white" opacity="0.6" /><path d="M17 13c2.5 0.5 5 2 5 4.5" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" /></>,
        chart: <><rect x="3" y="13" width="4" height="8" rx="1" fill="white" opacity="0.5" /><rect x="10" y="8" width="4" height="13" rx="1" fill="white" opacity="0.7" /><rect x="17" y="3" width="4" height="18" rx="1" fill="white" /></>,
        trophy: <><path d="M6 9a6 6 0 0012 0V3H6v6z" fill="white" opacity="0.3" /><path d="M12 15v3" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M8 21h8" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M6 3H4a1 1 0 00-1 1v2c0 2 1.5 3.5 3 4" fill="none" stroke="white" strokeWidth="1.5" /><path d="M18 3h2a1 1 0 011 1v2c0 2-1.5 3.5-3 4" fill="none" stroke="white" strokeWidth="1.5" /></>,
        box: <><path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" fill="white" opacity="0.2" /><path d="M3 7l9 4 9-4" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 11v10" stroke="white" strokeWidth="1.5" /><path d="M3 7l9-4 9 4" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /></>,
        compare: <><rect x="2" y="4" width="8" height="16" rx="2" fill="white" opacity="0.5" /><rect x="14" y="4" width="8" height="16" rx="2" fill="white" opacity="0.7" /><path d="M12 7v10" stroke="white" strokeWidth="1.5" strokeDasharray="2 2.5" /></>,
        package: <><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" fill="white" opacity="0.25" stroke="white" strokeWidth="1.3" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="white" strokeWidth="1.5" /></>,
        map: <><path d="M12 2C7.6 2 4 5.4 4 9.5c0 6 8 12.5 8 12.5s8-6.5 8-12.5C20 5.4 16.4 2 12 2z" fill="white" opacity="0.3" stroke="white" strokeWidth="1.5" /><circle cx="12" cy="9.5" r="3" fill="white" /></>,
        target: <><circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" /><circle cx="12" cy="12" r="5.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" /><circle cx="12" cy="12" r="2.2" fill="white" /></>,
        report: <><rect x="4" y="2" width="16" height="20" rx="2.5" fill="white" opacity="0.2" stroke="white" strokeWidth="1.3" /><line x1="8" y1="7" x2="16" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="11" x2="16" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><line x1="8" y1="15" x2="12" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></>,
        shield: <><path d="M12 2l8 4v5c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" fill="white" opacity="0.3" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><polyline points="9,12 11,14 15,10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
        gear: <><circle cx="12" cy="12" r="3" fill="white" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" /></>,
    };
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            {svgs[name] || svgs.grid}
        </svg>
    );
}

/**
 * Premium App Tile with hover glow effect
 */
function AppTile({ app, index }) {
    return (
        <Link
            href={app.href}
            className="group relative flex flex-col items-center gap-3.5 py-6 px-4 rounded-2xl cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2"
            style={{ animation: `fadeUp 0.4s ease-out ${index * 50}ms both` }}
        >
            {/* Background card — appears on hover */}
            <div className="absolute inset-0 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-black/[0.03]" />

            {/* Icon container with gradient + glow */}
            <div className="relative">
                <div
                    className="w-[56px] h-[56px] rounded-[14px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-[2deg]"
                    style={{
                        background: app.gradient,
                        boxShadow: `0 4px 14px ${app.shadowColor}`,
                    }}
                >
                    <TileIcon name={app.icon} />
                </div>
                {/* Glow ring on hover */}
                <div
                    className="absolute -inset-1 rounded-[18px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-md -z-10"
                    style={{ background: app.gradient }}
                />
            </div>

            {/* Labels */}
            <div className="relative text-center">
                <p className="text-[13px] font-semibold text-[#1a1a2e] tracking-[-0.01em] leading-tight"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    {app.title}
                </p>
                <p className="text-[10px] text-[#8b8fa3] mt-0.5 font-medium tracking-wide uppercase"
                    style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}>
                    {app.subtitle}
                </p>
            </div>
        </Link>
    );
}

/**
 * Director App Grid — Ultra Premium Full-Screen Launcher
 */
export default function DirectorAppGrid() {
    const { profile, signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const firstName = profile?.full_name?.split(' ')[0] || 'Director';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await signOut();
    };

    return (
        <>
            {/* Import premium Google Font */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>

            <div className="min-h-screen relative overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #faf9f7 0%, #f3f1ee 25%, #edeaf0 50%, #f0eff5 75%, #f5f4f2 100%)',
                }}
            >
                {/* Subtle luxury background accents */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%)' }} />
                    <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03), transparent 70%)' }} />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.02), transparent 70%)' }} />
                    {/* Fine dot pattern */}
                    <div className="absolute inset-0 opacity-[0.15]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #c4b5a0 0.5px, transparent 0.5px)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                </div>

                {/* Header bar */}
                <header className="relative flex items-center justify-between px-10 py-5"
                    style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center shadow-lg shadow-slate-900/20">
                            <img src="/assets/blue-logo.png" alt="Benz" className="w-5 h-5 object-contain" />
                        </div>
                        <div className="flex items-baseline gap-2.5">
                            <span className="text-[15px] font-bold text-[#0f172a] tracking-tight"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                BENZERP
                            </span>
                            <span className="text-[10px] text-[#a09cb0] font-semibold uppercase tracking-[0.15em]"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Enterprise Suite
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 text-[#8b8fa3] hover:text-[#0f172a] hover:bg-white/70 hover:shadow-sm"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        <LogOut className="w-4 h-4" />
                        {isSigningOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                </header>

                {/* Main content */}
                <div className="relative max-w-[900px] mx-auto px-6 pt-4 pb-16">
                    {/* Greeting — Elegant serif heading */}
                    <div className="text-center mb-12" style={{ animation: 'fadeUp 0.5s ease-out' }}>
                        <h1 className="text-[38px] text-[#0f172a] mb-2 leading-tight"
                            style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>
                            {greeting}, {firstName}
                        </h1>
                        <p className="text-[14px] text-[#9ca3af] font-medium tracking-wide"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            What would you like to work on today?
                        </p>
                    </div>

                    {/* App Grid — 5 columns */}
                    <div className="grid grid-cols-5 gap-1 mb-10">
                        {DIRECTOR_APPS.map((app, i) => (
                            <AppTile key={app.href} app={app} index={i} />
                        ))}
                    </div>

                    {/* Ergopack — Premium Dark Card */}
                    <Link
                        href="/ergopack"
                        className="group relative block w-full rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-0.5"
                        style={{ animation: 'fadeUp 0.5s ease-out 0.6s both' }}
                    >
                        {/* Dark luxury background */}
                        <div className="absolute inset-0"
                            style={{ background: 'linear-gradient(135deg, #0c0c1d 0%, #141428 40%, #1a1a35 70%, #0f172a 100%)' }}
                        />

                        {/* Decorative luxury accents */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
                                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)' }}
                            />
                            <div className="absolute -bottom-16 left-1/3 w-48 h-48 rounded-full"
                                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }}
                            />
                            {/* Gold shimmer line */}
                            <div className="absolute top-0 left-0 right-0 h-px"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(196,181,160,0.3) 30%, rgba(196,181,160,0.5) 50%, rgba(196,181,160,0.3) 70%, transparent)',
                                }}
                            />
                        </div>

                        {/* Content */}
                        <div className="relative flex items-center justify-between px-9 py-7">
                            <div className="flex items-center gap-6">
                                {/* Icon with emerald glow */}
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 group-hover:border-emerald-400/30 transition-all duration-300"
                                    style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-emerald-400">
                                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" fill="currentColor" opacity="0.25" />
                                        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M7.5 4.5L12 7l4.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>

                                <div>
                                    <h3 className="flex items-center gap-3"
                                        style={{ fontFamily: "'DM Serif Display', serif" }}>
                                        <span className="text-[20px] text-white tracking-wide">Ergopack India</span>
                                        <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-[0.12em] border border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                            CRM
                                        </span>
                                    </h3>
                                    <p className="text-[13px] text-[#6b7280] mt-1 font-medium"
                                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        Outreach CRM · Lead Management · Quotation Builder
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[#4b5563] group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                                <span className="text-[13px] font-semibold hidden sm:inline"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    Open
                                </span>
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </>
    );
}
