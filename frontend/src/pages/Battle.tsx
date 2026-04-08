import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Clock, ExternalLink, Loader2, Swords, User, Zap } from "lucide-react";
import { socket } from "../socket";
import api from "../apis/axios";

type BattleData = {
  problem: any | null;
  player1: any | null;
  player2: any | null;
};

const Battle = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const gameOverRef = useRef(false);
  const secondsRef = useRef(0);
  const battleDataRef = useRef<BattleData>({
    problem: location.state?.problem || null,
    player1: location.state?.player1 || null,
    player2: location.state?.player2 || null,
  });

  const [seconds, setSeconds] = useState(0);
  const [isLoadingBattle, setIsLoadingBattle] = useState(true);
  const [battleData, setBattleData] = useState<BattleData>({
    problem: location.state?.problem || null,
    player1: location.state?.player1 || null,
    player2: location.state?.player2 || null,
  });

  const problem = battleData.problem;
  const player1 = battleData.player1;
  const player2 = battleData.player2;
  const currentUserId = localStorage.getItem("userId");

  const isPlayer1 = currentUserId === player1?._id;
  const opponent = isPlayer1 ? player2 : player1;

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    battleDataRef.current = battleData;
  }, [battleData]);

  useEffect(() => {
    if (!currentUserId) {
      navigate('/');
      return;
    }

    if (!id) {
      navigate('/dashboard');
      return;
    }

    if (!socket.connected) socket.connect();
    socket.emit("register_user", { userId: currentUserId });
    socket.emit("rejoin_battle", { battleId: id, userId: currentUserId });

    const checkStatus = async () => {
      try {
        const res = await api.get(`/api/battle/${id}`);
        if (res.data && res.data.status === "completed") {
          navigate('/dashboard');
          return;
        }

        if (res.data) {
          setBattleData({
            problem: res.data.problemId || null,
            player1: res.data.player1 || null,
            player2: res.data.player2 || null,
          });
        }

        if (res.data && res.data.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(res.data.startTime).getTime()) / 1000);
          setSeconds(elapsed > 0 ? elapsed : 0);
        }
      } catch (err) {
        console.error("Error fetching battle status.", err);
        navigate('/dashboard');
      } finally {
        setIsLoadingBattle(false);
      }
    };
    checkStatus();

    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);

    socket.on('game_over', (data) => {
      gameOverRef.current = true;
      clearInterval(interval);
      const finalTime = data.timeTaken !== undefined ? data.timeTaken : secondsRef.current;
      const latestBattleData = battleDataRef.current;
      navigate('/results', {
        state: {
          winnerInfo: data,
          problem: latestBattleData.problem,
          player1: latestBattleData.player1,
          player2: latestBattleData.player2,
          currentUserId,
          timeStr: formatTime(finalTime),
          battleId: id
        }
      });
    });

    return () => {
      clearInterval(interval);
      socket.off('game_over');
    };
  }, [navigate, currentUserId, id]);

  const handleLeaveBattle = () => {
    gameOverRef.current = true;
    socket.off('game_over');
    if (id && currentUserId) {
      socket.emit("leave_battle", { battleId: id, userId: currentUserId });
    }
    navigate('/dashboard');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (isLoadingBattle || !problem || !player1 || !player2) {
    return (
      <div className="app-shell flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading battle arena...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="absolute top-16 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-8 -right-16 h-72 w-72 rounded-full bg-accent/20 blur-[130px] pointer-events-none" />

      <header className="top-nav">
        <div className="page-wrap py-4 flex items-center justify-between gap-4">
          <button onClick={handleLeaveBattle} className="back-link">
            <ArrowLeft className="w-4 h-4" /> Leave Battle
          </button>

          <div className="status-chip px-4 py-2">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-lg sm:text-xl font-heading font-bold tracking-wider tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>

          <div className="status-chip">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span className="uppercase tracking-[0.16em] text-[10px] sm:text-[11px] font-semibold">
              {problem?.difficulty || 'Match'}
            </span>
          </div>
        </div>
      </header>

      <main className="page-wrap py-8 md:py-12 space-y-6">
        <section className="glass-panel p-6 sm:p-8 text-center space-y-4">
          <span className="section-kicker mx-auto">
            <Swords className="w-3.5 h-3.5" />
            Target Problem
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-balance leading-tight">
            {problem?.title || `Codeforces ${problem?.cfContestId}${problem?.cfIndex}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Contest {problem?.cfContestId} / Index {problem?.cfIndex}
          </p>
          <a
            href={`https://codeforces.com/problemset/problem/${problem?.cfContestId}/${problem?.cfIndex}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-button inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground hover:scale-[1.02] transition-transform"
          >
            <ExternalLink className="w-4 h-4" />
            Open on Codeforces
          </a>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          <div className="glass-panel-soft p-5 sm:p-6 space-y-4 border-primary/35 bg-primary/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">You ({isPlayer1 ? player1?.username : player2?.username})</p>
                <p className="text-xs text-muted-foreground">Auto-judge monitoring enabled</p>
              </div>
            </div>

            <div className="status-chip w-fit text-primary border-primary/35 bg-primary/10">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Coding in progress
            </div>
          </div>

          <div className="flex items-center justify-center py-3 lg:py-0">
            <span className="text-3xl font-heading font-black text-muted-foreground/55">VS</span>
          </div>

          <div className="glass-panel-soft p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">Opponent ({opponent?.username || 'Unknown'})</p>
                <p className="text-xs text-muted-foreground">Auto-judge monitoring enabled</p>
              </div>
            </div>

            <div className="status-chip w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Opponent is coding...
            </div>
          </div>
        </section>

        <div className="glass-panel-soft px-4 py-3 text-sm text-muted-foreground text-center">
          Submit the solution on Codeforces. We detect accepted submissions automatically and finish the match in real time.
        </div>
      </main>
    </div>
  );
};

export default Battle;