import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, DoorOpen, Loader2, Sparkles } from "lucide-react";
import { socket } from "../socket";

const JoinRoom = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false); // Added loading state
 
    useEffect(()=>{
      const userId=localStorage.getItem('userId');
      if(!userId){
        navigate('/');
        return;
      }
      if(!socket.connected) socket.connect();

      socket.on("game_start",(data)=>{
        setIsJoining(false);
        navigate(`/battle/${data.battleId}`, { state: { problem: data.problemId, player1: data.player1, player2: data.player2 } });
      });

      socket.on("error_message",(msg)=>{
        setError(msg);
        setIsJoining(false);
      });
      return()=>{
        socket.off("game_start");
        socket.off("error_message");
      }
    },[navigate]);

 const handleJoin = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    if (!code.trim() || code.trim().length !== 5) {
      setError("Invalid invite code. It must be 5 characters.");
      return;
    }
    setError("");
    setIsJoining(true);
    socket.emit('join_friend_lobby', {
        userId,
        inviteCode: code.toUpperCase()
    });
 }

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/18 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 h-80 w-80 rounded-full bg-accent/18 blur-[130px] pointer-events-none" />

      <div className="page-wrap py-10 min-h-screen flex items-center justify-center">
        <div className="relative z-10 w-full max-w-xl">
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
                Enter Existing Match
              </span>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <DoorOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Join Room</h2>
                  <p className="text-sm text-muted-foreground">Paste the 5-character invite code shared by the host.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="invite-code" className="text-sm font-medium text-foreground">Invite Code</label>
                <input
                  id="invite-code"
                  type="text"
                  maxLength={5}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  disabled={isJoining}
                  placeholder="ABCDE"
                  className="form-input text-center text-3xl font-heading font-black tracking-[0.34em] px-4 py-5 placeholder:text-muted-foreground/45"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-destructive text-sm animate-[fade-in_0.2s_ease-out]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="glass-panel-soft p-4 text-sm text-muted-foreground">
                Room starts automatically when both players are connected and problem assignment is complete.
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining || code.length !== 5}
                className="glow-button w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
                  </>
                ) : (
                  'Join Room'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;