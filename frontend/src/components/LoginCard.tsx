import { useState } from "react";
import { ArrowRight, Code2, Loader2, Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../apis/axios";
import { useNavigate } from "react-router-dom";
import { socket } from '../socket'; 

const getApiErrorMessage = (err: any, fallback: string) => {
  return err?.response?.data?.message || fallback;
};

const LoginCard = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit=async(e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try{
      setError("");
      setIsSubmitting(true);

      const normalizedEmail = email.trim().toLowerCase();
      const response=await api.post("/api/auth/login",{
        email: normalizedEmail,
        password
      });

      localStorage.setItem("token",response.data.token);
      localStorage.setItem('userId', response.data.user.id);
      socket.connect();
      navigate("/dashboard");
    }
    catch(err){
      setError(getApiErrorMessage(err, "Login failed. Please check your credentials and try again."));
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Code2 className="w-8 h-8 text-primary" />
        <span className="font-heading text-2xl font-bold text-foreground">
          DuelCode
        </span>
      </div>

      <div className="glass-panel glow-border p-8 sm:p-9">
        <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Sign in to your account to continue
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
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
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-10"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="glow-button w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-65 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginCard;
