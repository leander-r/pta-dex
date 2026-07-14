// ============================================================
// Onboarding Checklist
// ============================================================
// Extracted from MainNavigation so it can be rendered both in the
// desktop sidebar and as a mobile banner (sidebar checklist is CSS-hidden
// on mobile — bottom nav bar has no room for it).

import React from 'react';
import { useModal, useData } from '../../contexts/index.js';
import { useOnboarding } from '../../hooks/useOnboarding.js';

const OnboardingChecklist = ({ setActiveTab, layout = 'sidebar', className }) => {
    const { openSaveLoadModal } = useModal();
    const { loadDemoTrainer } = useData();
    const { steps, allDone, dismissed, dismiss } = useOnboarding();

    const showChecklist = !dismissed && !allDone;
    const showAllDone   = !dismissed && allDone;
    const blockMargin   = layout === 'sidebar' ? '10px 8px 0' : '0 0 16px';

    if (!showChecklist && !showAllDone) return null;

    return (
        <div className={className}>
            {showChecklist && (
                <div style={{
                    margin: blockMargin,
                    borderRadius: '8px',
                    border: '1px solid var(--tint-orange-border)',
                    overflow: 'hidden',
                    fontSize: '12px'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))',
                        color: 'white',
                        padding: '7px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.3px'
                    }}>
                        <span>✦ Getting Started</span>
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss getting started checklist"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: '4px 6px',
                                minWidth: '28px',
                                minHeight: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >✕</button>
                    </div>

                    {/* Steps */}
                    <div style={{ padding: '6px 0', background: 'var(--surface-bg)' }}>
                        {steps.map(step => (
                            step.done ? (
                                <div key={step.id} style={{
                                    padding: '5px 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    color: 'var(--color-success-text)',
                                    fontWeight: 600
                                }}>
                                    <span style={{ flexShrink: 0 }}>✓</span>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{step.label}</span>
                                </div>
                            ) : (
                                <button
                                    key={step.id}
                                    onClick={() => step.tab ? setActiveTab(step.tab) : openSaveLoadModal()}
                                    style={{
                                        width: '100%',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        padding: '6px 10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '7px',
                                        color: 'var(--text-color)',
                                        fontSize: '13px'
                                    }}
                                    title={step.tab ? `Go to ${step.tab} tab` : 'Open Save / Load'}
                                >
                                    <span style={{ flexShrink: 0, marginTop: '1px', color: 'var(--poke-orange)' }}>○</span>
                                    <span>
                                        <span style={{ display: 'block', fontWeight: 600 }}>{step.label}</span>
                                        {step.hint && (
                                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', lineHeight: '1.4' }}>
                                                {step.hint}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            )
                        ))}
                    </div>

                    {/* Demo trainer link */}
                    <div style={{
                        padding: '6px 10px 8px',
                        background: 'var(--surface-bg)',
                        borderTop: '1px solid var(--border-light)',
                    }}>
                        <button
                            onClick={loadDemoTrainer}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                textAlign: 'center',
                                lineHeight: '1.4'
                            }}
                            title="Load a pre-built trainer to explore the app"
                        >
                            ★ Load example trainer
                        </button>
                    </div>
                </div>
            )}

            {showAllDone && (
                <div style={{
                    margin: blockMargin,
                    borderRadius: '8px',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    fontSize: '12px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '7px 10px',
                        background: 'var(--color-success-text)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>✓ Setup complete!</span>
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss setup complete message"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                padding: '4px 6px',
                                minWidth: '28px',
                                minHeight: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >✕</button>
                    </div>
                    <div style={{ padding: '8px 10px', color: 'var(--color-success-text)', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>What to do next:</div>
                        <ul style={{ margin: 0, paddingLeft: '16px', opacity: 0.9 }}>
                            <li>Add more Pokémon to your party</li>
                            <li>Browse the Inventory tab for items</li>
                            <li>Set abilities &amp; held items per Pokémon</li>
                            <li>Roll dice in the Battle tab</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingChecklist;
