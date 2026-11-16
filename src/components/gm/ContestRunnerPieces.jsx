// ============================================================
// Contest Runner — presentational sub-components
// ============================================================
// Extracted from ContestRunner.jsx (split out for file-size/maintainability —
// ContestRunner.jsx had grown to ~1500 lines). Pure presentational components
// with no closure over the main component's state, so this carries zero
// behavior-change risk.

import { normalizeKeyword, KEYWORD_COLOR, KEYWORD_DESC } from './contestHelpers.js';

export const VoltageBar = ({ voltage, color }) => (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
                width: 16, height: 16, borderRadius: 3,
                background: i < voltage ? color : 'var(--border-light)',
                border: `1px solid ${i < voltage ? color : 'var(--border-medium)'}`,
                transition: 'background 0.2s',
                boxShadow: i < voltage ? `0 0 5px ${color}66` : 'none',
            }} />
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 3, fontWeight: 700 }}>
            {voltage}/6
        </span>
    </div>
);

export const JudgeCard = ({ judge, color, selected, onSelect, disabled, holdThought, excitement }) => (
    <button
        onClick={() => !disabled && onSelect(judge.id)}
        disabled={disabled}
        style={{
            flex: 1, minWidth: 90, padding: '10px 8px', borderRadius: 8,
            border: `2px solid ${selected ? color : 'var(--border-light)'}`,
            background: selected ? `${color}18` : 'var(--surface-bg)',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.15s',
            textAlign: 'center',
        }}
        title={`Appeal to Judge ${judge.id} (Voltage ${judge.voltage}/6)`}
    >
        <div style={{ fontSize: 13, fontWeight: 700, color: selected ? color : 'var(--text-primary)', marginBottom: 4 }}>
            Judge {judge.id}
        </div>
        <VoltageBar voltage={judge.voltage} color={color} />
        {judge.voltage === 6 && <div style={{ fontSize: 11, color: 'var(--poke-orange-text)', fontWeight: 700, marginTop: 2 }}>MAX ⚡</div>}
        {holdThought && <div style={{ fontSize: 11, color: 'var(--poke-orange-text)', fontWeight: 700, marginTop: 2 }}>🔒 Locked</div>}
        {excitement && <div style={{ fontSize: 11, color: 'var(--stat-hp)', fontWeight: 700, marginTop: 2 }}>🛡 Protected</div>}
    </button>
);

export const StepLabel = ({ n, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--color-purple)', color: 'white',
            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
    </div>
);

export const KeywordPill = ({ keyword }) => {
    const kw = normalizeKeyword(keyword);
    if (!kw || kw === 'No Effect') return null;
    const c = KEYWORD_COLOR[kw] || '#9e9e9e';
    return (
        <span title={KEYWORD_DESC[kw]} style={{
            padding: '1px 6px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: `${c}22`, border: `1px solid ${c}55`, color: c,
            cursor: 'help', whiteSpace: 'nowrap',
            textDecoration: 'underline dotted', textUnderlineOffset: '2px',
        }}>
            {kw}
        </span>
    );
};
