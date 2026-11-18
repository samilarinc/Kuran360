import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the user asked the system for less motion; decorative animation should stop then */
export const useReduceMotion = () => {
    const [reduce, setReduce] = useState(false);
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => { });
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
        return () => sub.remove();
    }, []);
    return reduce;
};
