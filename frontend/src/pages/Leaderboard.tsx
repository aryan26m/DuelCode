import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Trophy, Medal, Award, Crown, Loader2, Sparkles } from "lucide-react";
import axiosInstance from "../apis/axios";

interface LeaderboardUser {
  _id: string;
  username: string;
  cfHandle: string;
  rating: number;
  winCount: number;
}

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUserId = localStorage.getItem("userId");

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/api/auth/leaderboard");
      setUsers(Array.isArray(response.data?.leaderboard) ? response.data.leaderboard : []);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
      setError("Unable to load leaderboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />;
    if (index === 1) return <Medal className="w-6 h-6 text-zinc-300 drop-shadow-[0_0_8px_rgba(212,212,216,0.8)]" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]" />;
    return <span className="text-xl font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

  const getRowStyle = (index: number, isCurrentUser: boolean) => {
    let baseStyle = "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ";
    
    if (isCurrentUser) {
      baseStyle += "bg-primary/16 border-primary/55 shadow-[0_0_20px_rgba(139,92,246,0.28)] relative overflow-hidden z-10 ";
    } else if (index === 0) {
      baseStyle += "bg-yellow-500/10 border-yellow-500/35 hover:border-yellow-500/50 ";
    } else if (index === 1) {
      baseStyle += "bg-zinc-400/10 border-zinc-400/35 hover:border-zinc-400/50 ";
    } else if (index === 2) {
      baseStyle += "bg-amber-600/10 border-amber-600/35 hover:border-amber-600/50 ";
    } else {
      baseStyle += "bg-card/55 border-white/10 hover:bg-card/70 hover:border-primary/25 ";
    }
    
    return baseStyle;
  };

  return (
    <div className="app-shell pb-16">
      <div className="ambient-grid" />
      <div className="absolute top-[-10%] -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] -right-32 w-[600px] h-[600px] rounded-full bg-accent/16 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/12 blur-[150px] pointer-events-none -z-10" />

      <div className="page-wrap pt-10 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-5">
          <Link
            to="/dashboard"
            className="back-link rounded-full px-4 py-2 border border-white/12 bg-card/55"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl border border-white/12 bg-card/55 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Global Rankings
            </h1>
          </div>
        </div>

        <div className="glass-panel p-6 md:p-8 shadow-2xl">
          <div className="flex items-center justify-between px-4 pb-4 mb-2 border-b border-border/50 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            <div className="flex items-center gap-6 w-1/2">
              <span className="w-8 text-center">Rank</span>
              <span>Coder</span>
            </div>
            <div className="flex items-center justify-end gap-10 w-1/2">
              <span className="hidden sm:block">Wins</span>
              <span className="w-16 text-right">Rating</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="animate-pulse tracking-widest text-sm uppercase">Calculating Elo Rankings...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground gap-4">
                <div className="flex items-center gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
                <button
                  onClick={fetchLeaderboard}
                  className="status-chip hover:border-primary/40 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>No coders found. Be the first to join a battle!</p>
              </div>
            ) : (
              users.map((u, index) => {
                const isCurrentUser = u._id === currentUserId;
                return (
                 <div key={u._id} className={getRowStyle(index, isCurrentUser)}>
                    {isCurrentUser && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                    )}
                    
                    <div className="flex items-center gap-6 w-1/2 relative z-10">
                      <div className="w-8 flex justify-center">
                        {getRankIcon(index)}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-heading text-lg ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                            {u.username}
                          </span>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground flex items-center gap-1 shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                              <Sparkles className="w-3 h-3" /> YOU
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">@{u.cfHandle}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-10 w-1/2 relative z-10">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="font-bold text-foreground">{u.winCount}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Victories</span>
                      </div>
                      <div className="w-16 text-right flex flex-col items-end">
                        <span className={`font-black tracking-tight text-xl ${index === 0 ? "text-yellow-400" : isCurrentUser ? "text-primary" : "text-foreground"}`}>
                          {u.rating}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Elo</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;