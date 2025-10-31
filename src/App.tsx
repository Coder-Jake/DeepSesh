"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index'; // Corrected import path and component name
import './index.css';

function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} /> {/* Using the corrected component name */}
          {/* Add other routes here as needed */}
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;