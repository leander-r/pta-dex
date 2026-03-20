// ============================================================
// Card Export Modal Component
// ============================================================
// Modal for exporting trainer/team/pokemon cards as images or text

import React from 'react';
import { getTypeColor } from '../../utils/typeUtils.js';
import { getPokemonDisplayImage } from '../../utils/pokemonSprite.js';
import { copyToClipboard, downloadCardAsImage } from '../../utils/exportUtils.js';
import toast from '../../utils/toast.js';
import { getActualStats, calculatePokemonHP, calculateSTAB } from '../../utils/dataUtils.js';
import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal, useTrainerContext, usePokemonContext, useData } from '../../contexts/index.js';
import { GAME_DATA } from '../../data/configs.js';

// ============================================================
// Shared Design Tokens & Helper Components
// ============================================================

const CARD_TOKENS = {
    fontSm: '10px',
    fontMd: '12px',
    fontLg: '14px',
    fontXl: '18px',
    radiusSm: '6px',
    radiusMd: '10px',
    radiusLg: '16px',
    statColors: {
        HP: '#ef5350',
        ATK: '#ff7043',
        DEF: '#66bb6a',
        SATK: '#42a5f5',
        SDEF: '#ab47bc',
        SPD: '#26c6da'
    },
    categoryIcons: {
        Physical: '💥',
        Special: '✨',
        Status: '🔄'
    },
    frequencyMap: {
        'At-Will': 'AW',
        'EOT': 'EOT',
        'Scene': 'SC',
        'Scene x2': 'SC×2',
        'Scene x3': 'SC×3',
        'Daily': 'DY',
        'Daily x2': 'DY×2',
        'Daily x3': 'DY×3'
    }
};

/** Horizontal colored bar showing stat magnitude */
const StatBar = ({ label, value, maxStat, color, indicator }) => {
    const barPercent = Math.min((value / maxStat) * 100, 100);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{
                fontSize: '10px',
                fontWeight: 700,
                width: '36px',
                textAlign: 'right',
                opacity: 0.95,
                flexShrink: 0
            }}>
                {label}
            </span>
            {indicator && (
                <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    width: '14px',
                    textAlign: 'center',
                    color: indicator === '+' ? '#69f0ae' : '#ff8a80',
                    flexShrink: 0
                }}>
                    {indicator}
                </span>
            )}
            {!indicator && <span style={{ width: '14px', flexShrink: 0 }} />}
            <div style={{
                flex: 1,
                height: '10px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '5px',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${barPercent}%`,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    borderRadius: '5px',
                    boxShadow: `0 0 6px ${color}66`
                }} />
            </div>
            <span style={{
                fontSize: '11px',
                fontWeight: 800,
                width: '24px',
                textAlign: 'right',
                flexShrink: 0
            }}>
                {value}
            </span>
        </div>
    );
};

/** Rounded pill badge for features/skills */
const PillTag = ({ text, color }) => (
    <span style={{
        display: 'inline-block',
        background: color || 'rgba(255,255,255,0.15)',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '10px',
        fontWeight: 600,
        margin: '2px 3px',
        border: '1px solid rgba(255,255,255,0.2)',
        whiteSpace: 'nowrap'
    }}>
        {text}
    </span>
);

/** Uppercase label with decorative gradient line */
const SectionHeader = ({ label, rightContent, color }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '8px'
    }}>
        <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            opacity: 0.95,
            flexShrink: 0,
            color: color || 'inherit'
        }}>
            {label}
        </span>
        <div style={{
            flex: 1,
            height: '2px',
            background: `linear-gradient(90deg, ${color || 'rgba(255,255,255,0.4)'}, transparent)`,
            borderRadius: '1px'
        }} />
        {rightContent && (
            <span style={{
                fontSize: '10px',
                background: 'rgba(255,255,255,0.15)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 600,
                flexShrink: 0
            }}>
                {rightContent}
            </span>
        )}
    </div>
);

/** Returns '+' or '-' for nature buff/nerf on a given stat key */
const getNatureIndicator = (nature, statKey) => {
    if (!nature || !GAME_DATA?.natures) return null;
    const natureData = GAME_DATA.natures[nature];
    if (!natureData) return null;
    if (natureData.buff === statKey) return '+';
    if (natureData.nerf === statKey) return '-';
    return null;
};

/** Shortens frequency strings: "At-Will" -> "AW", "Battle - 2" -> "B-2", etc. */
const getFrequencyAbbr = (frequency) => {
    if (!frequency) return '';
    if (CARD_TOKENS.frequencyMap[frequency]) return CARD_TOKENS.frequencyMap[frequency];
    // Handle "Battle - X" pattern
    const battleMatch = frequency.match(/^Battle\s*[-–]\s*(\d+)$/i);
    if (battleMatch) return `B-${battleMatch[1]}`;
    // Handle "Center" or other
    if (frequency.toLowerCase() === 'center') return 'CTR';
    return frequency.length > 4 ? frequency.substring(0, 3) : frequency;
};

/**
 * CardExportModal - Modal for exporting trainer/team/pokemon cards as images or text
 * Uses UIContext for modal state, TrainerContext for trainer, PokemonContext for pokemon, DataContext for export functions
 */
const CardExportModal = () => {
    // Get from contexts
    const { showCardModal, setShowCardModal, cardType, setCardType, selectedCardPokemon, setSelectedCardPokemon, showConfirm } = useModal();
    const { trainer } = useTrainerContext();
    const { party, reserve } = usePokemonContext();
    const { exportTrainerText, exportTeamText, exportPokemonText } = useData();

    const [isExporting, setIsExporting] = React.useState(false);

    // Combine party and reserve for all pokemon
    const allPokemon = [...(party || []), ...(reserve || [])];

    const handleClose = () => setShowCardModal(false);

    const { modalRef } = useModalKeyboard(showCardModal, handleClose);

    if (!showCardModal) return null;

    const handleCopyText = () => {
        let text = '';
        if (cardType === 'trainer') {
            text = exportTrainerText(trainer);
        } else if (cardType === 'team') {
            text = exportTeamText(trainer, party);
        } else if (selectedCardPokemon) {
            text = exportPokemonText(selectedCardPokemon);
        }
        if (text) copyToClipboard(text);
    };

    const handleDownloadImage = async () => {
        let cardId, filename;
        if (cardType === 'trainer') {
            cardId = 'trainerCardExport';
            filename = `${trainer.name || 'trainer'}-card`;
        } else if (cardType === 'team') {
            cardId = 'teamCardExport';
            filename = `${trainer.name || 'trainer'}-team-card`;
        } else {
            cardId = 'pokemonCardExport';
            filename = `${selectedCardPokemon?.name || 'pokemon'}-card`;
        }
        setIsExporting(true);
        try {
            await downloadCardAsImage(cardId, filename);
        } catch (err) {
            const cardText = err.cardText || '';
            showConfirm({
                title: 'Export Failed',
                message: 'Image export failed. Would you like to copy the card data as text instead?',
                confirmLabel: 'Copy Text',
                onConfirm: async () => {
                    try {
                        await navigator.clipboard.writeText(cardText);
                        toast.success('Card data copied to clipboard!');
                    } catch {
                        toast.error('Export failed. Try taking a screenshot manually (Print Screen key).');
                    }
                }
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                style={{ maxWidth: `min(calc(100vw - 20px), ${cardType === 'team' ? '680px' : '550px'})`, maxHeight: 'min(90vh, 700px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="card-export-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                        color: 'white',
                        margin: '-25px -25px 0 -25px',
                        padding: '18px 20px',
                        borderRadius: '17px 17px 0 0',
                        borderBottom: 'none',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <h3
                        id="card-export-modal-title"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: '800',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>📇</span>
                        Export Character Card
                    </h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        title="Close"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: 'white',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: 'bold'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.35)';
                            e.target.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                            e.target.style.transform = 'rotate(0deg)';
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable content: tabs + card preview */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px 25px' }}>
                    <div className="tabs">
                        <button
                            className={`tab ${cardType === 'trainer' ? 'active' : ''}`}
                            onClick={() => setCardType('trainer')}
                        >
                            Trainer
                        </button>
                        <button
                            className={`tab ${cardType === 'team' ? 'active' : ''}`}
                            onClick={() => setCardType('team')}
                        >
                            Team Card
                        </button>
                        <button
                            className={`tab ${cardType === 'pokemon' ? 'active' : ''}`}
                            onClick={() => setCardType('pokemon')}
                        >
                            Pokémon
                        </button>
                    </div>

                    {cardType === 'pokemon' && (
                        <div className="mt-10">
                            <select
                                value={selectedCardPokemon?.id || ''}
                                onChange={(e) => setSelectedCardPokemon(allPokemon.find(p => String(p.id) === e.target.value))}
                                className="w-full"
                            >
                                <option value="">Select a Pokémon...</option>
                                {allPokemon.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Lv.{p.level})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Card previews */}
                    <div style={{ marginTop: '16px' }}>
                        {cardType === 'trainer' && (
                            <TrainerCard trainer={trainer} pokemon={allPokemon} />
                        )}
                        {cardType === 'team' && (
                            <TeamCard trainer={trainer} party={party} />
                        )}
                        {cardType === 'pokemon' && selectedCardPokemon && (
                            <PokemonCard poke={selectedCardPokemon} />
                        )}
                        {cardType === 'pokemon' && !selectedCardPokemon && (
                            <div className="empty-state">
                                <p>Select a Pokémon above to preview their card</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons — pinned footer */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    padding: '12px 25px 20px',
                    borderTop: '1px solid var(--border-color, rgba(0,0,0,0.1))',
                    flexWrap: 'wrap',
                    flexShrink: 0
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleCopyText}
                        disabled={cardType === 'pokemon' && !selectedCardPokemon}
                    >
                        📋 Copy Text
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadImage}
                        disabled={(cardType === 'pokemon' && !selectedCardPokemon) || isExporting}
                    >
                        {isExporting ? '⏳ Exporting…' : '📷 Download Image'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Trainer Card Sub-component
// ============================================================
const TrainerCard = ({ trainer, pokemon }) => (
    <div
        id="trainerCardExport"
        style={{
            background: 'linear-gradient(145deg, #f5a623 0%, #e8941c 50%, #d4820f 100%)',
            borderRadius: '20px',
            padding: '24px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 12px 40px rgba(245, 166, 35, 0.4), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.3)'
        }}
    >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
            <div style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                border: '4px solid rgba(255,255,255,0.6)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                flexShrink: 0,
                color: '#f5a623'
            }}>
                {!trainer.avatar && '👤'}
            </div>
            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.3)', color: 'white' }}>
                    {trainer.name || 'Unnamed Trainer'}
                    <span style={{ marginLeft: '8px', fontSize: '22px', opacity: 0.9 }}>
                        {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                    </span>
                </h2>
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    marginTop: '6px',
                    fontSize: '13px',
                    fontWeight: 600
                }}>
                    Level {trainer.level} • {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.slice(0, 2).join(' / ') : 'Trainer'}
                </div>
            </div>
        </div>

        {/* Stats - Horizontal bar rows */}
        <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '14px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <SectionHeader
                label="Stats"
                rightContent={`Max HP: ${(trainer.stats.hp * 4) + (trainer.level * 4)}`}
            />
            {[
                { label: 'HP', key: 'hp', value: trainer.stats.hp },
                { label: 'ATK', key: 'atk', value: trainer.stats.atk },
                { label: 'DEF', key: 'def', value: trainer.stats.def },
                { label: 'SATK', key: 'satk', value: trainer.stats.satk },
                { label: 'SDEF', key: 'sdef', value: trainer.stats.sdef },
                { label: 'SPD', key: 'spd', value: trainer.stats.spd }
            ].map(stat => (
                <StatBar
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    maxStat={20}
                    color={CARD_TOKENS.statColors[stat.label]}
                />
            ))}
        </div>

        {/* Features - Pill badges */}
        {trainer.features?.length > 0 && (
            <div style={{ marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <SectionHeader label="Features" />
                <div style={{
                    background: 'rgba(0,0,0,0.15)',
                    padding: '8px 8px 6px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexWrap: 'wrap'
                }}>
                    {trainer.features.map((f, i) => (
                        <PillTag key={i} text={typeof f === 'object' ? f.name : f} color="rgba(255,255,255,0.12)" />
                    ))}
                </div>
            </div>
        )}

        {/* Skills - Pill badges */}
        {(Array.isArray(trainer.skills) ? trainer.skills.length > 0 : Object.keys(trainer.skills || {}).length > 0) && (
            <div style={{ marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <SectionHeader label="Skills" />
                <div style={{
                    background: 'rgba(0,0,0,0.15)',
                    padding: '8px 8px 6px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexWrap: 'wrap'
                }}>
                    {Array.isArray(trainer.skills)
                        ? trainer.skills.map((s, i) => (
                            <PillTag key={i} text={s} color="rgba(255,215,0,0.15)" />
                        ))
                        : Object.entries(trainer.skills || {})
                            .filter(([_, rank]) => rank > 0)
                            .map(([name, rank]) => (
                                <PillTag
                                    key={name}
                                    text={rank === 2 ? `${name} ★★` : name}
                                    color={rank === 2 ? 'rgba(255,215,0,0.25)' : 'rgba(255,215,0,0.15)'}
                                />
                            ))
                    }
                </div>
            </div>
        )}

        {/* Footer - Three mini-cards */}
        <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '14px',
            position: 'relative',
            zIndex: 1
        }}>
            {[
                { icon: '💰', label: 'Money', value: `₽${(trainer.money || 0).toLocaleString()}` },
                { icon: '🏅', label: 'Badges', value: trainer.badges?.length || 0 },
                { icon: '⚡', label: 'Pokémon', value: pokemon.length }
            ].map(item => (
                <div key={item.label} style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    padding: '10px 8px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>{item.icon}</div>
                    <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600, marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{item.value}</div>
                </div>
            ))}
        </div>

        {/* Branding */}
        <div style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '10px',
            opacity: 0.6,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1
        }}>
            PTA Dex • Trainer Card
        </div>
    </div>
);

// ============================================================
// Team Card Sub-component
// ============================================================
const TeamCard = ({ trainer, party }) => (
    <div
        id="teamCardExport"
        style={{
            background: 'linear-gradient(160deg, #2d2d2d 0%, #1a1a1a 100%)',
            borderRadius: '20px',
            padding: '24px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            minWidth: '520px',
            border: '2px solid rgba(255,255,255,0.1)'
        }}
    >
        {/* Background gradient overlay */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '120px',
            background: 'linear-gradient(180deg, rgba(245, 166, 35, 0.15) 0%, transparent 100%)',
            pointerEvents: 'none'
        }} />

        {/* Header - Trainer Info */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '18px',
            position: 'relative',
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2), rgba(232, 148, 28, 0.1))',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid rgba(245, 166, 35, 0.3)'
        }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: trainer.avatar ? `url(${trainer.avatar}) center/cover` : 'linear-gradient(135deg, #f5a623 0%, #e8941c 100%)',
                border: '3px solid rgba(245, 166, 35, 0.6)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                flexShrink: 0
            }}>
                {!trainer.avatar && '👤'}
            </div>
            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.4)', color: 'white' }}>
                    {trainer.name || 'Unnamed Trainer'}
                    <span style={{ marginLeft: '8px', fontSize: '18px', opacity: 0.8 }}>
                        {trainer.gender === 'male' ? '♂' : trainer.gender === 'female' ? '♀' : ''}
                    </span>
                </h2>
                <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '12px', fontWeight: 500 }}>
                    Level {trainer.level} • {(trainer.classes && trainer.classes.length > 0) ? trainer.classes.slice(0, 2).join(' / ') : 'Trainer'}
                </p>
            </div>
            <div style={{
                textAlign: 'right',
                fontSize: '11px',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: '8px'
            }}>
                <div style={{ color: '#ffd700', fontWeight: 600 }}>₽{(trainer.money || 0).toLocaleString()}</div>
                <div style={{ opacity: 0.7, marginTop: '2px' }}>{trainer.badges?.length || 0} Badges</div>
            </div>
        </div>

        {/* Party Section Title */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '14px',
            position: 'relative',
            zIndex: 1
        }}>
            <span style={{
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#f5a623'
            }}>
                Active Party
            </span>
            <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #f5a623, transparent)', borderRadius: '1px' }} />
            <span style={{
                fontSize: '12px',
                background: 'rgba(245, 166, 35, 0.2)',
                padding: '4px 10px',
                borderRadius: '10px',
                fontWeight: 600
            }}>{party.length}/6</span>
        </div>

        {/* Party Pokemon Grid - 3 columns (2 rows of 3 = full team) */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            position: 'relative',
            zIndex: 1
        }}>
            {party.length > 0 ? party.map((poke, idx) => (
                <TeamPokemonSlot key={poke.id} poke={poke} idx={idx} />
            )) : (
                Array(6).fill(null).map((_, idx) => (
                    <EmptySlot key={idx} />
                ))
            )}
            {/* Fill remaining slots if party < 6 */}
            {party.length > 0 && party.length < 6 && Array(6 - party.length).fill(null).map((_, idx) => (
                <EmptySlot key={`empty-${idx}`} />
            ))}
        </div>

        {/* Footer */}
        <div style={{
            marginTop: '18px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            position: 'relative',
            zIndex: 1
        }}>
            <span style={{ color: '#f5a623', fontWeight: 600, letterSpacing: '1px' }}>PTA DEX</span>
            <span style={{ opacity: 0.5 }}>{new Date().toLocaleDateString()}</span>
        </div>
    </div>
);

// ============================================================
// Team Pokemon Slot Sub-component (horizontal layout)
// ============================================================
const TeamPokemonSlot = ({ poke, idx }) => {
    const pokeStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const currentHP = maxHP - (poke.currentDamage || 0);
    const hpPercent = (currentHP / maxHP) * 100;
    const primaryType = poke.types?.[0] || 'Normal';
    const secondaryType = poke.types?.[1];
    const genderIcon = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '';
    const bgGradient = secondaryType
        ? `linear-gradient(145deg, ${getTypeColor(primaryType)}cc, ${getTypeColor(secondaryType)}cc)`
        : `linear-gradient(145deg, ${getTypeColor(primaryType)}cc, ${getTypeColor(primaryType)}66)`;

    // All abilities
    const abilities = poke.abilities && poke.abilities.length > 0
        ? poke.abilities
        : poke.ability ? [poke.ability] : [];

    return (
        <div style={{
            background: bgGradient,
            borderRadius: '12px',
            padding: '10px 10px 8px',
            border: '2px solid rgba(255,255,255,0.25)',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
        }}>
            {/* Slot number badge */}
            <div style={{
                position: 'absolute',
                top: '-8px',
                left: '-8px',
                width: '22px',
                height: '22px',
                background: 'linear-gradient(135deg, #f5a623, #e8941c)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                border: '2px solid #1a1a1a',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}>
                {idx + 1}
            </div>

            {/* Sprite */}
            {(() => {
                const img = getPokemonDisplayImage(poke);
                return img
                    ? <img src={img} alt={poke.name} onError={e => { e.currentTarget.style.display = 'none'; }} style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))' }} />
                    : <div style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', opacity: 0.6 }}>🎴</div>;
            })()}

            {/* Name + level */}
            <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {poke.name || poke.species || 'Unknown'}{genderIcon ? ` ${genderIcon}` : ''}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: 600, marginTop: '1px' }}>
                    Lv.{poke.level}
                </div>
            </div>

            {/* Abilities */}
            {abilities.length > 0 && (
                <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {abilities.map((ab, i) => (
                        <span key={i} style={{
                            padding: '1px 6px',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: 600,
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            fontStyle: 'italic'
                        }}>
                            {ab}
                        </span>
                    ))}
                </div>
            )}

            {/* Type pills */}
            <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {poke.types?.map(type => (
                    <span key={type} style={{
                        padding: '1px 7px',
                        borderRadius: '8px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        background: 'rgba(0,0,0,0.35)',
                        border: `1px solid ${getTypeColor(type)}`
                    }}>
                        {type}
                    </span>
                ))}
            </div>

            {/* HP bar */}
            <div style={{ width: '100%' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '9px',
                    fontWeight: 700,
                    marginBottom: '2px',
                    opacity: 0.9
                }}>
                    <span>HP</span>
                    <span>{currentHP}/{maxHP}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${hpPercent}%`,
                        background: hpPercent > 50 ? 'linear-gradient(90deg, #4caf50, #8bc34a)' :
                            hpPercent > 25 ? 'linear-gradient(90deg, #ff9800, #ffc107)' : 'linear-gradient(90deg, #f44336, #e91e63)',
                        borderRadius: '3px'
                    }} />
                </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                {[
                    { label: 'HP', value: pokeStats.hp, color: CARD_TOKENS.statColors.HP },
                    { label: 'AT', value: pokeStats.atk, color: CARD_TOKENS.statColors.ATK },
                    { label: 'DF', value: pokeStats.def, color: CARD_TOKENS.statColors.DEF },
                    { label: 'SA', value: pokeStats.satk, color: CARD_TOKENS.statColors.SATK },
                    { label: 'SD', value: pokeStats.sdef, color: CARD_TOKENS.statColors.SDEF },
                    { label: 'SP', value: pokeStats.spd, color: CARD_TOKENS.statColors.SPD }
                ].map(stat => (
                    <span key={stat.label} style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        background: `${stat.color}99`,
                        padding: '1px 4px',
                        borderRadius: '3px'
                    }}>
                        {stat.label} {stat.value}
                    </span>
                ))}
            </div>
        </div>
    );
};

// ============================================================
// Empty Slot Sub-component
// ============================================================
const EmptySlot = () => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: '16px 10px',
        border: '2px dashed rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '130px',
        flexDirection: 'column',
        gap: '6px'
    }}>
        <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            opacity: 0.3
        }}>
            +
        </div>
        <span style={{ opacity: 0.25, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Empty Slot</span>
    </div>
);

// ============================================================
// Pokemon Card Sub-component
// ============================================================
const PokemonCard = ({ poke }) => {
    const actualStats = getActualStats(poke);
    const maxHP = calculatePokemonHP(poke);
    const currentHP = maxHP - (poke.currentDamage || 0);
    const hpPercent = (currentHP / maxHP) * 100;
    const genderSymbol = poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : poke.gender === 'genderless' ? '⚪' : '';
    const primaryType = poke.types[0] || 'Normal';
    const secondaryType = poke.types[1];
    const bgGradient = secondaryType
        ? `linear-gradient(145deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(secondaryType)} 100%)`
        : `linear-gradient(145deg, ${getTypeColor(primaryType)} 0%, ${getTypeColor(primaryType)}bb 100%)`;

    // Build nature display with buff/nerf
    const natureData = poke.nature && GAME_DATA?.natures ? GAME_DATA.natures[poke.nature] : null;
    const natureDisplay = poke.nature ? (
        <span>
            {poke.nature}
            {natureData?.buff && natureData?.nerf && (
                <span style={{ fontSize: '11px' }}>
                    {' ('}
                    <span style={{ color: '#69f0ae', fontWeight: 700 }}>+{natureData.buff.toUpperCase()}</span>
                    {' / '}
                    <span style={{ color: '#ff8a80', fontWeight: 700 }}>-{natureData.nerf.toUpperCase()}</span>
                    {')'}
                </span>
            )}
        </span>
    ) : null;

    return (
        <div
            id="pokemonCardExport"
            style={{
                background: bgGradient,
                borderRadius: '20px',
                padding: '24px',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: `0 12px 40px ${getTypeColor(primaryType)}66, 0 4px 12px rgba(0,0,0,0.2)`,
                position: 'relative',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.3)'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                {(() => {
                    const spriteUrl = getPokemonDisplayImage(poke);
                    return (
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.2)',
                            border: '4px solid rgba(255,255,255,0.5)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '44px',
                            flexShrink: 0,
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {spriteUrl
                                ? <img src={spriteUrl} alt={poke.species || poke.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                : '?'
                            }
                        </div>
                    );
                })()}
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, textShadow: '0 3px 6px rgba(0,0,0,0.4)', color: 'white' }}>
                        {poke.name} <span style={{ opacity: 0.9 }}>{genderSymbol}</span>
                    </h2>
                    {poke.species && poke.species !== poke.name && (
                        <p style={{ margin: '2px 0', opacity: 0.85, fontSize: '13px', fontStyle: 'italic' }}>{poke.species}</p>
                    )}
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        marginTop: '6px',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        Level {poke.level} • {natureDisplay || 'Unknown'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        {poke.types.map(type => (
                            <span key={type} style={{
                                background: 'rgba(0,0,0,0.35)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                border: `2px solid ${getTypeColor(type)}`,
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)'
                            }}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* HP Bar */}
            <div style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>HP</span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{currentHP} / {maxHP}</span>
                </div>
                <div style={{
                    height: '12px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '6px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${hpPercent}%`,
                        background: hpPercent > 50
                            ? 'linear-gradient(90deg, #4caf50, #8bc34a)'
                            : hpPercent > 25
                                ? 'linear-gradient(90deg, #ff9800, #ffc107)'
                                : 'linear-gradient(90deg, #f44336, #e91e63)',
                        borderRadius: '6px',
                        boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                    }} />
                </div>
            </div>

            {/* Abilities - Prominent glass panel */}
            {((poke.abilities && poke.abilities.length > 0) || poke.ability) && (
                <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    position: 'relative',
                    zIndex: 1,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <SectionHeader label="Abilities" />
                    {poke.abilities && poke.abilities.length > 0
                        ? poke.abilities.map((ability, i) => (
                            <div key={i} style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '4px 10px',
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: '8px',
                                marginBottom: i < poke.abilities.length - 1 ? '4px' : 0
                            }}>
                                {ability}
                            </div>
                        ))
                        : (
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '4px 10px',
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: '8px'
                            }}>
                                {poke.ability}
                            </div>
                        )
                    }
                </div>
            )}

            {/* Stats - Horizontal bar rows with nature indicators */}
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <SectionHeader
                    label="Stats"
                    rightContent={`STAB: +${calculateSTAB(poke.level)}`}
                />
                {[
                    { label: 'HP', key: 'hp', value: actualStats.hp },
                    { label: 'ATK', key: 'atk', value: actualStats.atk },
                    { label: 'DEF', key: 'def', value: actualStats.def },
                    { label: 'SATK', key: 'satk', value: actualStats.satk },
                    { label: 'SDEF', key: 'sdef', value: actualStats.sdef },
                    { label: 'SPD', key: 'spd', value: actualStats.spd }
                ].map(stat => (
                    <StatBar
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        maxStat={30}
                        color={CARD_TOKENS.statColors[stat.label]}
                        indicator={getNatureIndicator(poke.nature, stat.key)}
                    />
                ))}
            </div>

            {/* Moves - Enhanced 2-column grid */}
            {poke.moves && poke.moves.length > 0 && (
                <div style={{ position: 'relative', zIndex: 1, marginBottom: '14px' }}>
                    <SectionHeader label="Moves" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {poke.moves.slice(0, 8).map((move, i) => {
                            const freqAbbr = getFrequencyAbbr(move.frequency);
                            const catIcon = CARD_TOKENS.categoryIcons[move.category] || '';
                            return (
                                <div key={i} style={{
                                    background: 'rgba(0,0,0,0.25)',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    borderLeft: `4px solid ${getTypeColor(move.type)}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    {/* Top row: Name + frequency pill */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{move.name}</span>
                                        {freqAbbr && (
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                background: 'rgba(255,255,255,0.15)',
                                                padding: '1px 6px',
                                                borderRadius: '8px',
                                                flexShrink: 0
                                            }}>
                                                {freqAbbr}
                                            </span>
                                        )}
                                    </div>
                                    {/* Bottom row: Category + damage */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '10px',
                                        opacity: 0.85
                                    }}>
                                        {catIcon && <span style={{ fontSize: '10px' }}>{catIcon}</span>}
                                        <span style={{ fontWeight: 600 }}>{move.category || move.type}</span>
                                        {move.damage && (
                                            <span style={{
                                                marginLeft: 'auto',
                                                fontWeight: 700,
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '0 5px',
                                                borderRadius: '4px'
                                            }}>
                                                {move.damage}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Notes */}
            {poke.notes && (
                <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                    position: 'relative',
                    zIndex: 1,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <SectionHeader label="Notes" />
                    <p style={{
                        margin: 0,
                        fontSize: '11px',
                        opacity: 0.85,
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {poke.notes}
                    </p>
                </div>
            )}

            {/* Held Item - Gold-themed glass panel */}
            {poke.heldItem && (
                <div style={{
                    background: 'rgba(255,215,0,0.15)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    border: '1px solid rgba(255,215,0,0.35)',
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '16px' }}>💎</span>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Held Item</div>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{poke.heldItem}</div>
                    </div>
                </div>
            )}

            {/* Branding */}
            <div style={{
                textAlign: 'center',
                marginTop: '14px',
                fontSize: '10px',
                opacity: 0.5,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 1
            }}>
                PTA Dex • Pokémon Card
            </div>
        </div>
    );
};

export default CardExportModal;
