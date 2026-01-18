import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <div className="h-full">
        <Routes>
          {/* Redirect root to a default entity or show landing page */}
          <Route path="/" element={<Navigate to="/medusa" replace />} />

          {/* Chat routes */}
          <Route path="/:entitySlug" element={<ChatPage />} />
          <Route path="/:entitySlug/:sessionId" element={<ChatPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
