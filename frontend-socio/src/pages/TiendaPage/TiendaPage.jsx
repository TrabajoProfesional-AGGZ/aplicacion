import { useState, useEffect } from 'react';
import { Package, Minus, Plus, Receipt } from 'lucide-react';
import { getProductosDisponibles, getProducto, comprarProducto, getComprasPorSocio } from '../../services/tiendaService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { SkeletonRows } from '../../components/SkeletonRows/SkeletonRows';
import { PagoCuotaFlow } from '../../components/pagoCuota/PagoCuotaFlow';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ScreenTransition } from '../../components/ScreenTransition/ScreenTransition';
import './TiendaPage.css';

const ORDEN_VISTA = { lista: 0, detalle: 1, 'mis-compras': 1, pago: 2 };

const MENSAJES_ERROR_COMPRA = {
  'producto-no-encontrado': 'No se pudo procesar la compra. Volvé a intentarlo.',
  'sin-stock': 'No queda stock suficiente de este producto.',
  'producto-inactivo': 'Este producto ya no está disponible.',
  moroso: 'Tenés pagos pendientes. Regularizá tu situación para poder comprar.',
  suspendido: 'Tu cuenta está suspendida. Contactate con el club para más información.',
  'no-autorizado': 'No pudimos procesar tu compra.',
  'servicio-no-disponible': 'El servicio no está disponible. Intentá más tarde.',
};

function mensajeError(codigo) {
  return MENSAJES_ERROR_COMPRA[codigo] || 'No se pudo comprar el producto. Intentá de nuevo.';
}

function formatearPrecio(monto) {
  return `$${Number(monto).toLocaleString('es-AR')}`;
}

/**
 * Catálogo de la tienda del club: lista → detalle → compra → pago, más una
 * vista de compras ya pagadas ("Mis compras").
 */
export function TiendaPage({ socio }) {
  const [productos, setProductos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);
  const [comprando, setComprando] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  const [vistaInterna, setVistaInterna] = useState('lista');
  const [enviandoCompra, setEnviandoCompra] = useState(false);
  const [errorCompra, setErrorCompra] = useState('');
  const [compraEnCurso, setCompraEnCurso] = useState(null);

  const [misCompras, setMisCompras] = useState(null);
  const [cargandoMisCompras, setCargandoMisCompras] = useState(false);
  const [errorMisCompras, setErrorMisCompras] = useState(false);

  function volverALista() {
    setDetalle(null);
    setError(null);
    setComprando(false);
    setCantidad(1);
    setErrorCompra('');
    setCompraEnCurso(null);
    setVistaInterna('lista');
  }

  // El paso 'pago' ya creó la compra "Iniciada" en el backend: el gesto de
  // atrás aterriza en "Mis compras", no reinicia la selección como 'detalle'.
  function manejarVolver() {
    volverALista();
    if (vistaInterna === 'pago') setVistaInterna('mis-compras');
  }

  useBackToRoot(vistaInterna, 'lista', manejarVolver);

  const [vistaAnterior, setVistaAnterior] = useState(vistaInterna);
  const [direccion, setDireccion] = useState(0);
  if (vistaInterna !== vistaAnterior) {
    const diferencia = ORDEN_VISTA[vistaInterna] - ORDEN_VISTA[vistaAnterior];
    setDireccion(diferencia > 0 ? 1 : diferencia < 0 ? -1 : 0);
    setVistaAnterior(vistaInterna);
  }

  async function cargarProductos() {
    try {
      setLoading(true);
      setProductos(await getProductosDisponibles());
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarProductos(); }, []);

  async function abrirDetalle(id) {
    try {
      setLoadingDetalle(true);
      setError(null);
      setComprando(false);
      setCantidad(1);
      setErrorCompra('');
      setDetalle(await getProducto(id));
      setVistaInterna('detalle');
    } catch {
      setError('No se pudo cargar el producto.');
    } finally {
      setLoadingDetalle(false);
    }
  }

  function sumarCantidad() {
    setCantidad((c) => Math.min(c + 1, Number(detalle.stock)));
  }

  function restarCantidad() {
    setCantidad((c) => Math.max(c - 1, 1));
  }

  async function confirmarCompra() {
    setEnviandoCompra(true);
    setErrorCompra('');
    try {
      // Crea la fila "Iniciada" (descuenta stock ya) y recién ahí muestra el Brick de pago.
      const compraIniciada = await comprarProducto(detalle.id, socio.id, cantidad);
      setCompraEnCurso(compraIniciada);
      setVistaInterna('pago');
    } catch (e) {
      setErrorCompra(e.message);
    } finally {
      setEnviandoCompra(false);
    }
  }

  function abrirMisCompras() {
    setVistaInterna('mis-compras');
    if (misCompras !== null) return;
    setCargandoMisCompras(true);
    setErrorMisCompras(false);
    getComprasPorSocio(socio.id)
      .then(setMisCompras)
      .catch(() => setErrorMisCompras(true))
      .finally(() => setCargandoMisCompras(false));
  }

  // ─── Pago ───
  if (vistaInterna === 'pago' && compraEnCurso) {
    return (
      <PagoCuotaFlow
        item={{
          id: compraEnCurso.id,
          monto: compraEnCurso.monto,
          concepto: compraEnCurso.producto.nombre,
        }}
        tipoItem="compra"
        socio={socio}
      />
    );
  }

  // ─── Mis compras ───
  if (vistaInterna === 'mis-compras') {
    return (
      <ScreenTransition screenKey={vistaInterna} direction={direccion}>
      <div className="tienda-page">
        <h2 className="tienda-detalle-nombre" style={{ padding: 0, marginBottom: 'var(--space-4)' }}>Mis compras</h2>

        {cargandoMisCompras && <SkeletonRows n={3} altura={76} />}

        {!cargandoMisCompras && errorMisCompras && (
          <p className="tienda-error">No se pudieron cargar tus compras.</p>
        )}

        {!cargandoMisCompras && !errorMisCompras && (misCompras ?? []).length === 0 && (
          <p className="tienda-empty">Todavía no tenés compras.</p>
        )}

        {!cargandoMisCompras && !errorMisCompras && (misCompras ?? []).length > 0 && (
          <div className="compra-lista">
            {misCompras.map((compra) => (
              <div className="compra-card" key={compra.id}>
                {compra.producto.imagen_url ? (
                  <img src={compra.producto.imagen_url} alt={compra.producto.nombre} className="compra-card-img" />
                ) : (
                  <div className="compra-card-img-placeholder"><Package size={24} /></div>
                )}
                <div className="compra-card-info">
                  <span className="compra-card-nombre">{compra.producto.nombre}</span>
                  <span className="compra-card-cantidad">Cantidad: {compra.cantidad}</span>
                  <span className="compra-card-precio">{formatearPrecio(compra.monto)}</span>
                  <span className="compra-card-id">Compra #{compra.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </ScreenTransition>
    );
  }

  // ─── Detalle ───
  if (vistaInterna === 'detalle' && detalle) {
    const sinStock = Number(detalle.stock) <= 0;
    return (
      <ScreenTransition screenKey={vistaInterna} direction={direccion}>
      <div className="tienda-page">
        <div className="tienda-detalle-card">
          <div className="tienda-detalle-media">
            <div className="tienda-detalle-foto-wrap">
              {detalle.imagen_url ? (
                <img src={detalle.imagen_url} alt={detalle.nombre} className="tienda-detalle-img" />
              ) : (
                <div className="tienda-detalle-img-placeholder"><Package size={40} /></div>
              )}
              {sinStock && <span className="tienda-agotado-badge">Agotado</span>}
            </div>
          </div>

          <h2 className="tienda-detalle-nombre">{detalle.nombre}</h2>
          <span className="tienda-detalle-precio">{formatearPrecio(detalle.precio)}</span>
          {!sinStock && (
            <span className="tienda-detalle-stock">{detalle.stock} disponibles</span>
          )}
          {detalle.descripcion && <p className="tienda-detalle-desc">{detalle.descripcion}</p>}

          {errorCompra && (
            <p className="tienda-error" role="alert">{mensajeError(errorCompra)}</p>
          )}

          {!sinStock && (
            <div className="tienda-comprar-bar">
              {comprando && (
                <div className="tienda-cantidad-row">
                  <div className="tienda-cantidad-stepper">
                    <button
                      type="button"
                      className="tienda-cantidad-btn"
                      onClick={restarCantidad}
                      disabled={cantidad <= 1}
                      aria-label="Restar unidad"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="tienda-cantidad-valor">{cantidad}</span>
                    <button
                      type="button"
                      className="tienda-cantidad-btn"
                      onClick={sumarCantidad}
                      disabled={cantidad >= Number(detalle.stock)}
                      aria-label="Sumar unidad"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="tienda-comprar-total" aria-live="polite">
                    Total: {formatearPrecio(Number(detalle.precio) * cantidad)}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="tienda-comprar-btn"
                onClick={comprando ? confirmarCompra : () => setComprando(true)}
                disabled={enviandoCompra}
              >
                {enviandoCompra ? 'Procesando...' : comprando ? 'Confirmar compra' : 'Comprar'}
              </button>
            </div>
          )}
        </div>
      </div>
      </ScreenTransition>
    );
  }

  // ─── Lista ───
  return (
    <ScreenTransition screenKey={vistaInterna} direction={direccion}>
    <div className="tienda-page">
      <PageHeader
        eyebrow="Tienda del club"
        titulo="Explorá nuestros productos"
        stats={[{ label: 'Disponibles', value: loading ? '—' : productos.length }]}
      />

      <button type="button" className="tienda-mis-compras-btn" onClick={abrirMisCompras}>
        <Receipt size={16} /> Mis compras
      </button>

      {loading && <SkeletonRows n={4} altura={140} />}

      {!loading && error && <p className="tienda-error">{error}</p>}

      {!loading && !error && productos.length === 0 && (
        <p className="tienda-empty">No hay productos disponibles por el momento.</p>
      )}

      {!loading && !error && productos.length > 0 && (
        <div className="tienda-grid">
          {productos.map(p => {
            const agotado = Number(p.stock) === 0;
            return (
              <button
                key={p.id}
                type="button"
                className={`tienda-card${agotado ? ' tienda-card--agotado' : ''}`}
                onClick={() => abrirDetalle(p.id)}
              >
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="tienda-card-img" />
                ) : (
                  <div className="tienda-card-img-placeholder"><Package size={24} /></div>
                )}
                <div className="tienda-card-info">
                  <span className="tienda-card-nombre">{p.nombre}</span>
                  <span className="tienda-card-precio">{formatearPrecio(p.precio)}</span>
                  <span className={`tienda-card-stock${agotado ? ' tienda-card-stock--agotado' : ''}`}>
                    {agotado ? 'Agotado' : `${p.stock} disponibles`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {loadingDetalle && <SkeletonRows n={1} altura={220} />}
    </div>
    </ScreenTransition>
  );
}
