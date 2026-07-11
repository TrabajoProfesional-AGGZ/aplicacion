import { useState } from 'react';
import { initMercadoPago, Payment, StatusScreen } from '@mercadopago/sdk-react';

// Inicializamos MP
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY_TEST, { locale: 'es-AR' });

export default function FlujoPagoCompleto() {
  // Estados para controlar en qué pantalla estamos y qué estamos pagando
  const [paso, setPaso] = useState('seleccion'); // Valores posibles: 'seleccion', 'pago', 'resultado'
  const [detalleCompra, setDetalleCompra] = useState(null);
  const [idPagoAprobado, setIdPagoAprobado] = useState(null);

  // Función que se ejecuta al elegir un botón
  const manejarSeleccion = (concepto, monto) => {
    setDetalleCompra({ concepto, monto });
    setPaso('pago'); // Avanzamos a la pantalla del Brick
  };

  // Función que se ejecuta cuando el Brick genera el token
  const onSubmitPago = async ({ formData }) => {
    try {
      // Enviamos los datos al backend tal cual lo configuramos antes
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/pagos/procesar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.estado === 'approved') {
        // Guardamos el ID de pago real que nos devolvió FastAPI
        setIdPagoAprobado(data.id_pago);
        setPaso('resultado'); // Avanzamos a la pantalla verde de éxito
      } else {
        alert(`El pago no se aprobó. Estado: ${data.estado || 'Rechazado'}`);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("Hubo un problema de conexión con el servidor del club.");
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* =========================================
          PASO 1: SELECCIÓN DE PRODUCTO/SERVICIO 
          ========================================= */}
      {paso === 'seleccion' && (
        <div style={{ textAlign: 'center' }}>
          <h2>¿Qué deseás abonar hoy? ⚽</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Elegí una opción para continuar</p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => manejarSeleccion('Cuota Mensual', 100)}
              style={estilos.botonSeleccion}
            >
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Cuota Mensual</h3>
              <span style={{ fontSize: '1.5rem', color: '#009ee3' }}>$100</span>
            </button>

            <button
              onClick={() => manejarSeleccion('Alquiler de Cancha', 25)}
              style={estilos.botonSeleccion}
            >
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Alquiler Cancha</h3>
              <span style={{ fontSize: '1.5rem', color: '#009ee3' }}>$25</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================
          PASO 2: FORMULARIO DE PAGO (PAYMENT BRICK)
          ========================================= */}
      {paso === 'pago' && (
        <div>
          <button 
            onClick={() => setPaso('seleccion')} 
            style={estilos.botonVolver}
          >
            ← Volver a opciones
          </button>
          
          <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Abonando: {detalleCompra.concepto}
          </h3>

          <Payment
            initialization={{ 
              amount: detalleCompra.monto // ¡Acá le inyectamos el precio dinámicamente!
            }}
            customization={{ 
              paymentMethods: { creditCard: 'all', debitCard: 'all' } 
            }}
            onSubmit={onSubmitPago}
          />
        </div>
      )}

      {/* =========================================
          PASO 3: PANTALLA DE ÉXITO (STATUS BRICK)
          ========================================= */}
      {paso === 'resultado' && (
        <div>
          {/* Este Brick agarra el ID y dibuja el comprobante solo */}
          <StatusScreen
            initialization={{ paymentId: idPagoAprobado }}
            onReady={() => console.log('Pantalla de estado cargada')}
            onError={(error) => console.error("Error en StatusScreen:", error)}
          />
          
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={() => setPaso('seleccion')} 
              style={estilos.botonFinalizar}
            >
              Realizar otro trámite
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Unos estilos rápidos en JS para que se vea lindo sin necesidad de CSS externo por ahora
const estilos = {
  botonSeleccion: {
    padding: '2rem 1rem',
    cursor: 'pointer',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    backgroundColor: '#ffffff',
    width: '200px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  botonVolver: {
    background: 'none',
    border: 'none',
    color: '#009ee3',
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
  botonFinalizar: {
    padding: '0.8rem 2rem',
    fontSize: '1.1rem',
    cursor: 'pointer',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#009ee3',
    color: 'white',
    fontWeight: 'bold',
  }
};