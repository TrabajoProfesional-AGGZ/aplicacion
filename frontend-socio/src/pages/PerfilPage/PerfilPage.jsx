import { useRef, useState } from 'react';
import {
  ArrowLeft, Hash, Layers, IdCard, Cake, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, LogOut,
  Plus, Upload, Camera, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { ModalOverlay } from '../../components/createForm/ModalOverlay';
import { useCambiarContrasenia } from '../../hooks/useCambiarContrasenia';
import { useAuth } from '../../hooks/useAuth';
import { MAX_LEN, validarArchivoImagen, validarFortalezaPassword } from '../../utils/formValidators';
import { subirFotoSocio } from '../../services/sociosService';
import './PerfilPage.css';

function formatearFecha(fechaIso) {
  if (!fechaIso) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(fechaIso));
}

function iniciales(nombre, apellido) {
  return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
}

function PasswordInput({ id, value, onChange, onBlur, autoComplete, required, error }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="perfil-password-wrapper">
      <input
        id={id}
        type={mostrar ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        maxLength={MAX_LEN.PASSWORD}
        className={`csf-input${error ? ' csf-input--error' : ''}`}
      />
      <button
        type="button"
        className="perfil-toggle-password"
        onClick={() => setMostrar((v) => !v)}
        aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function CambiarContraseniaModal({ cerrarSesion, onClose }) {
  const {
    actual, setActual, nueva, setNueva, confirmar, setConfirmar, error, loading, handleSubmit,
  } = useCambiarContrasenia(cerrarSesion);

  const [nuevaTocada, setNuevaTocada] = useState(false);
  const nuevaError = nuevaTocada ? validarFortalezaPassword(nueva) : undefined;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <h1>Cambiar contraseña</h1>
        </div>
        <div className="csf-card">
          <form onSubmit={handleSubmit}>
            <div className="csf-fields">
              <div className="csf-field">
                <label className="csf-label" htmlFor="perfil-actual">
                  <Lock size={13} strokeWidth={2} />
                  Contraseña actual
                </label>
                <PasswordInput
                  id="perfil-actual"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="csf-field">
                <label className="csf-label" htmlFor="perfil-nueva">
                  <Lock size={13} strokeWidth={2} />
                  Nueva contraseña
                </label>
                <PasswordInput
                  id="perfil-nueva"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  onBlur={() => setNuevaTocada(true)}
                  autoComplete="new-password"
                  required
                  error={!!nuevaError}
                />
                {nuevaError ? (
                  <span className="csf-error">
                    <AlertCircle size={14} /> {nuevaError}
                  </span>
                ) : (
                  <p className="csf-hint">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>
                )}
              </div>
              <div className="csf-field">
                <label className="csf-label" htmlFor="perfil-confirmar">
                  <Lock size={13} strokeWidth={2} />
                  Confirmar nueva contraseña
                </label>
                <PasswordInput
                  id="perfil-confirmar"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && <p className="csf-form-error" role="alert">{error}</p>}
            </div>
            <div className="csf-nav csf-nav--between">
              <button type="button" className="csf-btn-back" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="csf-btn-submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalOverlay>
  );
}

function FotoPerfilModal({ socio, onClose, onFotoActualizada }) {
  const inputDispositivoRef = useRef(null);
  const inputCamaraRef = useRef(null);
  const [estado, setEstado] = useState('inicial'); // inicial | subiendo | exito | error
  const [error, setError] = useState('');

  async function manejarArchivoSeleccionado(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const errorValidacion = validarArchivoImagen(file);
    if (errorValidacion) {
      setEstado('error');
      setError(errorValidacion);
      return;
    }

    setEstado('subiendo');
    setError('');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const { foto_url } = await subirFotoSocio(socio.id, dataUrl);
      setEstado('exito');
      onFotoActualizada(foto_url);
      setTimeout(onClose, 900);
    } catch {
      setEstado('error');
      setError('No pudimos subir la foto. Probá de nuevo.');
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <h1>Foto de perfil</h1>
        </div>
        <div className="csf-card">
          <div className="foto-modal-opciones">
            <button
              type="button"
              className="foto-modal-opcion-btn"
              onClick={() => inputDispositivoRef.current?.click()}
              disabled={estado === 'subiendo'}
            >
              <Upload size={18} />
              Subir desde el dispositivo
            </button>
            <button
              type="button"
              className="foto-modal-opcion-btn"
              onClick={() => inputCamaraRef.current?.click()}
              disabled={estado === 'subiendo'}
            >
              <Camera size={18} />
              Tomar una foto en el momento
            </button>
            <input
              ref={inputDispositivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={manejarArchivoSeleccionado}
              style={{ display: 'none' }}
              aria-label="Subir archivo desde el dispositivo"
            />
            <input
              ref={inputCamaraRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              onChange={manejarArchivoSeleccionado}
              style={{ display: 'none' }}
              aria-label="Tomar una foto con la cámara"
            />
          </div>
          {estado === 'subiendo' && (
            <p className="foto-modal-estado foto-modal-estado--subiendo">
              <Loader2 size={16} className="foto-modal-spinner" /> Subiendo foto...
            </p>
          )}
          {estado === 'exito' && (
            <p className="foto-modal-estado foto-modal-estado--exito">
              <CheckCircle2 size={16} /> Foto actualizada
            </p>
          )}
          {estado === 'error' && (
            <p className="foto-modal-estado foto-modal-estado--error">
              <XCircle size={16} /> {error}
            </p>
          )}
          <div className="csf-nav csf-nav--end">
            <button type="button" className="csf-btn-back" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function PerfilPage({ socio, cerrarSesion, onVolver }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fotoModalAbierto, setFotoModalAbierto] = useState(false);
  const { setSocio } = useAuth();

  const datos = [
    { icon: Hash, label: 'Número de Socio', valor: socio.nro_socio },
    { icon: Layers, label: 'Categoría', valor: socio.categoria?.nombre },
    { icon: IdCard, label: 'Documento', valor: socio.nro_documento },
    { icon: Cake, label: 'Fecha de nacimiento', valor: formatearFecha(socio.fecha_nacimiento) },
    { icon: Mail, label: 'Email', valor: socio.email },
    { icon: Phone, label: 'Teléfono', valor: socio.telefono },
  ].filter((dato) => dato.valor);

  return (
    <div>
      <header className="perfil-page-header">
        <button type="button" className="perfil-volver" onClick={onVolver} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="perfil-page-title">Mi perfil</h1>
        <span className="perfil-header-spacer" aria-hidden="true" />
      </header>

      <main className="perfil-page">
        <section className="perfil-card">
          <div className="perfil-card-top">
            <div className="perfil-avatar-wrapper">
              {socio.foto_url
                ? <img src={socio.foto_url} alt="" className="perfil-avatar-img" referrerPolicy="no-referrer" />
                : <span className="perfil-avatar" aria-hidden="true">{iniciales(socio.nombre, socio.apellido)}</span>}
              <button
                type="button"
                className="perfil-avatar-edit-btn"
                aria-label="Cambiar foto de perfil"
                onClick={() => setFotoModalAbierto(true)}
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="perfil-card-top-text">
              <h2 className="perfil-card-nombre">{socio.nombre} {socio.apellido}</h2>
              {socio.estado?.nombre && (
                <span className="perfil-card-estado">Estado: {socio.estado.nombre}</span>
              )}
            </div>
          </div>

          {datos.length > 0 && (
            <div className="perfil-datos-list">
              {datos.map(({ icon: Icon, label, valor }) => (
                <div className="perfil-dato-row" key={label}>
                  <span className="perfil-dato-icon"><Icon size={18} /></span>
                  <span className="perfil-dato-text">
                    <span className="perfil-dato-label">{label}</span>
                    <span className="perfil-dato-valor">{valor}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <button type="button" className="perfil-cambiar-button" onClick={() => setModalAbierto(true)}>
          Cambiar contraseña
        </button>

        <button type="button" className="perfil-cerrar-sesion" onClick={cerrarSesion}>
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </main>

      {modalAbierto && (
        <CambiarContraseniaModal cerrarSesion={cerrarSesion} onClose={() => setModalAbierto(false)} />
      )}

      {fotoModalAbierto && (
        <FotoPerfilModal
          socio={socio}
          onClose={() => setFotoModalAbierto(false)}
          onFotoActualizada={(foto_url) => setSocio({ ...socio, foto_url })}
        />
      )}
    </div>
  );
}
