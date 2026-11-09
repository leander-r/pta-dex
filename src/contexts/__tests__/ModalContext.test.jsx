// ============================================================
// ModalContext Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ModalProvider, useModal } from '../ModalContext.jsx';

const wrapper = ({ children }) => <ModalProvider>{children}</ModalProvider>;
const renderModal = () => renderHook(() => useModal(), { wrapper });

describe('ModalContext', () => {
    describe('showConfirm', () => {
        it('always resets to the default labels/danger flag, even after a previous custom call', () => {
            const { result } = renderModal();

            act(() => result.current.showConfirm({
                title: 'Delete Item', message: 'Sure?', confirmLabel: 'Delete', danger: true,
            }));
            expect(result.current.confirmModal.confirmLabel).toBe('Delete');
            expect(result.current.confirmModal.danger).toBe(true);

            // A second call with no overrides must NOT inherit the previous call's
            // confirmLabel/danger — it should fall back to the plain defaults.
            act(() => result.current.showConfirm({ title: 'Clear Notes?', message: 'Sure?' }));
            expect(result.current.confirmModal.confirmLabel).toBe('Confirm');
            expect(result.current.confirmModal.danger).toBe(false);
            expect(result.current.confirmModal.show).toBe(true);
        });
    });

    describe('showDetail', () => {
        it('populates type/name/data and sets show true', () => {
            const { result } = renderModal();
            act(() => result.current.showDetail('ability', 'Overgrow', { effect: 'Powers up Grass moves.' }));
            expect(result.current.detailModal).toMatchObject({
                show: true, type: 'ability', name: 'Overgrow', data: { effect: 'Powers up Grass moves.' },
            });
        });
    });

    describe('comparison modal', () => {
        it('openComparison sets both ids and shows the modal; closeComparison clears both', () => {
            const { result } = renderModal();

            act(() => result.current.openComparison('p1', 'p2'));
            expect(result.current.showComparisonModal).toBe(true);
            expect(result.current.comparisonIds).toEqual(['p1', 'p2']);

            act(() => result.current.closeComparison());
            expect(result.current.showComparisonModal).toBe(false);
            expect(result.current.comparisonIds).toEqual([]);
        });
    });

    describe('save/load and print sheet modals', () => {
        it('open/close toggles each modal independently', () => {
            const { result } = renderModal();

            act(() => result.current.openSaveLoadModal());
            expect(result.current.showSaveLoadModal).toBe(true);
            expect(result.current.showPrintSheetModal).toBe(false);

            act(() => result.current.openPrintSheet());
            expect(result.current.showPrintSheetModal).toBe(true);
            expect(result.current.showSaveLoadModal).toBe(true); // unaffected

            act(() => result.current.closeSaveLoadModal());
            expect(result.current.showSaveLoadModal).toBe(false);
            expect(result.current.showPrintSheetModal).toBe(true); // unaffected

            act(() => result.current.closePrintSheet());
            expect(result.current.showPrintSheetModal).toBe(false);
        });
    });
});
