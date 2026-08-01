import { animate, style, transition, trigger } from '@angular/animations';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Honour the OS accessibility setting: every duration collapses to 0ms instead
// of shipping a second, motion-free set of triggers.
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ms = (value: number): number => prefersReducedMotion() ? 0 : value;

/**
 * Advanced filters block. The rest of the module uses the same animate.css
 * classes as the IP modules (`animate__animated animate__fadeIn`); this trigger
 * only exists because the block collapses in height, which CSS classes can not
 * do on their own.
 */
export const filtersPanel = trigger('filtersPanel', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate(`${ms(200)}ms ${EASE}`, style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [
    style({ height: '*', opacity: 1, overflow: 'hidden' }),
    animate(`${ms(160)}ms ${EASE}`, style({ height: 0, opacity: 0 }))
  ])
]);
