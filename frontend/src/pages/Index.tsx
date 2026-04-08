import { Button } from "@/components/ui/button";
import Particles from "@/components/Particles";
import TerminalCard from "@/components/TerminalCard";
import { Code2, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="app-shell text-foreground">
      <Particles />
      <div className="ambient-grid" />

      <div className="absolute top-14 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 -right-16 w-72 h-72 rounded-full bg-accent/18 blur-[130px] pointer-events-none" />

      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(263 70% 58% / 0.12) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="page-wrap min-h-screen grid items-center py-10 md:py-14">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 xl:gap-12 items-center relative z-10">
          <section className="space-y-6 animate-[fade-in_0.45s_ease-out]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20">
                <Swords className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-foreground font-heading">
                DuelCode
              </h2>
            </div>

            <span className="section-kicker">
              <Sparkles className="w-3.5 h-3.5" />
              Real-Time Competitive Coding
            </span>

            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.03] text-balance">
              <span className="text-gradient">Challenge.</span>{" "}
              <span className="text-foreground">Solve.</span>{" "}
              <span className="text-gradient">Win.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl text-balance">
              Enter ranked battles, solve Codeforces problems under pressure, and rise through the global leaderboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <Button variant="glow" size="lg" className="text-base px-10 py-6 rounded-xl" onClick={() => navigate("/register")}>
                <Code2 className="w-5 h-5" />
                Create Account
              </Button>
              <Button variant="glow-outline" size="lg" className="text-base px-10 py-6 rounded-xl" onClick={() => navigate("/login")}>
                Login
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="status-chip">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                Instant matchmaking
              </div>
              <div className="status-chip">
                <Trophy className="w-3.5 h-3.5 text-primary" />
                Elo leaderboard tracking
              </div>
            </div>
          </section>

          <section className="glass-panel p-4 sm:p-6 animate-[fade-in_0.7s_ease-out]">
            <TerminalCard />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
