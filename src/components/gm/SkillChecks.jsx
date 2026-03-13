// ============================================================
// Skill Check Reference — PTA GM Guide, pp.60-67
// ============================================================
// DC charts for each trainer skill, organized by associated stat.

import React, { useState } from 'react';
import toast from '../../utils/toast.js';

const SKILLS = {
    HP: {
        label: 'HP Skills (Passive)',
        color: '#43a047',
        note: 'HP has no modifier — having a skill twice is redundant.',
        skills: [
            {
                name: 'Breathless',
                note: 'Passive ability — can hold breath up to 5 minutes.',
                dcs: [],
            },
            {
                name: 'Fasting',
                note: 'Passive ability — withstand a week without water, a month without food.',
                dcs: [],
            },
            {
                name: 'Endurance',
                note: 'Passive ability — does not tire from hours of physical exertion.',
                dcs: [],
            },
            {
                name: 'Resistant',
                note: 'Passive ability — 3/4 damage from Poison/Burns; +2 vs status rolls.',
                dcs: [],
            },
        ],
    },
    ATK: {
        label: 'ATK Skills',
        color: '#f44336',
        skills: [
            {
                name: 'Browbeat',
                note: 'Opposed roll. Your player must roll higher than the NPC to succeed.',
                dcs: [
                    [1,  'A pushover, coward, or baby Pokémon.'],
                    [5,  'A young bratty child, elderly person, or young Pokémon.'],
                    [10, 'A well-informed person, older teen to middle-aged, or tame Pokémon.'],
                    [15, 'A muscular or martial-capable person; an armed person; a wild Pokémon.'],
                    [20, 'A member of organized crime, a Ranger, or threatening wild Pokémon.'],
                    [30, 'A leader of organized crime or law enforcement; a powerful wild Pokémon.'],
                ],
            },
            {
                name: 'Jump',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'You trip and fall prone.'],
                    [5,  'Jump 2 ft (0.6m) up, or leap forward 5 ft (1.5m).'],
                    [10, 'Jump 4 ft (1.2m) up, or leap forward 10 ft (3m).'],
                    [15, 'Jump 5 ft (1.5m) up, or leap forward 12 ft (3.6m).'],
                    [20, 'Leap 8 ft (2.4m) up, or leap forward 20 ft (6m).'],
                    [30, 'Leap 10 ft (3m) up, or leap forward 30 ft (9m).'],
                ],
            },
            {
                name: 'Sprint',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'You trip and fall prone.'],
                    [5,  'You strain yourself and Shift at −1 this turn.'],
                    [10, 'You Shift as normal.'],
                    [15, 'You book it, Shifting at +2 this turn.'],
                    [20, 'Making great time, Shifting at +4 this turn.'],
                    [30, 'Speed demon — Overland Skill for ×4 distance this turn.'],
                ],
            },
            {
                name: 'Strength',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'You tense up and strain yourself, Flinching.'],
                    [5,  'You use your Strength as normal.'],
                    [10, 'Lift up to 150 lbs (68 kg), push 135 lbs (61 kg).'],
                    [15, 'Lift up to 250 lbs (113 kg), push 225 lbs (102 kg).'],
                    [20, 'Raise 350 lbs (158 kg), push 315 lbs (142 kg).'],
                    [30, 'Lift 800 lbs (362 kg), push 720 lbs (326 kg).'],
                ],
            },
        ],
    },
    DEF: {
        label: 'DEF Skills',
        color: '#1976d2',
        skills: [
            {
                name: 'Concentration',
                note: 'Roll when performing a concentration-heavy skill while being attacked.',
                dcs: [
                    [1,  'The lightest tap disrupts your focus.'],
                    [5,  'Maintain focus through up to 10 damage.'],
                    [10, 'Maintain focus through up to 20 damage.'],
                    [15, 'Maintain focus through up to 50 damage.'],
                    [20, 'Maintain focus through up to 150 damage.'],
                    [30, 'No amount of damage disrupts your focus.'],
                ],
            },
            {
                name: 'Deflection',
                note: 'Opposed roll. Cannot deflect Pokémon Moves, even if used by a Trainer.',
                dcs: [
                    [1,  'Unskilled combatant.'],
                    [5,  'Basic thrown object, unskilled: baseball, rock, chair.'],
                    [10, 'Decently skilled thrower, dangerous object: knife, pipe, bottle.'],
                    [15, 'Skilled thrower, dangerous object: smoke bomb, sword, axe.'],
                    [20, 'Skilled, very dangerous object: loosed arrow, grenade.'],
                    [30, 'Expert, very dangerous object: single bullet, RPG.'],
                ],
            },
            {
                name: 'Healing',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'Recover nothing.'],
                    [5,  'Recover 10% of max HP.'],
                    [10, 'Recover 15% of max HP.'],
                    [15, 'Recover 25% of max HP.'],
                    [18, 'Recover 50% of max HP.'],
                    [20, 'Recover to full HP and remove all afflictions.'],
                ],
            },
            {
                name: 'Tireless',
                note: 'Printed in Player\'s Handbook. Roll when pulling all-nighters.',
                dcs: [
                    [1,  'Fall asleep for 1d4 hours.'],
                    [5,  'Lose 25% of max HP.'],
                    [10, 'Lose 15% of max HP.'],
                    [15, 'Lose 5% of max HP.'],
                    [20, 'Lose no HP and feel fine.'],
                ],
            },
        ],
    },
    SATK: {
        label: 'SATK Skills',
        color: '#9c27b0',
        skills: [
            {
                name: 'Engineering',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'The device is foreign to you.'],
                    [5,  'You can guess the purpose but cannot operate the device.'],
                    [10, 'You know the purpose and can turn the device off.'],
                    [15, 'You can repair and operate the device.'],
                    [20, 'Expert with the device — no problems.'],
                    [30, 'Can replicate the machine with the right resources.'],
                ],
            },
            {
                name: 'History',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'You don\'t know anything.'],
                    [5,  'Heard about it in passing; not really paying attention.'],
                    [10, 'Know about the place\'s gyms, sights, famous people / know the event\'s who/what/when/why.'],
                    [15, 'Know the gym\'s team specifics / know details left out of history books.'],
                    [20, 'Hard to tell you hadn\'t been there personally.'],
                ],
            },
            {
                name: 'Investigate',
                note: 'Opposed roll if an NPC hid something. Only succeeds if the space actually holds useful info.',
                dcs: [
                    [1,  'Not hidden — left in plain sight.'],
                    [5,  'Not hidden — obscured by nearby objects.'],
                    [10, 'Not hidden — not obviously placed.'],
                    [15, 'Hidden in a rush, not obviously placed.'],
                    [20, 'Hidden — obscured by much.'],
                    [30, 'Well hidden — usually only found by those who know its whereabouts.'],
                ],
            },
            {
                name: 'Programming',
                note: 'Multiple task charts. Player must roll higher than the NPC\'s security value.',
                dcs: [
                    [5,  'Access digital device (timer, detonator, lock).'],
                    [10, 'Access personal computer; or crash individual computer.'],
                    [15, 'Access small network (small office); or brick personal computer.'],
                    [20, 'Access large network (Pokémon Centers); or crash large network.'],
                    [25, 'Access massive network (Ranger Union, Team Rocket); or brick large network.'],
                    [30, 'Brick a massive network.'],
                ],
            },
        ],
    },
    SDEF: {
        label: 'SDEF Skills',
        color: '#00897b',
        skills: [
            {
                name: 'Bluff / Diplomacy',
                note: 'Opposed roll. Player must roll higher than the NPC\'s value.',
                dcs: [
                    [1,  'A gullible idiot or baby Pokémon.'],
                    [5,  'An ignorant individual, a low-level, or a young Pokémon.'],
                    [10, 'A well-informed person or Pokémon with Intelligence 3–4.'],
                    [15, 'A martial-capable or armed person, SATK 14, or Intelligence 5 Pokémon.'],
                    [20, 'Organized crime member, Ranger, SATK 16, or Intelligence 6 Pokémon.'],
                    [30, 'Crime/law leader, SATK 20, or Intelligence 7 Pokémon.'],
                ],
            },
            {
                name: 'Perception',
                note: 'Usually rolled when something is hiding itself.',
                dcs: [
                    [1,  'Can\'t see anything.'],
                    [5,  'A not-hidden object, sound, or near-obvious thing is noticed.'],
                    [10, 'A non-obvious thing is noticed.'],
                    [15, 'Something decently hidden is noticed.'],
                    [20, 'Something expertly concealed is noticed.'],
                ],
            },
            {
                name: 'Sooth',
                note: 'If the underlying problem isn\'t fixed, the Pokémon may return to bad behavior.',
                dcs: [
                    [5,  'A crying Pokémon is comforted.'],
                    [10, 'An angry Pokémon at or below the trainer\'s level is calmed down.'],
                    [15, 'An angry or rampaging Pokémon up to twice the trainer\'s level is calmed.'],
                    [20, 'An angry, rampaging, or berserk Pokémon is calmed.'],
                ],
            },
            {
                name: 'Streetwise',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'Know nothing.'],
                    [5,  'Heard about some important people, nothing important.'],
                    [10, 'Know places to avoid and where to find questionable services.'],
                    [15, 'Know details about group leaders in the area.'],
                    [20, 'Can pass for a member of any local group.'],
                ],
            },
        ],
    },
    SPD: {
        label: 'SPD Skills',
        color: '#f57c00',
        skills: [
            {
                name: 'Acrobatics',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'You fall over.'],
                    [5,  'Navigate a board wide enough to walk on, or scale a normal fence.'],
                    [10, 'Balance across a ledge or large tree trunk; scale a building story.'],
                    [15, 'Pass through thin balance paths at full speed; scale a building side.'],
                    [20, 'No trouble scaling buildings or overcoming difficult pathways.'],
                ],
            },
            {
                name: 'Perform',
                note: 'Printed in Player\'s Handbook.',
                dcs: [
                    [1,  'You get stage fright.'],
                    [5,  'Everything goes well — a pair of unnoticed missed steps/notes.'],
                    [10, 'You get a round of applause.'],
                    [15, 'Standing ovation; up to 100 credits/day from grateful audience.'],
                    [20, 'Cheers go on for minutes; up to 1,000 credits/day; start gathering local fame.'],
                    [30, 'Your performance is the stuff of starting movements.'],
                ],
            },
            {
                name: 'Sleight of Hand',
                note: 'Opposed roll. Object must not be actively held. Large failures may be noticed.',
                dcs: [
                    [5,  'A light object (wallet, keys, phone) from an oblivious person.'],
                    [10, 'A light object from an attentive person.'],
                    [15, 'A larger object (purse, backpack, weapon) from an oblivious person.'],
                    [20, 'A larger object from an attentive person.'],
                    [30, 'A worn item, or massive object from a person.'],
                ],
            },
            {
                name: 'Stealth',
                note: 'Opposed by Perception. Based on how hidden you are and how perceptive NPCs are.',
                dcs: [
                    [5,  'Very dark space, flat/soft ground, no immediate sentries.'],
                    [10, 'Dark space, hard ground, nearby sentries are not attentive.'],
                    [15, 'Shadowed space, hard ground, sentries are attentive.'],
                    [20, 'Lit space, leaves/water on ground, sentries are attentive.'],
                ],
            },
        ],
    },
};

const ROLL_HOW = (
    <div style={{
        padding: '12px 14px', borderRadius: 8,
        background: 'var(--surface-bg)', border: '1px solid var(--border-light)',
        fontSize: 13, marginBottom: 14
    }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>How Skill Checks Work</div>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>• <strong>No skill:</strong> Roll 1d20 plain.</div>
            <div>• <strong>Skill once:</strong> Roll 1d20 + 2 + Stat Modifier.</div>
            <div>• <strong>Skill twice:</strong> Roll 1d20 + 4 + (2 × Stat Modifier).</div>
            <div>• <strong>Stat Modifier</strong> = +1 per 2 pts above 10, −1 per pt below 10 (e.g. ATK 14 → +2, ATK 9 → −1).</div>
            <div>• <em>Opposed rolls:</em> Whoever rolls higher wins. The GM may roll for NPCs or use the fixed DC values below.</div>
        </div>
    </div>
);

const SkillChecks = () => {
    const [activeGroup, setActiveGroup] = useState('ATK');
    const [roll, setRoll] = useState(null);

    const doRoll = (statMod = 0, hasSkill = false, hasTwice = false) => {
        const base  = Math.floor(Math.random() * 20) + 1;
        const bonus = hasTwice ? 4 + 2 * statMod : hasSkill ? 2 + statMod : 0;
        const total = base + bonus;
        setRoll({ base, bonus, total });
        toast.info(`Skill check: ${base}${bonus !== 0 ? (bonus >= 0 ? '+' : '') + bonus : ''} = ${total}`);
    };

    const grp = SKILLS[activeGroup];

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                📋 Skill Check DCs
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Reference DC charts for every trainer skill, as published in the PTA GM Guide (pp.60–67).
                Opposed rolls: player must roll higher than the NPC's DC value.
            </p>

            {ROLL_HOW}

            {/* Quick roll widget */}
            <div className="card-orange" style={{ marginBottom: 14, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text-primary)' }}>
                    🎲 Quick Skill Roll
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {[
                        { label: 'No Skill (1d20)',               fn: () => doRoll(0, false, false) },
                        { label: 'Skill ×1 (±0 modifier)',         fn: () => doRoll(0, true,  false) },
                        { label: 'Skill ×1 (+4 modifier)',         fn: () => doRoll(4, true,  false) },
                        { label: 'Skill ×2 (±0 modifier)',         fn: () => doRoll(0, true,  true)  },
                        { label: 'Skill ×2 (+4 modifier)',         fn: () => doRoll(4, true,  true)  },
                    ].map(({ label, fn }) => (
                        <button
                            key={label}
                            onClick={fn}
                            style={{
                                padding: '7px 12px', borderRadius: 6,
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                border: 'none', color: 'white', fontSize: 12,
                                fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {roll && (
                    <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: 'var(--tint-purple-bg)', border: '1px solid var(--tint-purple-border)',
                        fontSize: 14, color: 'var(--text-primary)'
                    }}>
                        Rolled <strong>{roll.base}</strong>
                        {roll.bonus !== 0 && <> {roll.bonus >= 0 ? '+' : ''}{roll.bonus}</>} = <strong style={{ color: '#667eea', fontSize: 18 }}>{roll.total}</strong>
                    </div>
                )}
            </div>

            {/* Stat group nav */}
            <div className="tabs" style={{ marginBottom: 14 }}>
                {Object.entries(SKILLS).map(([key, g]) => (
                    <button
                        key={key}
                        className={`tab ${activeGroup === key ? 'active' : ''}`}
                        onClick={() => setActiveGroup(key)}
                        style={{ color: activeGroup === key ? 'white' : g.color }}
                    >
                        {key}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, color: grp.color, fontSize: 14, marginBottom: 2 }}>
                    {grp.label}
                </div>
                {grp.note && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -6 }}>{grp.note}</p>
                )}

                {grp.skills.map(skill => (
                    <div
                        key={skill.name}
                        className="card-orange"
                    >
                        <div style={{
                            padding: '10px 14px', fontWeight: 700, fontSize: 14,
                            color: grp.color, borderBottom: `1px solid ${grp.color}66`
                        }}>
                            {skill.name}
                            {skill.note && (
                                <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                                    — {skill.note}
                                </span>
                            )}
                        </div>
                        {skill.dcs.length === 0 ? (
                            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
                                Passive ability — no roll required.
                            </div>
                        ) : (
                            <div style={{ padding: '8px 14px' }}>
                                {skill.dcs.map(([dc, result]) => (
                                    <div key={dc} style={{
                                        display: 'flex', gap: 10, padding: '5px 0',
                                        borderBottom: '1px solid var(--border-light)',
                                        fontSize: 13, alignItems: 'flex-start'
                                    }}>
                                        <span style={{
                                            fontWeight: 700, color: grp.color,
                                            width: 28, flexShrink: 0, textAlign: 'right'
                                        }}>
                                            {dc}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkillChecks;
