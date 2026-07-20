import { useState } from 'react';
import { ArrowLeft, Hash, CheckCircle2, AlertCircle, Trash2, UserRound } from 'lucide-react';
import { getSocioByNroSocio } from '../../services/sociosService';
import './AgregarSociosStep.css';

export function AgregarSociosStep({ socioTitular, sociosAgregados, onAgregar, onQuitar, onContinuar, onVolver }) {
  const [nroSocioInput, setNroSocioInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [socioPreview, setSocioPreview] = useState(null);

  async function previewSocio(value) {
    if (!value?.trim()) return;
    try {
      const socio = await getSocioByNroSocio(value.trim());
      setSocioPreview(socio);
    } catch {
      // preview silently fails, el error real aparece recién al agregar
    }
  }

  async function agregarSocio() {
    const nro = nroSocioInput.trim();
    if (!nro) return;

    if (nro === socioTitular.nro_socio) {
      setError('Ya sos parte de esta reserva como titular.');
      return;
    }
    if (sociosAgregados.some((s) => s.nro_socio === nro)) {
      setError('Este socio ya fue agregado.');
      return;
    }

    const socioYaResuelto = socioPreview?.nro_socio === nro ? socioPreview : null;
    if (socioYaResuelto) {
      onAgregar(socioYaResuelto);
      setNroSocioInput('');
      setSocioPreview(null);
      setError('');
      return;
    }

    setBuscando(true);
    setError('');
    try {
      const socio = await getSocioByNroSocio(nro);
      if (socio.id === socioTitular.id || sociosAgregados.some((s) => s.id === socio.id)) {
        setError('Este socio ya fue agregado.');
        return;
      }
      onAgregar(socio);
      setNroSocioInput('');
      setSocioPreview(null);
    } catch {
      setError('No se encontró ningún socio con ese número.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section className="agregar-socios">
      <button type="button" className="agregar-socios-volver-btn" onClick={onVolver}>
        <ArrowLeft size={18} />
        Volver
      </button>

      <section className="agregar-socios-banner">
        <div className="agregar-socios-banner-texture" aria-hidden="true" />
        <div className="agregar-socios-banner-content">
          <span className="agregar-socios-banner-eyebrow">Nueva reserva</span>
          <h2 className="agregar-socios-banner-title">Agregar socios</h2>
          <p className="agregar-socios-banner-subtitulo">
            Podés continuar solo con vos, o sumar más socios a esta reserva buscándolos por número.
          </p>
        </div>
      </section>

      <div className="agregar-socios-input-row">
        <div className="agregar-socios-input-wrapper">
          <Hash size={15} className="agregar-socios-input-icono" />
          <input
            type="text"
            className="agregar-socios-input"
            placeholder="Número de socio"
            value={nroSocioInput}
            onChange={(e) => { setNroSocioInput(e.target.value); setSocioPreview(null); setError(''); }}
            onBlur={(e) => previewSocio(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarSocio(); } }}
          />
        </div>
        <button
          type="button"
          className="agregar-socios-btn"
          onClick={agregarSocio}
          disabled={buscando || !nroSocioInput.trim()}
        >
          Agregar
        </button>
      </div>

      {socioPreview && socioPreview.nro_socio === nroSocioInput.trim() && (
        <span className="agregar-socios-preview">
          <CheckCircle2 size={13} color="var(--status-success-border)" />
          {socioPreview.nombre} {socioPreview.apellido}
        </span>
      )}

      {error && (
        <p className="agregar-socios-error">
          <AlertCircle size={13} />
          {error}
        </p>
      )}

      <ul className="agregar-socios-lista">
        <li className="agregar-socios-item">
          <span className="agregar-socios-item-icono"><UserRound size={16} /></span>
          <span className="agregar-socios-item-info">
            <span className="agregar-socios-item-nombre">{socioTitular.nombre} {socioTitular.apellido}</span>
            <span className="agregar-socios-item-nro">N° {socioTitular.nro_socio}</span>
          </span>
          <span className="agregar-socios-item-badge">Titular</span>
        </li>
        {sociosAgregados.map((s) => (
          <li className="agregar-socios-item" key={s.id}>
            <span className="agregar-socios-item-icono"><UserRound size={16} /></span>
            <span className="agregar-socios-item-info">
              <span className="agregar-socios-item-nombre">{s.nombre} {s.apellido}</span>
              <span className="agregar-socios-item-nro">N° {s.nro_socio}</span>
            </span>
            <button
              type="button"
              className="agregar-socios-item-quitar"
              onClick={() => onQuitar(s.id)}
              aria-label={`Quitar a ${s.nombre} ${s.apellido}`}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="agregar-socios-continuar-btn" onClick={onContinuar}>
        Continuar
      </button>
    </section>
  );
}
