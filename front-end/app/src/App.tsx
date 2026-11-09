import React from 'react';
import { Providers } from './app/providers';
import DesignSystemDemo from './app/page';

export default function App():React.ReactNode {
  return (
    <Providers>
      <DesignSystemDemo />
    </Providers>
  );
}
