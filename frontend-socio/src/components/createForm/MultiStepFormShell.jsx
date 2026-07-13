// src/components/createForm/MultiStepFormShell.jsx
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import logoVerde from '../../assets/logo-verde.png';
import { ModalOverlay } from './ModalOverlay';

export function MultiStepFormShell({
  steps, step, submitted, isSubmitting, title,
  successTitle, successMessage, submitLabel, submitLoadingLabel,
  onCancel, goBack, goNext, onFormSubmit, children
}) {
  // Si el formulario ya se envió con éxito, mostramos la pantalla de éxito
  if (submitted) {
    return (
      <ModalOverlay onClose={onCancel}>
        <div className="csf-outer-card csf-success">
          <div className="csf-success-logo-circle">
            <img src={logoVerde} alt="SocioUnido" className="csf-success-logo" />
          </div>
          <CheckCircle2 size={48} color="#0D6E0D" strokeWidth={1.5} />
          <div>
            <h2>{successTitle}</h2>
            <p>{successMessage}</p>
          </div>
        </div>
      </ModalOverlay>
    );
  }

  const isLastStep = step === steps.length;
  const progress = (step / steps.length) * 100;

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <h1>{title}</h1>
          <p>Paso {step} de {steps.length} — {steps[step - 1]?.label}</p>
        </div>

        <div className="csf-progress">
          <div className="csf-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="csf-card">
          <form onSubmit={onFormSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && step < steps.length) e.preventDefault(); }}>
            {children}

            <div className={`csf-nav ${step > 1 ? 'csf-nav--between' : 'csf-nav--end'}`}>
              {step > 1 ? (
                <button type="button" onClick={goBack} className="csf-btn-back">
                  <ChevronLeft size={17} />
                  Atrás
                </button>
              ) : (
                <button type="button" onClick={onCancel} className="csf-btn-back">
                  Cancelar
                </button>
              )}

              {!isLastStep ? (
                <button type="button" onClick={goNext} className="csf-btn-next">
                  Siguiente
                  <ChevronRight size={17} />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="csf-btn-submit">
                  {isSubmitting ? (
                    <>
                      <span className="csf-spinner" />
                      {submitLoadingLabel}
                    </>
                  ) : (
                    <>
                      {submitLabel}
                      <CheckCircle2 size={17} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ModalOverlay>
  );
}
