import { useEffect, useState } from 'react';
import { getDisciplinasActivas } from '../../services/disciplinasService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { DisciplinasListStep } from '../../components/nuevaInscripcionFlow/DisciplinasListStep';
import { DisciplinaDetalleStep } from '../../components/nuevaInscripcionFlow/DisciplinaDetalleStep';
import { ProximamenteOverlay } from '../../components/ProximamenteOverlay/ProximamenteOverlay';

export function NuevaInscripcionPage({ onSalir }) {
  const [step, setStep] = useState('lista');

  const [disciplinas, setDisciplinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState(null);
  const [mostrarProximamente, setMostrarProximamente] = useState(false);

  useBackToRoot(step, 'lista', volverALista);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(false);
    getDisciplinasActivas()
      .then((data) => { if (!cancelled) setDisciplinas(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, []);

  function irADetalle(disciplina) {
    setDisciplinaSeleccionada(disciplina);
    setStep('detalle');
  }

  function volverALista() {
    setDisciplinaSeleccionada(null);
    setStep('lista');
  }

  if (step === 'detalle') {
    return (
      <>
        <DisciplinaDetalleStep
          disciplina={disciplinaSeleccionada}
          onInscribirme={() => setMostrarProximamente(true)}
          onVolver={volverALista}
        />
        {mostrarProximamente && (
          <ProximamenteOverlay titulo="Inscribirme" onClose={() => setMostrarProximamente(false)} />
        )}
      </>
    );
  }

  return (
    <DisciplinasListStep
      disciplinas={disciplinas}
      cargando={cargando}
      error={error}
      onSeleccionar={irADetalle}
      onVolver={onSalir}
    />
  );
}
