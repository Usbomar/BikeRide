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
import Mapa from './pages/Mapa';
import Comarques from './pages/Comarques';
import AnyVsAny from './pages/AnyVsAny';
import Reptes from './pages/Reptes';
import Badges from './pages/Badges';
import Comparador from './pages/Comparador';
import Heatmap from './pages/Heatmap';
import Duel from './pages/Duel';
import Meteo from './pages/Meteo';
import Diari from './pages/Diari';
import Streak from './pages/Streak';

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
              <Route path="mapa" element={<Mapa />} />
              <Route path="comarques" element={<Comarques />} />
              <Route path="any-vs-any" element={<AnyVsAny />} />
              <Route path="reptes" element={<Reptes />} />
              <Route path="badges" element={<Badges />} />
              <Route path="comparador" element={<Comparador />} />
              <Route path="heatmap" element={<Heatmap />} />
              <Route path="duel" element={<Duel />} />
              <Route path="meteo" element={<Meteo />} />
              <Route path="diari" element={<Diari />} />
              <Route path="streak" element={<Streak />} />
              <Route path="album" element={<Album />} />
              <Route path="configuracio" element={<Configuracio />} />
            </Route>
          </Routes>
        </ThemeRoot>
      </RutesProvider>
    </BrowserRouter>
  );
}
