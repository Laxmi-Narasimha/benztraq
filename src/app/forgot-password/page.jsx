/**
 * Forgot Password Page
 * 
 * Multi-step password reset flow:
 * 1. Enter email → Request OTP
 * 2. Enter OTP → Verify
 * 3. Enter new password → Reset
 * 
 * @module app/forgot-password/page
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Mail, ArrowLeft, Loader2, KeyRound, Lock,
    CheckCircle, AlertCircle, Eye, EyeOff, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OTP countdown
    const [countdown, setCountdown] = useState(0);

    // OTP input refs
    const otpRefs = useRef([]);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle email submission
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('OTP sent to your email');
                setStep(2);
                setCountdown(60); // 60 seconds before resend allowed
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take only last digit
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        pasteData.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        if (pasteData.length === 6) {
            otpRefs.current[5]?.focus();
        }
    };

    // Handle OTP verification
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('OTP verified');
                setResetToken(data.resetToken);
                setStep(3);
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resetToken, newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Password changed successfully!');
                setStep(4);
            } else {
                setError(data.error || 'Failed to reset password');
                if (data.details) {
                    setError(data.details.join(', '));
                }
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (countdown > 0) return;
        setOtp(['', '', '', '', '', '']);
        await handleRequestOTP({ preventDefault: () => { } });
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                        {step === 4 ? (
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : (
                            <Shield className="w-6 h-6 text-white" />
                        )}
                    </div>
                    <CardTitle className="text-xl font-light text-white">
                        {step === 1 && 'Reset Password'}
                        {step === 2 && 'Enter Verification Code'}
                        {step === 3 && 'Create New Password'}
                        {step === 4 && 'Password Changed!'}
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        {step === 1 && 'Enter your email to receive a verification code'}
                        {step === 2 && `We sent a 6-digit code to ${email}`}
                        {step === 3 && 'Choose a strong password for your account'}
                        {step === 4 && 'You can now login with your new password'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@company.com"
                                        required
                                        className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black hover:bg-zinc-200"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Send Verification Code</>
                                )}
                            </Button>

                            <Link href="/login" className="block text-center">
                                <Button variant="ghost" type="button" className="text-zinc-500 hover:text-white">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Login
                                </Button>
                            </Link>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                                {otp.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={(el) => (otpRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className={cn(
                                            "w-12 h-14 text-center text-xl font-mono bg-zinc-800/50 border-zinc-700 text-white",
                                            digit && "border-white/30"
                                        )}
                                    />
                                ))}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || otp.join('').length !== 6}
                                className="w-full bg-white text-black hover:bg-zinc-200"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Verify Code</>
                                )}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={countdown > 0}
                                    className={cn(
                                        "text-sm",
                                        countdown > 0 ? "text-zinc-600" : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    {countdown > 0
                                        ? `Resend code in ${countdown}s`
                                        : "Didn't receive code? Resend"
                                    }
                                </button>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="w-full text-zinc-500 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Change Email
                            </Button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
                                    />
                                </div>
                            </div>

                            <ul className="text-xs text-zinc-600 space-y-1">
                                <li className={cn(newPassword.length >= 8 && "text-emerald-500")}>
                                    • At least 8 characters
                                </li>
                                <li className={cn(/[A-Z]/.test(newPassword) && "text-emerald-500")}>
                                    • One uppercase letter
                                </li>
                                <li className={cn(/[a-z]/.test(newPassword) && "text-emerald-500")}>
                                    • One lowercase letter
                                </li>
                                <li className={cn(/[0-9]/.test(newPassword) && "text-emerald-500")}>
                                    • One number
                                </li>
                                <li className={cn(/[!@#$%^&*]/.test(newPassword) && "text-emerald-500")}>
                                    • One special character (!@#$%^&*)
                                </li>
                            </ul>

                            <Button
                                type="submit"
                                disabled={isLoading || newPassword !== confirmPassword}
                                className="w-full bg-white text-black hover:bg-zinc-200"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Reset Password</>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <p className="text-zinc-400 text-sm">
                                Your password has been successfully changed.
                            </p>
                            <Link href="/login">
                                <Button className="w-full bg-white text-black hover:bg-zinc-200">
                                    Continue to Login
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
