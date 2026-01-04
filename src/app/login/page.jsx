/**
 * Login Page - Clean Multi-Company Login
 * 
 * Select company first, then enter credentials.
 * No dev hints or credential pre-filling.
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
import { AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

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
function LoginFlow({ skipToLogin }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');

    const [step, setStep] = useState('company');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dev button: skip to Benz login (no credentials pre-filled)
    useEffect(() => {
        if (skipToLogin && step === 'company') {
            setSelectedCompany('benz');
            setStep('login');
        }
    }, [skipToLogin, step]);

    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
    };

    const handleContinue = () => {
        if (selectedCompany) {
            setStep('login');
        }
    };

    const handleBack = () => {
        setStep('company');
        setError('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password, selectedCompany }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store user data
                localStorage.setItem('benztraq_user', JSON.stringify(data.user));
                localStorage.setItem('benztraq_company', selectedCompany);

                // Determine redirect path
                let redirectPath = '/dashboard';

                if (selectedCompany === 'ergopack') {
                    redirectPath = '/ergopack';
                } else if (redirectTo) {
                    redirectPath = redirectTo;
                } else if (data.user.role === 'developer') {
                    redirectPath = '/admin';
                }

                // Use window.location for hard navigation to ensure cookies are applied
                window.location.href = redirectPath;
            } else {
                setError(data.error || 'Invalid email or password');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Company Selection Step
    if (step === 'company') {
        return (
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-extralight tracking-widest text-white mb-2">
                        SELECT COMPANY
                    </h1>
                </div>

                <div className="space-y-4">
                    <CompanyCard
                        name="BENZ PACKAGING"
                        subtitle="Sales Performance Tracker"
                        selected={selectedCompany === 'benz'}
                        onClick={() => handleCompanySelect('benz')}
                    />
                    <CompanyCard
                        name="ERGOPACK INDIA"
                        subtitle="Outreach CRM"
                        selected={selectedCompany === 'ergopack'}
                        onClick={() => handleCompanySelect('ergopack')}
                    />
                </div>

                <Button
                    type="button"
                    onClick={handleContinue}
                    disabled={!selectedCompany}
                    className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-light tracking-wide disabled:opacity-30"
                >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );
    }

    // Login Step
    return (
        <div className="space-y-8">
            <div>
                <button
                    type="button"
                    onClick={handleBack}
                    className="text-zinc-500 hover:text-white text-sm flex items-center gap-1 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Change company
                </button>
                <h1 className="text-3xl font-extralight tracking-widest text-white mb-1">
                    {selectedCompany === 'ergopack' ? 'ERGOPACK INDIA' : 'BENZ PACKAGING'}
                </h1>
                <p className="text-zinc-500 text-sm">
                    Enter your credentials
                </p>
            </div>

            {error && (
                <Alert className="border-red-900 bg-red-950/50">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="h-12 bg-transparent border-zinc-700 text-white placeholder:text-zinc-600 focus:border-white"
                    />
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
            </form>
        </div>
    );
}

/**
 * Login page wrapper
 */
export default function LoginPage() {
    const [skipToLogin, setSkipToLogin] = useState(false);

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Dev Button - Top Right Corner - Skips to Benz login (no pre-fill) */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={() => setSkipToLogin(true)}
                    className="text-zinc-700 hover:text-zinc-400 text-xs uppercase tracking-wider transition-colors cursor-pointer px-3 py-2"
                >
                    Dev
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                        </div>
                    }>
                        <LoginFlow skipToLogin={skipToLogin} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
