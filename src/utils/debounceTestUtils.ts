/**
 * Test utility to verify debouncing behavior
 * This file can be used to test the debouncing improvements
 */

import logger from './logger';

export const testDebouncedBehavior = () => {
    logger.debug('=== Debounced Settings Test ===');

    // Simulate rapid setting changes to test debouncing
    const mockUpdateSettings = (settings: any) => {
        logger.debug('Settings updated:', settings);
    };

    // Test case 1: Rapid autoplay toggles
    logger.debug('Test 1: Rapid autoplay toggles');
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            logger.debug(`Toggle ${i + 1}: autoplay = ${i % 2 === 0}`);
            mockUpdateSettings({ autoplayEnabled: i % 2 === 0 });
        }, i * 50); // 50ms intervals
    }

    // Test case 2: Rapid playback rate changes
    logger.debug('Test 2: Rapid playback rate changes');
    const rates = [1.0, 1.25, 1.5, 1.75, 2.0];
    rates.forEach((rate, index) => {
        setTimeout(() => {
            logger.debug(`Rate change ${index + 1}: rate = ${rate}x`);
            mockUpdateSettings({ playbackRate: rate });
        }, 1000 + index * 30); // 30ms intervals after 1 second
    });

    // Test case 3: Audio tracking toggles
    logger.debug('Test 3: Audio tracking toggles');
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            logger.debug(`Audio tracking ${i + 1}: enabled = ${i % 2 === 0}`);
            mockUpdateSettings({ audioTrackingEnabled: i % 2 === 0 });
        }, 2000 + i * 100); // 100ms intervals after 2 seconds
    }

    logger.debug('=== Test completed ===');
    logger.debug('Expected behavior:');
    logger.debug('- Only the final value from each rapid sequence should be applied');
    logger.debug('- UI should update immediately for visual feedback');
    logger.debug('- Settings persistence should be debounced');
};

/**
 * Performance monitoring utility
 */
export const monitorPerformance = (componentName: string, operation: string) => {
    const startTime = Date.now();

    return () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        logger.debug(`${componentName} - ${operation}: ${duration}ms`);

        if (duration > 16.67) { // More than one frame at 60fps
            console.warn(`Performance warning: ${componentName} ${operation} took longer than one frame`);
        }
    };
};

/**
 * Debounce test scenarios
 */
export const testScenarios = {
    rapidToggling: {
        description: 'User rapidly toggles autoplay on/off',
        expected: 'Only final state should persist, UI should respond immediately',
    },
    fastPlaybackChanges: {
        description: 'User quickly cycles through playback speeds',
        expected: 'Only final speed should be applied to audio, UI shows all changes',
    },
    audioTrackingSpam: {
        description: 'Audio tracking toggled multiple times quickly',
        expected: 'Final tracking state preserved, no excessive scroll events',
    },
    simultaneousChanges: {
        description: 'Multiple settings changed at the same time',
        expected: 'All changes batched into single update',
    },
};
