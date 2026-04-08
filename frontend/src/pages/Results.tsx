import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Clock, Crown, Home, Loader2, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const { winnerInfo, player1, player2, currentUserId, timeStr, battleId } = location.state || {};

  const isWinner = winnerInfo?.winnerId === currentUserId;
  const isPlayer1 = currentUserId === player1?._id;
  const opponent = isPlayer1 ? player2 : player1;

  const meTime = isWinner ? timeStr : "--:--";
  const oppTime = !isWinner ? timeStr : "--:--";

  const [opponentLeft, setOpponentLeft] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [waitingForRematch, setWaitingForRematch] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      navigate('/');
    }
  }, [currentUserId, navigate]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("opponent_left_results", () => {
      setOpponentLeft(true);
      setRematchRequested(false);
      setWaitingForRematch(false);
    });

    socket.on("rematch_requested", (data) => {
       if (data.userId !== currentUserId) {
         setRematchRequested(true);
       }
    });

    socket.on("game_start", (data) => {
      isNavigatingRef.current = true;
      navigate(`/battle/${data.battleId}`, { state: { problem: data.problemId, player1: data.player1, player2: data.player2 } });
    });

    return () => {
      socket.off("opponent_left_results");
      socket.off("rematch_requested");
      socket.off("game_start");
      if (battleId && !isNavigatingRef.current) {
        socket.emit("leave_battle", { battleId, userId: currentUserId });
      }
    };
  }, [battleId, currentUserId, navigate]);

  const handleRematch = () => {
    if (rematchRequested) {
      socket.emit("accept_rematch", { battleId, userId: currentUserId });
    } else {
      setWaitingForRematch(true);
      socket.emit("request_rematch", { battleId, userId: currentUserId });
    }
  };

  if (!winnerInfo || !player1 || !player2) {
    return (
      <div className="app-shell flex items-center justify-center p-4">
        <div className="glass-panel-soft p-6 text-center max-w-md space-y-3">
          <p className="text-muted-foreground">Result data is unavailable. Return to dashboard to start another battle.</p>
          <Link to="/dashboard" className="glow-button inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex items-center justify-center p-4 relative overflow-hidden">
      <div className="ambient-grid" />
      <div className="absolute top-24 -left-16 h-72 w-72 rounded-full bg-primary/18 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-8 -right-20 h-80 w-80 rounded-full bg-accent/16 blur-[130px] pointer-events-none" />

      {isWinner && (
        <>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-bounce pointer-events-none"
              style={{
                background: i % 3 === 0 ? "hsl(var(--primary))" : i % 3 === 1 ? "hsl(var(--accent))" : "hsl(48, 96%, 53%)",
                top: `${10 + Math.random() * 30}%`,
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </>
      )}

      <div className="relative z-10 w-full max-w-lg">
        <div className="glass-panel glow-border p-7 sm:p-8 space-y-7 animate-[fade-in_0.3s_ease-out]">
          <div className="text-center space-y-4">
            <span className="section-kicker mx-auto">
              <Sparkles className="h-3.5 w-3.5" />
              Match Finished
            </span>
            <div
              className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${
                isWinner
                  ? "bg-yellow-500/12 border border-yellow-500/35 shadow-[0_0_30px_-8px_rgba(234,179,8,0.5)]"
                  : "bg-destructive/12 border border-destructive/35"
              }`}
            >
              <Trophy className={`w-9 h-9 ${isWinner ? "text-yellow-400" : "text-destructive"}`} />
            </div>

            <h2
              className={`text-3xl font-heading font-bold ${
                isWinner ? "text-green-400" : "text-destructive"
              }`}
            >
              {isWinner ? "You Win!" : "You Lose!"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isWinner ? "Great performance! Keep it up." : "Better luck next time!"}
            </p>
          </div>

          <div className="flex items-stretch gap-4">
            <div
              className={`flex-1 rounded-xl p-4 text-center space-y-2 border ${
                isWinner ? "border-green-500/30 bg-green-500/8 shadow-lg shadow-green-500/15" : "border-destructive/30 bg-destructive/8"
              }`}
            >
              {isWinner && <Crown className="w-5 h-5 mx-auto text-yellow-400 mb-1 drop-shadow-md" />}
              <p className="font-heading font-semibold text-foreground text-base tracking-wide">You</p>
              <div className="flex flex-col items-center justify-center gap-1 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xl font-heading font-bold text-foreground tabular-nums tracking-wider">{meTime || "--:--"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center shrink-0 px-2">
              <span className="text-2xl font-heading font-black text-muted-foreground/40 italic">VS</span>
            </div>

            <div
              className={`flex-1 rounded-xl p-4 text-center space-y-2 border ${
                !isWinner ? "border-green-500/30 bg-green-500/8 shadow-lg shadow-green-500/15" : "border-destructive/30 bg-destructive/8"
              }`}
            >
              {!isWinner && <Crown className="w-5 h-5 mx-auto text-yellow-400 mb-1 drop-shadow-md" />}
              <p className="font-heading font-semibold text-foreground text-base tracking-wide">{opponent?.username || "Opponent"}</p>
              <div className="flex flex-col items-center justify-center gap-1 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xl font-heading font-bold text-foreground tabular-nums tracking-wider">{oppTime || "--:--"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center italic text-muted-foreground/85 py-2 px-4 rounded-xl bg-secondary/35 border border-white/10">
            {winnerInfo?.message || "The battle has concluded!"}
          </div>

          {opponentLeft && (
            <div className="flex items-center justify-center gap-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl animate-[fade-in_0.25s_ease-out] flex-wrap text-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Your opponent disconnected or left. Rematch is unavailable.
            </div>
          )}

          {rematchRequested && !opponentLeft && (
            <div className="flex items-center justify-center gap-2 p-3 border border-primary/50 bg-primary/10 text-primary font-medium text-sm rounded-xl animate-[fade-in_0.25s_ease-out]">
              <RotateCcw className="w-4 h-4 shrink-0" />
              Your opponent requested a rematch.
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Link
              to="/dashboard"
              className="flex-[0.5] flex items-center justify-center gap-2 py-3 rounded-xl border border-white/12 bg-secondary/55 text-sm font-medium text-secondary-foreground hover:bg-secondary transition-colors"
            >
              <Home className="w-4 h-4 shrink-0" /> Home
            </Link>

            {opponentLeft ? (
              <Link
                to="/create-room"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-muted-foreground border border-white/12 bg-card hover:bg-secondary/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Find New Opponent
              </Link>
            ) : (
              <button
                onClick={handleRematch}
                disabled={waitingForRematch}
                className="flex-1 glow-button flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-wait"
              >
                {waitingForRematch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting for Opponent...
                  </>
                ) : rematchRequested ? (
                  "Accept Rematch!"
                ) : (
                  "Request Rematch"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
