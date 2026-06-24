import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import App from './App';

import '@mantine/core/styles.css';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'color-scheme' });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark" colorSchemeManager={colorSchemeManager}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);