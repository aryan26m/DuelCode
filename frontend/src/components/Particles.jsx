import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 60;

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

export default function Particles() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let animId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: randomBetween(0, window.innerWidth),
            y: randomBetween(0, window.innerHeight),
            r: randomBetween(0.8, 2.4),
            dx: randomBetween(-0.25, 0.25),
            dy: randomBetween(-0.35, -0.1),
            alpha: randomBetween(0.15, 0.55),
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                // mix between purple and blue
                const hue = randomBetween(220, 270) | 0;
                ctx.fillStyle = `hsla(${hue}, 80%, 72%, ${p.alpha})`;
                ctx.fill();

                p.x += p.dx;
                p.y += p.dy;

                if (p.y < -5) {
                    p.y = canvas.height + 5;
                    p.x = randomBetween(0, canvas.width);
                }
                if (p.x < -5) p.x = canvas.width + 5;
                if (p.x > canvas.width + 5) p.x = -5;
            });
            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-0"
            aria-hidden
        />
    );
}
