/**
 * Login Page - Credentials First, Then Auto-Navigate
 * 
 * Enter email/password first.
 * If single company → auto-redirect (no company selection).
 * If multi-company → show company selector.
 * 
 * @module app/login/page
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';

/**
 * Company card component
 */
function CompanyCard({ name, subtitle, selected, onClick }) {
    return (
        <button
            onClick={onClick}
            type="button"
            className={`
                w-full p-8 rounded-lg border-2 text-left transition-all duration-200
                ${selected
                    ? 'border-white bg-white text-black'
                    : 'border-zinc-700 bg-transparent text-white hover:border-zinc-500'}
            `}
        >
            <h3 className={`text-xl font-light tracking-wide ${selected ? 'text-black' : 'text-white'}`}>
                {name}
            </h3>
            <p className={`text-sm mt-1 ${selected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                {subtitle}
            </p>
        </button>
    );
}

/**
 * Main Login Component
 */
function LoginFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');

    // Step: 'credentials' or 'company'
    const [step, setStep] = useState('credentials');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Authenticated user data (after credentials validated)
    const [authenticatedUser, setAuthenticatedUser] = useState(null);

    const finalizeLogin = async (company) => {
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password, selectedCompany: company }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('benztraq_user', JSON.stringify(data.user));
                localStorage.setItem('benztraq_company', company);

                let redirectPath = '/dashboard';
                if (company === 'ergopack') {
                    redirectPath = '/ergopack';
                } else if (data.user.role === 'store_manager') {
                    redirectPath = '/inventory';
                } else if (redirectTo) {
                    redirectPath = redirectTo;
                } else if (data.user.role === 'developer') {
                    redirectPath = '/admin';
                }

                window.location.href = redirectPath;
            } else {
                setError(data.error || 'Login failed');
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connection error. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Step 1: Validate credentials without company selection
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const userCompanies = data.user.companies || [];
                setAuthenticatedUser(data.user);

                if (userCompanies.length <= 1) {
                    // Single company or no companies — auto-navigate
                    const company = userCompanies[0] || 'benz';
                    await finalizeLogin(company);
                } else {
                    // Multiple companies — show company picker
                    setStep('company');
                    setIsSubmitting(false);
                }
            } else {
                setError(data.error || 'Invalid email or password');
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connection error. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
    };

    const handleCompanyContinue = async () => {
        if (selectedCompany) {
            await finalizeLogin(selectedCompany);
        }
    };

    const handleBack = () => {
        setStep('credentials');
        setSelectedCompany(null);
        setError('');
    };

    // Company Selection Step (only for multi-company users like directors)
    if (step === 'company') {
        return (
            <div className="space-y-8">
                <div>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-zinc-500 hover:text-white text-sm flex items-center gap-1 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back
                    </button>
                    <h1 className="text-3xl font-extralight tracking-widest text-white mb-2">
                        SELECT COMPANY
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Welcome, {authenticatedUser?.fullName || email}
                    </p>
                </div>

                {error && (
                    <Alert className="border-red-900 bg-red-950/50">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {(authenticatedUser?.companies || []).includes('benz') && (
                        <CompanyCard
                            name="BENZ PACKAGING"
                            subtitle="Sales Performance & ERP"
                            selected={selectedCompany === 'benz'}
                            onClick={() => handleCompanySelect('benz')}
                        />
                    )}
                    {(authenticatedUser?.companies || []).includes('ergopack') && (
                        <CompanyCard
                            name="ERGOPACK INDIA"
                            subtitle="Outreach CRM"
                            selected={selectedCompany === 'ergopack'}
                            onClick={() => handleCompanySelect('ergopack')}
                        />
                    )}
                </div>

                <Button
                    type="button"
                    onClick={handleCompanyContinue}
                    disabled={!selectedCompany || isSubmitting}
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-light tracking-wide disabled:opacity-30"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        );
    }

    // Credentials Step (default)
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-extralight tracking-widest text-white mb-2">
                    BENZERP
                </h1>
                <p className="text-zinc-500 text-sm">
                    Sign in to continue
                </p>
            </div>

            {error && (
                <Alert className="border-red-900 bg-red-950/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Email</Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@company.com"
                        className="h-12 bg-transparent border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Password</Label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="h-12 bg-transparent border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-light tracking-wide"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </Button>

                <div className="text-center">
                    <a
                        href="/forgot-password"
                        className="text-zinc-500 hover:text-white text-sm transition-colors"
                    >
                        Forgot your password?
                    </a>
                </div>
            </form>
        </div>
    );
}

/**
 * Login page wrapper
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                        </div>
                    }>
                        <LoginFlow />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
