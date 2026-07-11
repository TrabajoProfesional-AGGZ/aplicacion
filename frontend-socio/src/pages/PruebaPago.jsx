import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializamos el SDK con la variable de entorno que configuramos antes en Vite
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY_TEST, { locale: 'es-AR' });

export default function PruebaPago() {
  
  // 1. Configuramos el monto de prueba a cobrar
  const initialization = {
    amount: 100, // $100 pesos de prueba
  };

  // 2. Personalizamos qué medios de pago queremos mostrar en el Brick
  const customization = {
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
    },
  };

  // 3. Esta función se ejecuta cuando el usuario le da al botón "Pagar"
  const onSubmit = async ({ selectedPaymentMethod, formData }) => {
    console.log("💳 Tipo de pago seleccionado:", selectedPaymentMethod);
    console.log("Enviando token al backend para procesar cobro...");

    try {
      // Hacemos el POST a tu API de FastAPI/KrakenD
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/pagos/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` <-- Si tu endpoint requiere login, va acá
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Evaluamos la respuesta de tu backend
      if (response.ok && data.estado === 'approved') {
        alert(`¡Pago exitoso! ID de operación: ${data.id_pago}`);
        // TODO: Redirigir al usuario a una pantalla verde de "Éxito"
      } else {
        alert(`El pago no se pudo aprobar. Estado: ${data.estado || 'Error'}`);
      }
      
    } catch (error) {
      console.error("Error de conexión con el backend:", error);
      alert("Hubo un problema al intentar contactar al servidor del club.");
    }
  };

  const onError = async (error) => {
    console.error("❌ Error en el Brick:", error);
  };

  const onReady = async () => {
    console.log("✅ El Brick de Mercado Pago se renderizó correctamente.");
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2>Prueba de Mercado Pago 💸</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Esta es una vista temporal para probar que el Brick carga correctamente y tokeniza tarjetas.
      </p>

      {/* Renderizamos el componente mágico de Mercado Pago */}
      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onReady={onReady}
        onError={onError}
      />
    </div>
  );
}