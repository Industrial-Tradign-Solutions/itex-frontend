import { animate, style, transition, trigger } from '@angular/animations';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Honour the OS accessibility setting: every duration collapses to 0ms instead
// of shipping a second, motion-free set of triggers.
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ms = (value: number): number => prefersReducedMotion() ? 0 : value;

/** Max delay applied to the row stagger, so a full page never feels laggy. */
const MAX_ROW_DELAY = 200;
const ROW_DELAY_STEP = 20;

export const rowEnterParams = (index: number) => ({
  value: index,
  params: { delay: ms(Math.min(index * ROW_DELAY_STEP, MAX_ROW_DELAY)) }
});

/** Card of the page. Only opacity + transform (composited, no reflow). */
export const cardEnter = trigger('cardEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate(`${ms(240)}ms ${EASE}`, style({ opacity: 1, transform: 'none' }))
  ])
]);

/** Advanced filters block. The only trigger that animates layout (small panel). */
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

/** Table rows. `delay` comes from `rowEnterParams($index)`. */
export const rowEnter = trigger('rowEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(6px)' }),
    animate(`${ms(160)}ms {{delay}}ms ${EASE}`, style({ opacity: 1, transform: 'none' }))
  ], { params: { delay: 0 } })
]);

/** Crossfade used between the loading skeleton and the loaded table. */
export const stateCross = trigger('stateCross', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`${ms(180)}ms ${EASE}`, style({ opacity: 1 }))
  ])
]);
