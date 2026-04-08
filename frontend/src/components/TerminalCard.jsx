const TerminalCard = () => {
  return (
    <div className="w-full max-w-lg mx-auto mt-9" style={{ animation: "float 6s ease-in-out infinite" }}>
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: "#ff5f56" }} />
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: "#ffbd2e" }} />
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: "#27c93f" }} />
          </div>
          <span className="text-sm text-muted-foreground font-mono tracking-wide" style={{ marginLeft: "1.5rem" }}>
            battle.py
          </span>
        </div>
        {/* Code content */}
        <div className="px-8 py-6 font-mono text-[15px] leading-relaxed">
          <div>
            <span className="text-primary">def</span>{" "}
            <span className="text-secondary">solve</span>
            <span className="text-muted-foreground">(challenge):</span>
          </div>
          <div className="ml-4">
            <span className="text-primary">if</span>{" "}
            <span className="text-foreground">challenge.difficulty</span>{" "}
            <span className="text-primary">==</span>{" "}
            <span className="text-green-400">"legendary"</span>
            <span className="text-muted-foreground">:</span>
          </div>
          <div className="ml-8">
            <span className="text-primary">return</span>{" "}
            <span className="text-green-400">"Victory 🏆"</span>
          </div>
          <div className="mt-2 text-muted-foreground">
            <span style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>▌</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalCard;
