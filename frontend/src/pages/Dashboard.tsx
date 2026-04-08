import { Activity, AlertCircle, CalendarDays, Flame, Gift, Loader2, LogOut, Plus, Shuffle, Swords, Trophy, User, Users, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, type ComponentType, type SVGProps } from "react";
import { socket } from '../socket';
import { useProfile } from "../hooks/getProfile";

type DashboardAction = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  gradient: string;
  route?: string;
  id: "create" | "join" | "random";
  badge: string;
};

const actions: DashboardAction[] = [
  {
    icon: Plus,
    title: "Create Room",
    description: "Host a coding battle and invite friends",
    gradient: "from-primary to-accent",
    route: "/create-room",
    id: "create",
    badge: "Host"
  },
  {
    icon: Users,
    title: "Join Room",
    description: "Enter a room code to join an existing match",
    gradient: "from-accent to-primary",
    route: "/join-room",
    id: "join",
    badge: "Invite"
  },
  {
    icon: Shuffle,
    title: "Play Random Match",
    description: "Get matched with a random opponent instantly",
    gradient: "from-primary via-accent to-primary",
    id: "random",
    badge: "Instant"
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const { user, streakMeta, isLoading } = useProfile();

  const currentStreak = user?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? 0;
  const streakTier = user?.streakTier || "Rookie";
  const nextRewardIn = streakMeta?.nextMilestoneIn ?? 7;
  const rewardAwarded = streakMeta?.rewardAwarded ?? 0;

  const hasStreakToday = (() => {
    if (!user?.lastStreakDate) return false;
    const last = new Date(user.lastStreakDate);
    const now = new Date();
    return (
      last.getUTCFullYear() === now.getUTCFullYear() &&
      last.getUTCMonth() === now.getUTCMonth() &&
      last.getUTCDate() === now.getUTCDate()
    );
  })();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.on('online_users_count', (count) => {
      setOnlineCount(count);
    });

    socket.emit("get_online_users");

    socket.on('waiting_for_opponent', (msg) => {
      setIsSearching(true);
      setStatusMessage(msg);
      setErrorMessage("");
    });

    socket.on('game_start', (data) => {
      setIsSearching(false);
      setErrorMessage("");
      navigate(`/battle/${data.battleId}`, { state: { problem: data.problemId, player1: data.player1, player2: data.player2 } });
    });

    socket.on('error_message', (msg) => {
      setIsSearching(false);
      setStatusMessage("");
      setErrorMessage(typeof msg === "string" ? msg : "Something went wrong. Please try again.");
    });

    return () => {
      socket.off('online_users_count');
      socket.off('waiting_for_opponent');
      socket.off('game_start');
      socket.off('error_message');
    };
  }, [navigate]);

  const handleActionClick = (action: DashboardAction) => {
    if (action.id === "create" || action.id === "join") {
      if (action.route) {
        navigate(action.route);
      }
    } else if (action.id === "random") {
      if (isSearching) return;
      const userId = localStorage.getItem('userId');
      socket.emit('find_random_match', { userId, difficulty: "easy" });
    }
  };

  const handleCancelSearch = () => {
    const userId = localStorage.getItem('userId');
    socket.emit('cancel_random_match', { userId });
    setIsSearching(false);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="absolute top-0 -left-16 h-64 w-64 rounded-full bg-primary/25 blur-[125px] pointer-events-none" />
      <div className="absolute bottom-12 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-[130px] pointer-events-none" />

      <header className="top-nav">
        <div className="page-wrap py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_10px_25px_-15px_rgba(124,90,255,1)]">
              <Swords className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight text-foreground">
                Duel<span className="text-primary">Code</span>
              </h1>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                {onlineCount} coders online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/leaderboard"
              className="status-chip hover:border-primary/40 transition-colors"
            >
              <Trophy className="w-4 h-4 text-primary" />
              Leaderboard
            </Link>

            <div className="glass-panel-soft px-3 py-2 flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-sm font-medium text-foreground">{user?.username || user?.cfHandle || 'Loading...'}</p>
                  {!isLoading && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-red-300 border border-red-300/40 bg-red-500/10 rounded-full px-2 py-0.5">
                      <Flame className="w-3 h-3 text-red-300" fill={hasStreakToday ? "currentColor" : "none"} />
                      {currentStreak}d
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Rating: {user?.rating ?? 800}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/35 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="page-wrap py-10 md:py-14 space-y-8">
        <section className="glass-panel p-6 sm:p-8 md:p-10">
          <div className="space-y-4">
            <span className="section-kicker">
              <Zap className="h-3.5 w-3.5" />
              Match Command Center
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-black text-foreground text-balance leading-tight">
              Choose your mode and launch the next coding duel.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-balance">
              Host private rooms, join with an invite code, or queue for instant random matchmaking. Every battle impacts your rating.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="status-chip">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                Live users: {onlineCount}
              </div>
              <div className="status-chip">
                <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                Current rating: {user?.rating ?? 800}
              </div>
              <div className="status-chip border-red-400/35 bg-red-500/10 text-red-200">
                <Flame className="h-3.5 w-3.5 text-red-300" fill={hasStreakToday ? "currentColor" : "none"} />
                Streak: {currentStreak} day{currentStreak === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          <div className="glass-panel-soft p-5 sm:p-6 lg:col-span-2 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2">Daily Streak</p>
                <h3 className="text-3xl sm:text-4xl font-heading font-black text-red-300 drop-shadow-[0_0_12px_rgba(252,72,72,0.24)]">
                  {currentStreak} Day{currentStreak === 1 ? "" : "s"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 text-balance">
                  Open DuelCode every day to maintain momentum. Missing a day resets the streak to 1.
                </p>
              </div>
              <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 ${hasStreakToday ? "bg-red-400/20 border-red-400/55" : "bg-red-400/8 border-red-400/28"}`}>
                <Flame className="h-6 w-6 text-red-300" fill={hasStreakToday ? "currentColor" : "none"} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="status-chip">
                <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
                Longest streak: {longestStreak} day{longestStreak === 1 ? "" : "s"}
              </div>
              <div className="status-chip">
                <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                Streak tier: {streakTier}
              </div>
            </div>
          </div>

          <div className="glass-panel-soft p-5 sm:p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Next Reward</p>
            <p className="text-2xl font-heading font-black text-foreground">{nextRewardIn} day{nextRewardIn === 1 ? "" : "s"}</p>
            <p className="text-sm text-muted-foreground">Every 7-day streak grants +10 bonus rating.</p>
            <div className="status-chip w-fit">
              <Gift className="h-3.5 w-3.5 text-pink-300" />
              Milestone cycle: 7 days
            </div>
          </div>
        </section>

        {rewardAwarded > 0 && (
          <div className="glass-panel-soft px-5 py-3 flex items-center gap-3 text-emerald-300 border-emerald-400/30 bg-emerald-400/10 animate-[fade-in_0.25s_ease-out]">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">Daily streak reward claimed: +{rewardAwarded} rating</span>
          </div>
        )}

        {statusMessage && isSearching && (
          <div className="glass-panel-soft px-5 py-3 flex flex-wrap items-center gap-3 text-primary animate-[fade-in_0.35s_ease-out]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-mono font-medium">{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="glass-panel-soft px-5 py-3 flex flex-wrap items-center gap-3 text-destructive border-destructive/35 bg-destructive/10 animate-[fade-in_0.2s_ease-out]" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {actions.map((action) => {
            const { icon: Icon, title, description, gradient, id, badge } = action;
            const isRandomSearch = id === "random" && isSearching;

            return (
              <button
                key={id}
                onClick={() => isRandomSearch ? handleCancelSearch() : handleActionClick(action)}
                className={`group action-tile ${isRandomSearch ? "ring-2 ring-primary border-primary/70" : ""}`}
              >
                <div className="relative z-10 space-y-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_12px_25px_-15px_rgba(110,90,255,0.9)] ${gradient}`}>
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-heading text-xl font-bold text-foreground leading-tight">
                      {isRandomSearch ? "Cancel Search" : title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-primary border border-primary/30 rounded-full px-2 py-1">
                      {badge}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed text-balance">
                    {isRandomSearch ? "Stop searching and return to command center state." : description}
                  </p>
                </div>
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;