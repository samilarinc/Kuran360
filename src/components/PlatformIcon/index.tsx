import React from 'react';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { IconSpec } from '@/types';

interface PlatformIconProps {
  spec: IconSpec;
  size?: number;
  color: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ spec, size = 20, color }) => {
  if (spec.kind === 'brand') {
    return <FontAwesome6 name={spec.name} iconStyle="brand" size={size} color={color} />;
  }
  const { Icon } = spec;
  return <Icon size={size} color={color} />;
};
