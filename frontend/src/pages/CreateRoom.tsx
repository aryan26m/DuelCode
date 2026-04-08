import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { ArrowLeft, Check, ChevronDown, Copy, Loader2, Sparkles, Swords } from "lucide-react";
import { socket } from "../socket";

const difficulties = [
  { value: "easy", label: "Easy", color: "text-green-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "hard", label: "Hard", color: "text-red-400" },
];

const CreateRoom = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("easy"); // Defaulting to easy to match your backend
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // New loading state
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Auth Guard
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    if (!socket.connected) socket.connect();

    socket.on('friend_lobby_created', (data) => {
      setInviteCode(data.inviteCode); // Show the REAL code from the server
      setIsCreating(false);
      setError("");
    });

    // 3. Listen for Player 2 joining!
    socket.on('game_start', (data) => {
      // The moment they join, teleport the host to the Battle Arena!
      navigate(`/battle/${data.battleId}`, { state: { problem: data.problemId, player1: data.player1, player2: data.player2 } });
    });

    // Handle errors (e.g., no questions found)
    socket.on('error_message', (msg) => {
      setError(typeof msg === "string" ? msg : "Unable to create room right now.");
      setIsCreating(false);
    });

    return () => {
      socket.off('friend_lobby_created');
      socket.off('game_start');
      socket.off('error_message');
    };
  }, [navigate]);

  const handleCreate = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    setIsCreating(true);
    setError("");
    // Tell the backend to grab a Codeforces question and make the room
    socket.emit('create_friend_lobby', { difficulty, userId });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selected = difficulties.find((d) => d.value === difficulty)!;

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="absolute top-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-16 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-[130px] pointer-events-none" />

      <div className="page-wrap py-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-xl">
          <Link
            to="/dashboard"
            className="back-link mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="glass-panel glow-border p-7 sm:p-8">
            <div className="space-y-4 mb-7">
              <span className="section-kicker">
                <Sparkles className="w-3.5 h-3.5" />
                Private Match Setup
              </span>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Swords className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Create Room</h2>
                  <p className="text-sm text-muted-foreground">Pick a difficulty, generate a code, and share with your opponent.</p>
                </div>
              </div>
            </div>

            {!inviteCode ? (
              <div className="space-y-6 animate-[fade-in_0.25s_ease-out]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Difficulty</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      disabled={isCreating}
                      className="form-input flex items-center justify-between text-left disabled:opacity-50"
                      aria-expanded={isOpen}
                    >
                      <span className={selected.color}>{selected.label}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && !isCreating && (
                      <div className="absolute mt-2 w-full rounded-xl border border-white/12 bg-card/95 backdrop-blur-xl shadow-lg z-20 overflow-hidden animate-[fade-in_0.2s_ease-out]">
                        {difficulties.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => {
                              setDifficulty(d.value);
                              setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-secondary/70 transition-colors ${d.color} ${d.value === difficulty ? "bg-secondary/45" : ""}`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-panel-soft p-4 text-sm text-muted-foreground">
                  Room launches instantly after your opponent joins. A random problem from the selected level is assigned automatically.
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="glow-button w-full py-3.5 flex justify-center items-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Room...
                    </>
                  ) : (
                    "Generate Invite Code"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center animate-[fade-in_0.3s_ease-out]">
                <p className="text-sm text-muted-foreground">Share this invite code with your opponent</p>

                <div className="py-7 px-4 rounded-2xl border border-primary/30 bg-primary/8">
                  <p className="text-4xl sm:text-5xl font-heading font-black tracking-[0.28em] text-foreground">{inviteCode}</p>
                </div>

                <button
                  onClick={handleCopy}
                  className="status-chip mx-auto hover:border-primary/40 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy Code"}
                </button>

                <div className="subtle-separator pt-6 flex flex-col items-center gap-3">
                  <p className="text-xs text-muted-foreground tracking-wide uppercase">
                    Difficulty: <span className={selected.color}>{selected.label}</span>
                  </p>
                  <div className="status-chip text-primary border-primary/35 bg-primary/10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Waiting for opponent to connect...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;