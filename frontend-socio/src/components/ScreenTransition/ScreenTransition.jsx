import { motion, AnimatePresence } from 'framer-motion';
import { SPRING, slideVariants } from '../../styles/motion';

const fadeVariants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};

/**
 * Transición entre pantallas. `direction`: 1 = entra más profundo (desde la
 * derecha), -1 = vuelve (desde la izquierda), 0 = cambio entre hermanos
 * (tabs: solo fade). `screenKey` identifica la pantalla actual.
 */
export function ScreenTransition({ screenKey, direction = 0, children }) {
  const variants = direction === 0 ? fadeVariants : slideVariants;
  return (
    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
      <motion.div
        key={screenKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={SPRING.default}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
