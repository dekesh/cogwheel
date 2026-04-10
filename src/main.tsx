import '@mantine/core/styles.css';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

import { App } from './App';
import { theme } from './theme';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root was not found');
}

createRoot(container).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
);
