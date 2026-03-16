import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

interface OtpVerificationProps {
  phoneNumber: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isVerifying: boolean;
  error: string;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({
  phoneNumber,
  onVerify,
  onResend,
  onBack,
  isVerifying,
  error,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      onVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array(6).fill('');
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pasted.length === 6) {
      onVerify(pasted);
    }
  };

  const handleResend = async () => {
    await onResend();
    setResendTimer(30);
    setOtp(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  const maskedPhone = phoneNumber.replace(/(\+\d{2})\d+(\d{4})/, '$1****$2');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <KeyRound className="text-emerald-600" size={36} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verify OTP</h2>
        <p className="text-slate-400 text-sm font-bold mt-2">
          Enter the 6-digit code sent to <span className="text-slate-600">{maskedPhone}</span>
        </p>
      </div>

      {/* OTP Input Grid */}
      <div className="flex justify-center gap-3" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isVerifying}
            className={`w-12 h-14 text-center text-xl font-black rounded-2xl border-2 transition-all outline-none ${
              digit
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            } focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
            ${isVerifying ? 'opacity-50 cursor-wait' : ''}`}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-center">
          <p className="text-[11px] font-black uppercase">{error}</p>
        </div>
      )}

      {/* Verifying Spinner */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-3 text-emerald-600">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-black uppercase tracking-widest">Verifying...</span>
        </div>
      )}

      {/* Resend */}
      <div className="text-center">
        {resendTimer > 0 ? (
          <p className="text-slate-400 text-xs font-bold">
            Resend code in <span className="text-slate-600 font-black">{resendTimer}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-rose-600 text-xs font-black uppercase tracking-widest hover:underline"
          >
            Resend Code
          </button>
        )}
      </div>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
      >
        <ArrowLeft size={14} /> Change Phone Number
      </button>
    </div>
  );
};

export default OtpVerification;
