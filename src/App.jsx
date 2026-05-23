import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReviewFlow from './pages/ReviewFlow';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug" element={<ReviewFlow />} />
        <Route path="/" element={<div className="min-h-screen flex items-center justify-center text-gray-500">Please provide a valid review link.</div>} />
        <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-gray-500">Page Not Found.</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
