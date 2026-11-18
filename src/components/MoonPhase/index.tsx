import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { MoonPhaseInfo } from '@/utils/hijriCalendar';

interface MoonPhaseProps {
    phase: MoonPhaseInfo;
    size: number;
    litColor: string;
    darkColor: string;
}

/**
 * The moon as seen that night: the lit part is bounded by the limb on one side and the
 * terminator (a half ellipse) on the other. Waxing moons are lit on the right (northern sky).
 */
export const MoonPhase: React.FC<MoonPhaseProps> = ({ phase, size, litColor, darkColor }) => {
    const r = size / 2;
    const { illum, wax } = phase;
    const rx = r * Math.abs(1 - 2 * illum);
    const limbSweep = wax ? 1 : 0;
    const terminatorSweep = illum < 0.5 ? (wax ? 0 : 1) : (wax ? 1 : 0);
    const lit = `M ${r} 0 A ${r} ${r} 0 0 ${limbSweep} ${r} ${size} A ${rx} ${r} 0 0 ${terminatorSweep} ${r} 0 Z`;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle cx={r} cy={r} r={r} fill={darkColor} />
            {illum > 0.01 && <Path d={lit} fill={litColor} />}
        </Svg>
    );
};
