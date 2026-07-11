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
    // Acá es donde el Brick hace la magia de tokenizar la tarjeta de forma segura.
    // El 'formData' ya viene con el token listo para que se lo mandes a tu backend.
    console.log("💳 Tipo de pago seleccionado:", selectedPaymentMethod);
    console.log("📦 Datos para enviar a tu backend:", formData);
    
    // Simulamos una carga para que el botón muestre el spinner
    return new Promise((resolve) => {
      setTimeout(() => {
        alert("¡Token generado con éxito! Revisá la consola del navegador.");
        resolve();
      }, 2000);
    });
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