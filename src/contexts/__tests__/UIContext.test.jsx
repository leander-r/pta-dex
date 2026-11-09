// ============================================================
// UIContext Tests
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { UIProvider, useUI } from '../UIContext.jsx';

const wrapper = ({ children }) => <UIProvider>{children}</UIProvider>;
const renderUI = () => renderHook(() => useUI(), { wrapper });

beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-compact');
});

describe('UIContext', () => {
    describe('theme', () => {
        it('defaults to light when no saved preference and no dark system preference', () => {
            const { result } = renderUI();
            expect(result.current.theme).toBe('light');
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        it('restores a previously saved theme from localStorage', () => {
            localStorage.setItem('pta-theme', JSON.stringify('dark'));
            const { result } = renderUI();
            expect(result.current.theme).toBe('dark');
        });

        it('setTheme updates both state and the document attribute, and persists it', () => {
            const { result } = renderUI();
            act(() => result.current.setTheme('dark'));
            expect(result.current.theme).toBe('dark');
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
            expect(JSON.parse(localStorage.getItem('pta-theme'))).toBe('dark');
        });
    });

    describe('compactMode', () => {
        it('defaults to false and sets data-compact="false" on the document', () => {
            const { result } = renderUI();
            expect(result.current.compactMode).toBe(false);
            expect(document.documentElement.getAttribute('data-compact')).toBe('false');
        });

        it('setCompactMode(true) flips the document attribute and persists it', () => {
            const { result } = renderUI();
            act(() => result.current.setCompactMode(true));
            expect(document.documentElement.getAttribute('data-compact')).toBe('true');
            expect(JSON.parse(localStorage.getItem('pta-compact-mode'))).toBe(true);
        });
    });

    describe('save indicator', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('shows immediately then auto-hides after 2s', () => {
            const { result } = renderUI();
            act(() => result.current.triggerSaveIndicator(true));
            expect(result.current.showSaveIndicator).toBe(true);
            expect(result.current.isAutoSave).toBe(true);

            act(() => vi.advanceTimersByTime(2000));
            expect(result.current.showSaveIndicator).toBe(false);
        });
    });

    describe('level up notification', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('sets the notification then auto-clears after 5s', () => {
            const { result } = renderUI();
            act(() => result.current.showLevelUpNotification({ type: 'trainer', level: 2 }));
            expect(result.current.levelUpNotification).toMatchObject({ type: 'trainer', level: 2 });

            act(() => vi.advanceTimersByTime(5000));
            expect(result.current.levelUpNotification).toBeNull();
        });
    });

    describe('help modal', () => {
        it('showHelp sets the topic, closeHelp clears it', () => {
            const { result } = renderUI();
            act(() => result.current.showHelp('combat-stages'));
            expect(result.current.helpTopic).toBe('combat-stages');

            act(() => result.current.closeHelp());
            expect(result.current.helpTopic).toBeNull();
        });
    });
});
