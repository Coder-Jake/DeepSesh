"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip'; // Import TooltipProvider
import HomePage from './pages/HomePage'; // Assuming you have a HomePage component
import './index.css'; // Assuming your global styles are here

function App() {
  return (
    <TooltipProvider> {/* Wrap the entire application with TooltipProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Add other routes here as needed */}
        </Routes>
      </Router>
    </TooltipProvider>
  );
}

export default App;