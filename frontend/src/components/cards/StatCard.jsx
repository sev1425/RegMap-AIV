import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import "./StatCard.css";

import {
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
    ClipboardList,
    ArrowUpRight
} from "lucide-react";

const icons = {
    compliance: <ShieldCheck size={26} />,
    risk: <AlertTriangle size={26} />,
    obligation: <ClipboardList size={26} />,
    progress: <TrendingUp size={26} />
};

function AnimatedNumber({ value }) {
    const isString = typeof value === 'string' && isNaN(Number(value.replace(/[^0-9.]/g, '')));
    const numValue = isString ? 0 : Number(value.toString().replace(/[^0-9.]/g, ''));
    const suffix = value.toString().replace(/[0-9.]/g, '');

    const springValue = useSpring(0, { stiffness: 50, damping: 20 });
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        if (!isString) {
            springValue.set(numValue);
        }
    }, [numValue, springValue, isString]);

    useEffect(() => {
        if (!isString) {
            return springValue.onChange(v => {
                setDisplay(Math.round(v) + suffix);
            });
        }
    }, [springValue, suffix, isString]);

    return <span>{isString ? value : display}</span>;
}

export default function StatCard({
    type = "compliance",
    title,
    value,
    subtitle,
    progress = 0,
    color = "var(--accent-primary)",
    trend
}) {
    return (
        <motion.div 
            className="stat-card glass-panel"
            whileHover={{ y: -5, boxShadow: "var(--shadow-lg)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="stat-card-top">
                <div
                    className="stat-icon"
                    style={{
                        background: `${color}15`,
                        color: color
                    }}
                >
                    {icons[type]}
                </div>
                <div className="stat-growth" style={trend && trend.startsWith('-') ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' } : {}}>
                    <ArrowUpRight size={14} style={trend && trend.startsWith('-') ? { transform: 'rotate(90deg)' } : {}} />
                    <span>{trend || "+8%"}</span>
                </div>
            </div>

            <div className="stat-card-body">
                <span className="stat-title">{title}</span>
                <h2 className="stat-value">
                    <AnimatedNumber value={value} />
                </h2>
                <p className="stat-subtitle">{subtitle}</p>
            </div>

            <div className="stat-progress">
                <div className="progress-track">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        style={{ background: color }}
                    />
                </div>
                <span>{progress}%</span>
            </div>
        </motion.div>
    );
}