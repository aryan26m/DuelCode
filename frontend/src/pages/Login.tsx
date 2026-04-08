import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "@/components/LoginCard";
import { Gift, Sparkles, Swords, Zap } from "lucide-react";

const Login = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            navigate('/dashboard');
        }
    }, [navigate]);

    return (
        <div className="app-shell">
            <div className="ambient-grid" />
            <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 -right-24 h-80 w-80 rounded-full bg-accent/15 blur-[130px] pointer-events-none" />

            <div className="page-wrap grid min-h-screen items-center py-10">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="glass-panel-soft hidden lg:flex flex-col justify-between p-8 xl:p-10">
                        <div className="space-y-5">
                            <span className="section-kicker">
                                <Sparkles className="h-3.5 w-3.5" />
                                Competitive Coding Platform
                            </span>
                            <h1 className="text-4xl xl:text-5xl font-heading font-black leading-tight text-balance">
                                Return to the arena and keep climbing.
                            </h1>
                            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                                Real-time battles, automatic judging, and Elo-based rankings in one focused interface built for speed.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <div className="status-chip w-fit">
                                <Swords className="h-3.5 w-3.5 text-primary" />
                                Friend and random matchmaking
                            </div>
                            <div className="status-chip w-fit">
                                <Zap className="h-3.5 w-3.5 text-yellow-300" />
                                Live socket sync and instant transitions
                            </div>
                            <div className="rounded-2xl border border-red-400/35 bg-red-500/10 px-4 py-3 max-w-lg">
                                <p className="text-sm font-heading font-black text-red-200">Code. Conquer. Claim.</p>
                                <p className="text-xs text-red-100/90 mt-1">Hit a 30-day streak to win official merch!</p>
                                <div className="mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-red-200">
                                    <Gift className="h-3 w-3" />
                                    30-Day Streak Challenge
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex items-center justify-center">
                        <LoginCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
