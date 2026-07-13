// src/components/createForm/MultiStepFormShell.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import logoVerde from '../../assets/logo-verde.png';
import { ModalOverlay } from './ModalOverlay';

const STEP_COLORS = {
  bubbleActive: '#111111',
  bubbleIdle: '#e8e8e8',
  onBubble: '#ffffff',
  idleIcon: '#4a4a4a',
  success: '#0D6E0D',
};

export function MultiStepFormShell({
  steps, step, submitted, isSubmitting, title,
  successTitle, successMessage, submitLabel, submitLoadingLabel,
  onCancel, goBack, goNext, direction, onFormSubmit, children
}) {
  const progress = (step / steps.length) * 100;

  return (
    <ModalOverlay onClose={onCancel}>
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180 }}
            className="csf-outer-card csf-success"
          >
            <motion.div
              className="csf-success-logo-circle"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
            >
              <img src={logoVerde} alt="SocioUnido" className="csf-success-logo" />
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, delay: 0.4 }}
            >
              <CheckCircle2 size={48} color={STEP_COLORS.success} strokeWidth={1.5} />
            </motion.div>
            <div>
              <h2>{successTitle}</h2>
              <p>{successMessage}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="csf-outer-card"
          >
            <div className="csf-header">
              <h1>{title}</h1>
              <p>Paso {step} de {steps.length} — {steps[step - 1]?.label}</p>
            </div>

            <div className="csf-steps">
              {steps.map((s, i) => {
                const done = step > s.id;
                const active = step === s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="csf-step-item">
                    <div className="csf-step-meta">
                      <motion.div
                        className="csf-step-bubble"
                        animate={{ background: done || active ? STEP_COLORS.bubbleActive : STEP_COLORS.bubbleIdle }}
                        transition={{ duration: 0.3 }}
                      >
                        <AnimatePresence mode="wait">
                          {done ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                            >
                              <CheckCircle2 size={16} color={STEP_COLORS.onBubble} strokeWidth={2.5} />
                            </motion.span>
                          ) : (
                            <motion.span key="icon" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                              <Icon size={16} color={active ? STEP_COLORS.onBubble : STEP_COLORS.idleIcon} strokeWidth={2} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <span className={`csf-step-label${active ? ' csf-step-label--active' : ''}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="csf-connector">
                        <motion.div
                          className="csf-connector-fill"
                          animate={{ width: step > s.id ? '100%' : '0%' }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="csf-progress">
              <motion.div
                className="csf-progress-fill"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            <div className="csf-card">
              <form onSubmit={onFormSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && step < steps.length) e.preventDefault(); }}>
                {direction !== undefined ? (
                  <AnimatePresence mode="wait" custom={direction}>
                    {children}
                  </AnimatePresence>
                ) : children}

                <div className={`csf-nav ${step > 1 ? 'csf-nav--between' : 'csf-nav--end'}`}>
                  {step > 1 ? (
                    <motion.button
                      type="button"
                      onClick={goBack}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-back"
                    >
                      <ChevronLeft size={17} />
                      Atrás
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={onCancel}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-back"
                    >
                      Cancelar
                    </motion.button>
                  )}

                  {step < steps.length ? (
                    <motion.button
                      type="button"
                      onClick={goNext}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-next"
                    >
                      Siguiente
                      <ChevronRight size={17} />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className="csf-btn-submit"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.span
                            className="csf-spinner"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          />
                          {submitLoadingLabel}
                        </>
                      ) : (
                        <>
                          {submitLabel}
                          <CheckCircle2 size={17} />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalOverlay>
  );
}
