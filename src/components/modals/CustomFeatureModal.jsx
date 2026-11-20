// ============================================================
// Custom Feature Modal Component
// ============================================================
// Modal for creating custom trainer features

import useModalKeyboard from '../../hooks/useModalKeyboard.js';
import { useModal, useTrainerContext } from '../../contexts/index.js';
import toast from '../../utils/toast.js';

// Mirrors ModalContext's customFeature initial state — this modal's form
// state is never otherwise reset, so without this, reopening the modal
// after creating one feature shows that feature's data still filled in.
const DEFAULT_CUSTOM_FEATURE = { name: '', category: 'Custom', prerequisites: '', frequency: '', trigger: '', target: '', effect: '' };

/**
 * CustomFeatureModal - Modal for creating custom trainer features
 * Uses UIContext for modal state, TrainerContext for updating trainer
 */
const CustomFeatureModal = () => {
    // Get from contexts
    const { showCustomFeatureModal, setShowCustomFeatureModal, customFeature, setCustomFeature, showConfirm } = useModal();
    const { trainer, setTrainer } = useTrainerContext();

    const doClose = () => {
        setShowCustomFeatureModal(false);
        setCustomFeature(DEFAULT_CUSTOM_FEATURE);
    };

    // Warn before discarding — same pattern as CustomSpeciesModal/CustomMoveModal, since this
    // form has 7 fields and previously wiped them with zero confirmation on a stray backdrop
    // click, Escape, or Cancel.
    const handleClose = () => {
        const isModified = JSON.stringify(customFeature) !== JSON.stringify(DEFAULT_CUSTOM_FEATURE);
        if (isModified) {
            showConfirm({
                title: 'Discard feature?',
                message: 'You have unsaved changes to this custom feature. Close without saving?',
                confirmLabel: 'Discard',
                danger: true,
                onConfirm: doClose,
            });
            return;
        }
        doClose();
    };

    const { modalRef } = useModalKeyboard(showCustomFeatureModal, handleClose);

    if (!showCustomFeatureModal) return null;

    const handleAddFeature = () => {
        if (!customFeature.name?.trim() || !customFeature.effect?.trim()) return;
        if ((trainer.featPoints || 0) <= 0) {
            toast.warning('Not enough feat points!');
            return;
        }
        // Same duplicate-name guard CustomMoveModal already has for moves — without it,
        // a double-click or a reopen-and-resubmit silently burns a feat point on an
        // exact duplicate feature.
        const alreadyHas = (trainer.features || []).some(f =>
            (typeof f === 'object' ? f.name : f)?.toLowerCase() === customFeature.name.trim().toLowerCase()
        );
        if (alreadyHas) {
            toast.warning(`${trainer.name || 'Trainer'} already has a feature named "${customFeature.name.trim()}"!`);
            return;
        }
        setTrainer(prev => ({
            ...prev,
            features: [...prev.features, { ...customFeature }],
            featPoints: (prev.featPoints || 0) - 1
        }));
        doClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose} role="presentation">
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px', maxHeight: 'min(90vh, 700px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="custom-feature-modal-title"
            >
                <div
                    className="modal-header"
                    style={{
                        background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
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
                        id="custom-feature-modal-title"
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
                        <span style={{ fontSize: '22px' }}>⚡</span>
                        Create Custom Feature
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
                <div className="modal-content" style={{ overflowY: 'auto', flex: 1 }}>
                    <div className="form-group">
                        <label>Feature Name *</label>
                        <input
                            type="text"
                            value={customFeature.name}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Type Specialist"
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={customFeature.category}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, category: e.target.value }))}
                        >
                            <option value="Custom">Custom</option>
                            <option value="Class">Class Feature</option>
                            <option value="General">General</option>
                            <option value="Arms">Arms</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Prerequisites</label>
                        <input
                            type="text"
                            value={customFeature.prerequisites}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, prerequisites: e.target.value }))}
                            placeholder="e.g., Level 5, 14 SATK"
                        />
                    </div>

                    <div className="form-group">
                        <label>Frequency</label>
                        <input
                            type="text"
                            value={customFeature.frequency}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, frequency: e.target.value }))}
                            placeholder="e.g., At-Will, Daily, Static"
                        />
                    </div>

                    <div className="form-group">
                        <label>Trigger (if any)</label>
                        <input
                            type="text"
                            value={customFeature.trigger}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, trigger: e.target.value }))}
                            placeholder="e.g., When your Pokémon is hit by a super-effective move"
                        />
                    </div>

                    <div className="form-group">
                        <label>Target (if any)</label>
                        <input
                            type="text"
                            value={customFeature.target}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, target: e.target.value }))}
                            placeholder="e.g., Your Pokémon, An allied Trainer"
                        />
                    </div>

                    <div className="form-group">
                        <label>Effect *</label>
                        <textarea
                            value={customFeature.effect}
                            onChange={(e) => setCustomFeature(prev => ({ ...prev, effect: e.target.value }))}
                            placeholder="Describe what this feature does..."
                            rows={4}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button className="btn btn-secondary" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={!customFeature.name?.trim() || !customFeature.effect?.trim()}
                            onClick={handleAddFeature}
                        >
                            Add Feature (1 point)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomFeatureModal;
