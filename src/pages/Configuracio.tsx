import { useRef, useState } from 'react';
import { useRutes } from '../store/useRutes';
import type {
  Densitat,
  MidaLletra,
  Cantonades,
  AmpladaContingut,
  Animacions,
  Contrast,
  VoraTargetes,
  DashboardBlocId,
  RankingsBlocId,
  ThemePreset,
  ImportBackupMode,
} from '../store/useRutes';
import { parseBikeRideBackup } from '../utils/backup';
import { ACCENT_COLORS } from '../constants/colors';

const DENSITAT: { value: Densitat; label: string }[] = [
  { value: 'compact', label: 'Compacte' },
  { value: 'normal', label: 'Normal' },
];

const MIDA_LLETRA: { value: MidaLletra; label: string }[] = [
  { value: 'petit', label: 'Petit' },
  { value: 'normal', label: 'Normal' },
  { value: 'gran', label: 'Gran' },
];

const CANTONADES: { value: Cantonades; label: string }[] = [
  { value: 'suau', label: 'Suau' },
  { value: 'normal', label: 'Normal' },
  { value: 'marcat', label: 'Marcat' },
];

const AMPLADA: { value: AmpladaContingut; label: string }[] = [
  { value: 'estret', label: 'Estret' },
  { value: 'normal', label: 'Normal' },
  { value: 'ampli', label: 'Ampli' },
];

const ANIMACIONS: { value: Animacions; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'reduides', label: 'Reduïdes' },
];

const CONTRAST: { value: Contrast; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'alt', label: 'Alt' },
];

const VORA_TARGETES: { value: VoraTargetes; label: string }[] = [
  { value: 'subtil', label: 'Subtil' },
  { value: 'normal', label: 'Normal' },
  { value: 'marcada', label: 'Marcada' },
];

const PRESETS: { value: ThemePreset; label: string; desc: string }[] = [
  { value: 'default', label: 'Per defecte', desc: 'Aspecte net i equilibrat per al dia a dia.' },
  { value: 'neo', label: 'Neó nocturn', desc: 'Fons fosc amb aire de tauler futurista.' },
  { value: 'retro', label: 'Retro càlid', desc: 'Taronjos suaus i textura de paper antic.' },
  { value: 'terminal', label: 'Terminal verd', desc: 'Estètica hacking, text verd sobre fons fosc.' },
];

const DASHBOARD_BLOCS: { id: DashboardBlocId; label: string; desc: string }[] = [
  {
    id: 'kpis',
    label: 'Indicadors clau',
    desc: 'Resum principal (km acumulats), mètriques compactes, aquest mes vs anterior, distribució per tipus.',
  },
  { id: 'grafica', label: 'Evolució mensual', desc: 'Gràfica de km per període.' },
  {
    id: 'ultimes',
    label: 'Últimes rutes + accés ràpid',
    desc: 'Últimes sortides amb tipus i enllaços ràpids (nova ruta, llista, rànquings).',
  },
];

const RANKINGS_BLOCS: { id: RankingsBlocId; label: string; desc: string }[] = [
  { id: 'resum', label: 'Resum global', desc: 'Totals acumulats de km, sortides, hores i desnivell.' },
  { id: 'podis', label: 'Podis distància', desc: 'Top 3 rutes per distància amb impacte visual.' },
  { id: 'principals', label: 'Rànquings principals', desc: 'Top 10 distància, desnivell i durada.' },
  { id: 'records', label: 'Rècords personals', desc: 'Velocitat màxima i alçada màxima amb enllaç a la ruta.' },
  { id: 'comarques', label: 'Comarques', desc: 'Gràfic de sectors i taula per comarques.' },
  { id: 'altres', label: 'Altres rànquings', desc: 'Top velocitat màxima i alçada màxima.' },
];

export default function Configuracio() {
  const { config, setConfig, rutes, downloadBackup, importBackup } = useRutes();
  const [importMode, setImportMode] = useState<ImportBackupMode>('replace');
  const [includeConfig, setIncludeConfig] = useState(true);
  const [backupMsg, setBackupMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);

  const onBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setBackupMsg(null);
    if (!file) return;
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      const parsed = parseBikeRideBackup(raw);
      if (!parsed.ok) {
        setBackupMsg({ kind: 'err', text: parsed.error });
        return;
      }
      const n = parsed.data.rutes.length;
      if (importMode === 'replace') {
        const ok = window.confirm(
          `Substituir les ${rutes.length} rutes locals per les ${n} del fitxer? Les dades actuals desapareixeran en aquest ordinador (fes una exportació abans si en necessites còpia).`
        );
        if (!ok) return;
      }
      importBackup(parsed.data, { mode: importMode, includeConfig });
      setBackupMsg({
        kind: 'ok',
        text:
          importMode === 'replace'
            ? `S’han carregat ${n} rutes${includeConfig ? ' i la configuració' : ''}.`
            : `S’han fusionat ${n} rutes del fitxer (per id: s’actualitzen si ja existien)${includeConfig ? ' i la configuració' : ''}.`,
      });
    } catch {
      setBackupMsg({ kind: 'err', text: 'No s’ha pogut llegir el fitxer (JSON invàlid o corrupte).' });
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <section className="mb-6">
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-[var(--accent)]">Preferències</p>
        <h1 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-primary)]">Configuració</h1>
      </section>

      <section className="app-card">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Tema</h2>
        <div className="flex gap-2">
          {(['clar', 'fosc'] as const).map((tema) => (
            <button
              key={tema}
              type="button"
              onClick={() => setConfig({ tema })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.tema === tema
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {tema === 'clar' ? 'Clar' : 'Fosc'}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Estil visual (preset)</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">
          Canvia radicalment el look de la pàgina. Pots seguir ajustant accent i resta d'opcions després.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setConfig({ preset: p.value })}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                config.preset === p.value
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              <div className="font-semibold text-[var(--text-primary)]">{p.label}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{p.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Accent 1</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Color principal: botons, enllaços, dades destacades.</p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setConfig({ colorAccent: a.value })}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-105 ${
                config.colorAccent === a.value ? 'border-[var(--text-primary)] scale-105 ring-2 ring-offset-2 ring-[var(--accent)]' : 'border-[var(--border)]'
              }`}
              style={{ backgroundColor: a.value }}
              title={a.name}
            />
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Accent 2</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Color secundari: etiquetes, vores, enllaços secundaris i detalls. No substitueix l'accent principal.</p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setConfig({ colorAccent2: a.value })}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-105 ${
                config.colorAccent2 === a.value ? 'border-[var(--text-primary)] scale-105 ring-2 ring-offset-2 ring-[var(--accent2)]' : 'border-[var(--border)]'
              }`}
              style={{ backgroundColor: a.value }}
              title={a.name}
            />
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Superfície / reomplerts</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">
          Tercer color, independent dels dos accents: fons de botons secundaris, navegació en repòs, taques suaus i
          àrees omplertes (gràfics, targetes) sense competir amb l’accent principal.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {ACCENT_COLORS.map((a) => (
            <button
              key={`sup-${a.value}`}
              type="button"
              onClick={() => setConfig({ colorSuperficie: a.value })}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-105 ${
                config.colorSuperficie === a.value
                  ? 'border-[var(--text-primary)] scale-105 ring-2 ring-offset-2 ring-[var(--superficie)]'
                  : 'border-[var(--border)]'
              }`}
              style={{ backgroundColor: a.value }}
              title={a.name}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-md px-2 py-1 bg-[var(--superficie-soft)] text-[var(--superficie)] border border-[var(--superficie)]/25">
            Taca suau
          </span>
          <button type="button" className="rounded-md px-2 py-1 text-white bg-[var(--superficie)] hover:opacity-90">
            Botó ple
          </button>
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Densitat</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Menys espai entre blocs per veure més contingut.</p>
        <div className="flex gap-2">
          {DENSITAT.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setConfig({ densitat: d.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.densitat === d.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Mida de la lletra</h2>
        <div className="flex gap-2">
          {MIDA_LLETRA.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setConfig({ midaLletra: m.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.midaLletra === m.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Cantonades</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Arrodoniment de les targetes i botons.</p>
        <div className="flex gap-2 flex-wrap">
          {CANTONADES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setConfig({ cantonades: c.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.cantonades === c.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Amplada del contingut</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Amplada màxima de la pàgina (capçalera i contingut).</p>
        <div className="flex gap-2 flex-wrap">
          {AMPLADA.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setConfig({ ampladaContingut: a.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.ampladaContingut === a.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Animacions</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Transicions i animacions més ràpides o gairebé sense.</p>
        <div className="flex gap-2 flex-wrap">
          {ANIMACIONS.map((x) => (
            <button
              key={x.value}
              type="button"
              onClick={() => setConfig({ animacions: x.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.animacions === x.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Contrast</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Text i vores més visibles (recomanat si costa llegir).</p>
        <div className="flex gap-2 flex-wrap">
          {CONTRAST.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setConfig({ contrast: c.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.contrast === c.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Vora de les targetes</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Gruix i visibilitat de la vora de les caixes.</p>
        <div className="flex gap-2 flex-wrap">
          {VORA_TARGETES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setConfig({ voraTargetes: v.value })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                config.voraTargetes === v.value
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--superficie-soft)]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Layout de l'Inici (Dashboard)</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">
          Arrossega per canviar l'ordre dels blocs principals de la pàgina d'inici.
        </p>
        <div className="space-y-2">
          {config.dashboardLayout.blocs
            .slice()
            .sort((a, b) => a.ordre - b.ordre)
            .map((bloc) => {
              const meta = DASHBOARD_BLOCS.find((b) => b.id === bloc.id)!;
              return (
                <div
                  key={bloc.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', bloc.id);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData('text/plain') as DashboardBlocId;
                    if (!fromId || fromId === bloc.id) return;
                    const current = config.dashboardLayout.blocs.slice().sort((a, b) => a.ordre - b.ordre);
                    const fromIndex = current.findIndex((b) => b.id === fromId);
                    const toIndex = current.findIndex((b) => b.id === bloc.id);
                    if (fromIndex === -1 || toIndex === -1) return;
                    const reordered = current.slice();
                    const [moved] = reordered.splice(fromIndex, 1);
                    reordered.splice(toIndex, 0, moved);
                    const withOrdre = reordered.map((b, idx) => ({ ...b, ordre: idx + 1 }));
                    setConfig({
                      dashboardLayout: {
                        blocs: withOrdre,
                      },
                    });
                  }}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] cursor-move hover:bg-[var(--superficie-soft)] transition-colors"
                >
                  <span className="text-xs text-[var(--text-muted)] select-none">☰</span>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{meta.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{meta.desc}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="app-card">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Layout de Rànquings</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">
          Arrossega per canviar l'ordre dels blocs de la pàgina de rànquings i activa/desactiva els que vulguis.
        </p>
        <div className="space-y-2">
          {config.rankingsLayout.blocs
            .slice()
            .sort((a, b) => a.ordre - b.ordre)
            .map((bloc) => {
              const meta = RANKINGS_BLOCS.find((b) => b.id === bloc.id)!;
              const toggleVisible = () => {
                const next = config.rankingsLayout.blocs.map((b) =>
                  b.id === bloc.id ? { ...b, visible: !b.visible } : b
                );
                setConfig({
                  rankingsLayout: {
                    blocs: next,
                  },
                });
              };
              return (
                <div
                  key={bloc.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', bloc.id);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData('text/plain') as RankingsBlocId;
                    if (!fromId || fromId === bloc.id) return;
                    const current = config.rankingsLayout.blocs
                      .slice()
                      .sort((a, b) => a.ordre - b.ordre);
                    const fromIndex = current.findIndex((b) => b.id === fromId);
                    const toIndex = current.findIndex((b) => b.id === bloc.id);
                    if (fromIndex === -1 || toIndex === -1) return;
                    const reordered = current.slice();
                    const [moved] = reordered.splice(fromIndex, 1);
                    reordered.splice(toIndex, 0, moved);
                    const withOrdre = reordered.map((b, idx) => ({ ...b, ordre: idx + 1 }));
                    setConfig({
                      rankingsLayout: {
                        blocs: withOrdre,
                      },
                    });
                  }}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--superficie-soft)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={toggleVisible}
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                      bloc.visible
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {bloc.visible ? '✓' : ''}
                  </button>
                  <span className="text-xs text-[var(--text-muted)] select-none mt-0.5">☰</span>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {meta.label}
                      {!bloc.visible && (
                        <span className="ml-1 text-[var(--text-muted)]">(amagat)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">{meta.desc}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="app-card border border-[var(--accent)]/25 bg-[var(--superficie-muted)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Còpia de seguretat (JSON)</h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Exporta totes les rutes (text, números i imatges en base64 dins del JSON) i la configuració visual.
          Copia el fitxer a un altre ordinador i importa’l aquí per continuar amb les mateixes dades i aspecte.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setBackupMsg(null);
              downloadBackup();
              setBackupMsg({ kind: 'ok', text: 'S’ha descarregat el fitxer JSON.' });
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--accent)] hover:opacity-90"
          >
            Descarregar còpia
          </button>
          <input ref={backupFileRef} type="file" accept=".json,application/json" className="hidden" onChange={onBackupFile} />
          <button
            type="button"
            onClick={() => {
              setBackupMsg(null);
              backupFileRef.current?.click();
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-primary)] border border-[var(--superficie)]/35 bg-[var(--bg-card)] hover:bg-[var(--superficie-soft)]"
          >
            Importar des d’un fitxer…
          </button>
        </div>
        <div className="space-y-2 mb-3 text-xs">
          <span className="font-medium text-[var(--text-secondary)]">Mode d’importació:</span>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              Substituir tot (recomanat en un ordinador nou)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              Fusionar (per id: afegeix o actualitza rutes sense esborrar les altres)
            </label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeConfig} onChange={(e) => setIncludeConfig(e.target.checked)} />
            Importar també tema, colors i disposició de blocs
          </label>
        </div>
        {backupMsg && (
          <p
            className={`text-xs rounded-lg px-2 py-1.5 ${
              backupMsg.kind === 'ok'
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-500/15 text-red-800 dark:text-red-200'
            }`}
          >
            {backupMsg.text}
          </p>
        )}
      </section>
    </div>
  );
}
