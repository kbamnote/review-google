import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReviewFlow from './pages/ReviewFlow';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:slug" element={<ReviewFlow />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
