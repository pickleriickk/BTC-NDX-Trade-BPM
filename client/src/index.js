import React from 'react';
import { createRoot } from 'react-dom/client';
import DashboardChart from './DashboardChart';

const container = document.getElementById('root');

// Create a root
const root = createRoot(container);

// Render your app
root.render(
  <React.StrictMode>
    <DashboardChart />
  </React.StrictMode>,
);
