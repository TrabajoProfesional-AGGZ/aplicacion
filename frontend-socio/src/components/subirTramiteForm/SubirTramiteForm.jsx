import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { ModalOverlay } from '../createForm/ModalOverlay';
import { StyledSelect } from '../createForm/FormFields';
import { getTiposTramite, crearTramite } from '../../services/tramitesService';
import { validarArchivoTramite } from '../../utils/formValidators';
import './SubirTramiteForm.css';

function mensajeError(err) {
  if (err?.message === 'archivo-muy-grande') return 'El archivo no puede superar los 10MB.';
  if (err?.message === 'servicio-no-disponible') return 'El servicio no está disponible. Intentá de nuevo más tarde.';
  return 'No pudimos subir el trámite. Probá de nuevo.';
}

export function SubirTramiteForm({ idSocio, onClose, onCreado }) {
  const inputRef = useRef(null);
  const [tipos, setTipos] = useState([]);
  const [tipoId, setTipoId] = useState('');
  const [archivoDataUrl, setArchivoDataUrl] = useState(null);
  const [archivoNombre, setArchivoNombre] = useState('');
  const [estado, setEstado] = useState('inicial'); // inicial | subiendo | exito | error
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getTiposTramite()
      .then((data) => { if (!cancelled) setTipos(data); })
      .catch(() => { if (!cancelled) setTipos([]); });
    return () => { cancelled = true; };
  }, []);

  const tipoSeleccionado = tipos.find((t) => String(t.id) === tipoId);
  const requiereVencimiento = Boolean(tipoSeleccionado?.requiere_vencimiento);

  async function manejarArchivoSeleccionado(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const errorValidacion = validarArchivoTramite(file);
    if (errorValidacion) {
      setArchivoDataUrl(null);
      setArchivoNombre('');
      setEstado('error');
      setError(errorValidacion);
      return;
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      setArchivoDataUrl(dataUrl);
      setArchivoNombre(file.name);
      setEstado('inicial');
      setError('');
    } catch {
      setArchivoDataUrl(null);
      setArchivoNombre('');
      setEstado('error');
      setError('No pudimos leer el archivo. Probá de nuevo.');
    }
  }

  const puedeEnviar = Boolean(tipoId) && Boolean(archivoDataUrl);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEstado('subiendo');
    setError('');
    try {
      const creado = await crearTramite(idSocio, {
        id_tipo_tramite: Number(tipoId),
        archivo_base64: archivoDataUrl,
      });
      setEstado('exito');
      onCreado(creado);
      setTimeout(onClose, 900);
    } catch (err) {
      setEstado('error');
      setError(mensajeError(err));
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <h1>Cargar trámite</h1>
        </div>
        <div className="csf-card">
          {estado === 'exito' ? (
            <p className="csf-success">
              <CheckCircle2 size={18} /> Trámite cargado, queda en revisión.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="csf-fields">
                <div className="csf-field">
                  <label className="csf-label" htmlFor="tramite-tipo">Tipo de trámite</label>
                  <StyledSelect
                    id="tramite-tipo"
                    value={tipoId}
                    onChange={(e) => setTipoId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </StyledSelect>
                </div>

                {requiereVencimiento && (
                  <p className="csf-hint">Este trámite vence al año de ser cargado.</p>
                )}

                <div className="csf-field">
                  <button
                    type="button"
                    className="tramite-adjuntar-btn"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload size={16} />
                    {archivoNombre || 'Adjuntar archivo'}
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={manejarArchivoSeleccionado}
                    style={{ display: 'none' }}
                    aria-label="Adjuntar archivo del trámite"
                  />
                  <p className="csf-hint">JPG, PNG, WEBP o PDF. Máximo 10MB.</p>
                </div>

                {estado === 'subiendo' && (
                  <p className="tramite-estado tramite-estado--subiendo">
                    <Loader2 size={16} className="tramite-spinner" /> Subiendo trámite...
                  </p>
                )}
                {estado === 'error' && error && (
                  <p className="tramite-estado tramite-estado--error">
                    <XCircle size={16} /> {error}
                  </p>
                )}
              </div>

              <div className="csf-nav csf-nav--between">
                <button type="button" className="csf-btn-back" onClick={onClose} disabled={estado === 'subiendo'}>
                  Cancelar
                </button>
                <button type="submit" className="csf-btn-submit" disabled={!puedeEnviar || estado === 'subiendo'}>
                  {estado === 'subiendo' ? 'Subiendo...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

SubirTramiteForm.propTypes = {
  idSocio: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreado: PropTypes.func.isRequired,
};
