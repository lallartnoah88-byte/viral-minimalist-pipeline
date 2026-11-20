import React from 'react';
import { HEIGHT, WIDTH } from '../../components/geometry';

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    {children}
  </svg>
);
