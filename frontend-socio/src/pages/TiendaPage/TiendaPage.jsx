import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Package, Minus, Plus } from 'lucide-react';
import { getProductosDisponibles, getProducto } from '../../services/tiendaService';
import { useBackToRoot } from '../../hooks/useBackToRoot';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import { ProximamenteOverlay } from '../../components/ProximamenteOverlay/ProximamenteOverlay';
import './TiendaPage.css';

function formatearPrecio(monto) {
  return `$${Number(monto).toLocaleString('es-AR')}`;
}

export function TiendaPage() {
  const [productos, setProductos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);
  const [comprando, setComprando] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [mostrarProximamente, setMostrarProximamente] = useState(false);

  function volverALista() {
    setDetalle(null);
    setError(null);
    setComprando(false);
    setCantidad(1);
  }

  useBackToRoot(detalle, null, volverALista);

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
      setDetalle(await getProducto(id));
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

  function confirmarCompra() {
    // Placeholder: aún no existe lógica de compra/descuento de stock en el backend (ver ms-club/CLAUDE.md).
    setMostrarProximamente(true);
  }

  if (loading) return <LoadingScreen />;

  // ─── Detalle ───
  if (detalle) {
    const sinStock = Number(detalle.stock) <= 0;
    return (
      <div className="tienda-page">
        <button type="button" className="tienda-volver" onClick={volverALista}>
          <ArrowLeft size={20} /> Volver
        </button>

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
              >
                {comprando ? 'Confirmar compra' : 'Comprar'}
              </button>
            </div>
          )}
        </div>

        {mostrarProximamente && (
          <ProximamenteOverlay titulo="Confirmar compra" onClose={() => setMostrarProximamente(false)} />
        )}
      </div>
    );
  }

  // ─── Lista ───
  return (
    <div className="tienda-page">
      <div className="tienda-banner">
        <div className="tienda-banner-texture" />
        <div className="tienda-banner-top">
          <span className="tienda-banner-eyebrow"><ShoppingBag size={14} /> TIENDA DEL CLUB</span>
        </div>
        <h2 className="tienda-banner-title">Explorá nuestros productos</h2>
        <div className="tienda-banner-stats">
          <div className="tienda-banner-stat">
            <span className="tienda-banner-stat-value">{productos.length}</span>
            <span className="tienda-banner-stat-label">Disponibles</span>
          </div>
        </div>
      </div>

      {error && <p className="tienda-error">{error}</p>}

      {productos.length === 0 ? (
        <p className="tienda-empty">No hay productos disponibles por el momento.</p>
      ) : (
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

      {loadingDetalle && <p className="tienda-empty">Cargando...</p>}
    </div>
  );
}
