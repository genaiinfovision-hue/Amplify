import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FamiliesProvider } from './context/FamiliesContext';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { AssetDetail } from './pages/AssetDetail';
import { AssetDemo } from './pages/AssetDemo';
import { FamilyDetail } from './pages/FamilyDetail';
import { Pipeline } from './pages/Pipeline';
import { PipelineDetail } from './pages/PipelineDetail';
import { Submit } from './pages/Submit';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { OAuthRedirectHandler } from './components/auth/OAuthRedirectHandler';

function App() {
  return (
    <BrowserRouter>
      <OAuthRedirectHandler />
      <AuthProvider>
        <FamiliesProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="catalog/:slug" element={<AssetDetail />} />
              <Route path="catalog/:slug/demo" element={<AssetDemo />} />
              <Route path="family/:id" element={<FamilyDetail />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="pipeline/:id" element={<PipelineDetail />} />
              <Route path="submit" element={<Submit />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </FamiliesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
