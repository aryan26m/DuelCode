import { useState } from "react";
import { ArrowRight, Code2, Loader2, Lock, Mail, RotateCcw, ShieldCheck, Trophy, User } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../apis/axios";
import { useNavigate } from "react-router-dom";
import { socket } from '../socket';

type RegisterStep = "details" | "otp";

const getApiErrorMessage = (err: any, fallback: string) => {
  return err?.response?.data?.message || fallback;
};

const RegisterCard = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cfHandle, setCfHandle] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<RegisterStep>("details");
  const [info, setInfo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async () => {
    if (!username || !email || !password || !cfHandle) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setError("");
      setInfo("");
      setIsSubmitting(true);

      const response = await api.post("/api/auth/register", {
        username,
        email,
        password,
        cfHandle,
      });

      const normalizedEmail = email.trim().toLowerCase();
      setPendingEmail(response.data?.email || normalizedEmail);
      setStep("otp");
      setOtp("");
      setInfo("OTP sent to your email. Enter the 6-digit code to verify your account.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send OTP. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }

    try {
      setError("");
      setInfo("");
      setIsSubmitting(true);

      const response = await api.post("/api/auth/register/verify-otp", {
        email: pendingEmail || email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.user.id);
      socket.connect();
      navigate("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "OTP verification failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") {
      await requestOtp();
      return;
    }
    await verifyOtpAndRegister();
  };

  const handleResendOtp = async () => {
    await requestOtp();
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Code2 className="w-8 h-8 text-primary" />
        <span className="font-heading text-2xl font-bold text-foreground">DuelCode</span>
      </div>

      <div className="glass-panel glow-border p-8 sm:p-9">
        <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
          Create an account
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Join the platform and start coding
        </p>

        {info && (
          <div className="mb-6 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {info}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === "details" ? (
            <>
              <div className="space-y-2">
                <label htmlFor="register-username" className="text-sm font-medium text-foreground">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input pl-10"
                    autoComplete="username"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-10"
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-10"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-cf" className="text-sm font-medium text-foreground">Codeforces Handle</label>
                <div className="relative">
                  <Trophy className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-cf"
                    type="text"
                    placeholder="e.g. tourist"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value)}
                    className="form-input pl-10 border-primary/45"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  Enter your Codeforces handle to track submissions
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-primary/35 bg-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email verification required</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We sent a 6-digit OTP to <span className="text-foreground font-medium">{pendingEmail || email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="register-otp" className="text-sm font-medium text-foreground">OTP Code</label>
                <input
                  id="register-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="form-input text-center text-2xl font-heading tracking-[0.35em]"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-border bg-secondary/50 py-3 text-sm font-semibold text-secondary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setError("");
                    setInfo("");
                  }}
                  disabled={isSubmitting}
                  className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm font-medium text-muted-foreground disabled:opacity-60"
                >
                  Edit
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="glow-button w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-65 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {step === "details" ? "Sending OTP..." : "Verifying OTP..."}
              </>
            ) : (
              <>
                {step === "details" ? "Send OTP" : "Verify OTP & Create Account"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterCard;
