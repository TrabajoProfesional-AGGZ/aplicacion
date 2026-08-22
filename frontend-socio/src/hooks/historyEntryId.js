let counter = 0;

/**
 * Fuente de ids únicos y crecientes para cada entrada de historial pusheada
 * por `useBackToRoot`/`useModalHistory`. Al compartir un solo contador entre
 * ambos hooks (en vez de que cada uno lleve el suyo), un `popstate` puede
 * saber si una entrada se pusheó antes o después de la propia comparando
 * ids — dos contadores independientes arrancando en 0 no se podrían
 * comparar para determinar el orden.
 */
export function nextHistoryEntryId() {
  return counter++;
}
