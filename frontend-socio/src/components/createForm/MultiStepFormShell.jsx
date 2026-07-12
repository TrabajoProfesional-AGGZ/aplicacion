// src/components/createForm/MultiStepFormShell.jsx

export function MultiStepFormShell({
  steps, step, submitted, isSubmitting, title,
  successTitle, successMessage, submitLabel, submitLoadingLabel,
  onCancel, goBack, goNext, onFormSubmit, children
}) {
  
  // Si el formulario ya se envió con éxito, mostramos la pantalla verde
  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', margin: '2rem auto', border: '1px solid #ddd', borderRadius: '12px' }}>
        <h2 style={{ color: '#4caf50', fontSize: '2rem', marginBottom: '1rem' }}>✅ {successTitle}</h2>
        <p style={{ color: '#666' }}>{successMessage}</p>
      </div>
    );
  }

  const isLastStep = step === steps.length;

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center', color: '#009ee3', marginBottom: '0.5rem' }}>{title}</h2>
      
      {/* Indicador de progreso de Pasos */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: '#888', fontWeight: 'bold' }}>
        Paso {step} de {steps.length}: <span style={{ color: '#333' }}>{steps[step - 1]?.label}</span>
      </div>

      <form onSubmit={onFormSubmit}>
        
        {/* Acá se inyectan los <FormStep> desde RegistroSocioForm */}
        {children}

        {/* Botonera de Navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          {step > 1 ? (
            <button type="button" onClick={goBack} style={estilos.botonSecundario}>
              ← Atrás
            </button>
          ) : (
            <button type="button" onClick={onCancel} style={estilos.botonCancelar}>
              Cancelar
            </button>
          )}

          {!isLastStep ? (
            <button type="button" onClick={goNext} style={estilos.botonPrimario}>
              Siguiente →
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} style={estilos.botonPrimario}>
              {isSubmitting ? submitLoadingLabel : submitLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const estilos = {
  botonPrimario: { 
    padding: '0.8rem 1.5rem', backgroundColor: '#009ee3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
  },
  botonSecundario: { 
    padding: '0.8rem 1.5rem', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
  },
  botonCancelar: { 
    padding: '0.8rem 1.5rem', backgroundColor: 'transparent', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
  }
};