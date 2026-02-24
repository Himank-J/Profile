import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import './WarpBackground.css';

// Beam: one animated coloured strip flying through the grid plane
function Beam({ width, x, delay, duration }) {
    // Stable random values — computed once per mount
    const hue = useMemo(() => Math.floor(Math.random() * 360), []);
    const ar = useMemo(() => Math.floor(Math.random() * 10) + 1, []);

    return (
        <motion.div
            style={{
                '--x': x,
                '--width': width,
                '--aspect-ratio': ar,
                '--beam-bg': `linear-gradient(hsl(${hue} 80% 60%), transparent)`,
            }}
            className="warp-beam"
            initial={{ y: '100cqmax', x: '-50%' }}
            animate={{ y: '-100%', x: '-50%' }}
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
        />
    );
}

// WarpBackground: fixed full-viewport layer — pointer-events:none, z-index:0
function WarpBackground({
    perspective = 100,
    beamsPerSide = 3,
    beamSize = 5,
    beamDelayMax = 3,
    beamDelayMin = 0,
    beamDuration = 3,
}) {
    const makeBeams = useCallback(() => {
        const beams = [];
        const step = Math.floor(100 / beamSize) / beamsPerSide;
        for (let i = 0; i < beamsPerSide; i++) {
            beams.push({
                x: Math.floor(i * step),
                delay: Math.random() * (beamDelayMax - beamDelayMin) + beamDelayMin,
            });
        }
        return beams;
    }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin]);

    const topBeams = useMemo(() => makeBeams(), [makeBeams]);
    const bottomBeams = useMemo(() => makeBeams(), [makeBeams]);
    const leftBeams = useMemo(() => makeBeams(), [makeBeams]);
    const rightBeams = useMemo(() => makeBeams(), [makeBeams]);

    const bw = `${beamSize}%`;

    return (
        <div className="warp-root" aria-hidden="true">
            <div
                className="warp-layer"
                style={{
                    '--perspective': `${perspective}px`,
                    '--beam-size': `${beamSize}%`,
                }}
            >
                {/* top grid plane */}
                <div className="warp-plane warp-top">
                    {topBeams.map((b, i) => (
                        <Beam key={i} width={bw} x={`${b.x * beamSize}%`} delay={b.delay} duration={beamDuration} />
                    ))}
                </div>

                {/* bottom grid plane */}
                <div className="warp-plane warp-bottom">
                    {bottomBeams.map((b, i) => (
                        <Beam key={i} width={bw} x={`${b.x * beamSize}%`} delay={b.delay} duration={beamDuration} />
                    ))}
                </div>

                {/* left grid plane */}
                <div className="warp-plane warp-left">
                    {leftBeams.map((b, i) => (
                        <Beam key={i} width={bw} x={`${b.x * beamSize}%`} delay={b.delay} duration={beamDuration} />
                    ))}
                </div>

                {/* right grid plane */}
                <div className="warp-plane warp-right">
                    {rightBeams.map((b, i) => (
                        <Beam key={i} width={bw} x={`${b.x * beamSize}%`} delay={b.delay} duration={beamDuration} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WarpBackground;
