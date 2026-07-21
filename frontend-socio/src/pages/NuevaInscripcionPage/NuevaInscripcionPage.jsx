import { useEffect, useState } from 'react';
import {
  getDisciplinasActivas,
  getDisciplinasPorSocio,
  inscribirseADisciplina,
  sumarseAListaEspera,
} from '../../services/disciplinasService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { DisciplinasListStep } from '../../components/nuevaInscripcionFlow/DisciplinasListStep';
import { DisciplinaDetalleStep } from '../../components/nuevaInscripcionFlow/DisciplinaDetalleStep';

const MENSAJES_ERROR_INSCRIPCION = {
  'no-encontrado': 'No se pudo procesar la inscripción. Volvé a intentarlo.',
  'ya-inscripto': 'Ya estás inscripto o en la lista de espera de esta disciplina.',
  'categoria-no-coincide': 'Tu categoría de socio no coincide con la requerida para esta disciplina.',
  'apto-medico': 'Necesitás actualizar tu apto médico para poder inscribirte en actividades deportivas.',
  moroso: 'Tenés pagos pendientes. Regularizá tu situación para poder inscribirte.',
  'no-autorizado': 'No pudimos procesar tu inscripción.',
  'servicio-no-disponible': 'El servicio no está disponible. Intentá más tarde.',
};

function mensajeError(codigo, categoriaRequerida) {
  if (codigo === 'categoria-no-coincide' && categoriaRequerida) {
    return `Esta disciplina es solamente para socios de categoría: ${categoriaRequerida}`;
  }
  return MENSAJES_ERROR_INSCRIPCION[codigo] || 'No se pudo registrar la inscripción. Intentá de nuevo.';
}

export function NuevaInscripcionPage({ socio, onSalir, onExito = () => {}, onIrATramites = () => {} }) {
  const [step, setStep] = useState('lista');

  const [disciplinas, setDisciplinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [estadoPorDisciplina, setEstadoPorDisciplina] = useState(new Map());

  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState(null);
  const [yaInscripto, setYaInscripto] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [errorTipo, setErrorTipo] = useState('');
  const [categoriaRequerida, setCategoriaRequerida] = useState('');
  const [sinCupo, setSinCupo] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [enEspera, setEnEspera] = useState(false);

  useBackToRoot(step, 'lista', volverALista);

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    setError(false);
    Promise.all([getDisciplinasActivas(), getDisciplinasPorSocio(socio.id)])
      .then(([activas, propias]) => {
        if (cancelled) return;
        setDisciplinas(activas);
        setEstadoPorDisciplina(new Map(propias.map((d) => [d.id, d.estado_suscripcion])));
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [socio.id]);

  function irADetalle(disciplina) {
    setDisciplinaSeleccionada(disciplina);
    setYaInscripto(estadoPorDisciplina.has(disciplina.id));
    setErrorTipo('');
    setCategoriaRequerida('');
    setSinCupo(false);
    setSubmitted(false);
    setEnEspera(false);
    setStep('detalle');
  }

  function volverALista() {
    setDisciplinaSeleccionada(null);
    setStep('lista');
  }

  async function handleInscribirme() {
    setEnviando(true);
    setErrorTipo('');
    setCategoriaRequerida('');
    setSinCupo(false);
    try {
      await inscribirseADisciplina(disciplinaSeleccionada.id, socio.id);
      setSubmitted(true);
      setTimeout(() => onExito(), 1800);
    } catch (e) {
      if (e.message === 'sin-cupo') {
        setSinCupo(true);
      } else {
        setErrorTipo(e.message);
        if (e.message === 'categoria-no-coincide') setCategoriaRequerida(e.categoriaRequerida || '');
      }
    } finally {
      setEnviando(false);
    }
  }

  async function handleSumarseListaEspera() {
    setEnviando(true);
    setErrorTipo('');
    try {
      await sumarseAListaEspera(disciplinaSeleccionada.id, socio.id);
      setSinCupo(false);
      setEnEspera(true);
      setTimeout(() => onExito(), 1800);
    } catch (e) {
      setErrorTipo(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (step === 'detalle') {
    return (
      <DisciplinaDetalleStep
        disciplina={disciplinaSeleccionada}
        yaInscripto={yaInscripto}
        onInscribirme={handleInscribirme}
        onVolver={volverALista}
        enviando={enviando}
        submitted={submitted}
        enEspera={enEspera}
        sinCupo={sinCupo}
        submitError={errorTipo ? mensajeError(errorTipo, categoriaRequerida) : ''}
        onSumarseListaEspera={handleSumarseListaEspera}
        mostrarBotonTramites={errorTipo === 'apto-medico'}
        onIrATramites={onIrATramites}
      />
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
