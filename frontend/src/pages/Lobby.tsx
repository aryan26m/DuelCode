import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, User, Loader2 } from "lucide-react";
import { useState } from "react";

const Lobby = () => {
  const [copied, setCopied] = useState(false);
  const inviteCode = "X7KQ2P";
  const player1 = "You";
  const player2Ready = false;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 glow-border space-y-8">
          {/* Header + invite code */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-heading font-bold text-foreground">Battle Lobby</h2>

            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border bg-input/50">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Code</span>
              <span className="text-lg font-heading font-bold tracking-[0.25em] text-foreground">{inviteCode}</span>
              <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center gap-4">
            {/* Player 1 */}
            <div className="flex-1 rounded-xl border border-primary/40 bg-primary/5 p-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <p className="font-heading font-semibold text-foreground">{player1}</p>
              <span className="inline-block text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">Ready</span>
            </div>

            {/* VS */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <span className="text-2xl font-heading font-bold text-muted-foreground">VS</span>
            </div>

            {/* Player 2 */}
            <div className={`flex-1 rounded-xl border p-6 text-center space-y-3 ${player2Ready ? "border-accent/40 bg-accent/5" : "border-border border-dashed bg-secondary/20"}`}>
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${player2Ready ? "bg-accent/20 border-2 border-accent/50" : "bg-muted/30 border-2 border-border"}`}>
                {player2Ready ? (
                  <User className="w-6 h-6 text-accent" />
                ) : (
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                )}
              </div>
              <p className="font-heading font-semibold text-muted-foreground">
                {player2Ready ? "Opponent" : "Waiting..."}
              </p>
              {player2Ready ? (
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-accent/20 text-accent font-medium">Ready</span>
              ) : (
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-muted/30 text-muted-foreground">Not joined</span>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waiting for opponent...
            </div>
            <p className="text-xs text-muted-foreground/70">
              Battle starts automatically when both players join
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
