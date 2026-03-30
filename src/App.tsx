import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RutesProvider } from './store/useRutes';
import ThemeRoot from './components/ThemeRoot';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RutesList from './pages/RutesList';
import RutaDetail from './pages/RutaDetail';
import RutaForm from './pages/RutaForm';
import Informes from './pages/Informes';
import Rankings from './pages/Rankings';
import Configuracio from './pages/Configuracio';
import Album from './pages/Album';

export default function App() {
  return (
    <BrowserRouter>
      <RutesProvider>
        <ThemeRoot>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="rutes" element={<RutesList />} />
              <Route path="nova-ruta" element={<RutaForm />} />
              <Route path="rutes/:id" element={<RutaDetail />} />
              <Route path="rutes/:id/editar" element={<RutaForm />} />
              <Route path="informes" element={<Informes />} />
              <Route path="rankings" element={<Rankings />} />
              <Route path="album" element={<Album />} />
              <Route path="configuracio" element={<Configuracio />} />
            </Route>
          </Routes>
        </ThemeRoot>
      </RutesProvider>
    </BrowserRouter>
  );
}
