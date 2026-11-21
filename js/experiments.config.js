/* Experiment definitions for briatti.com.
 *
 * The engine (js/ab.js) reads this file before the body is parsed, so variant CSS classes are on
 * <html> before the first paint. Copy lives here; structural or visual changes live in
 * css/experiments.css keyed by html[data-ab-<key>="<variant>"].
 *
 * House rules (the long version is in AB-TESTING.md):
 *   - One hypothesis, one change per experiment.
 *   - Never edit a live experiment's key, variants or weights. Launch a new key instead, or every
 *     visitor is silently reassigned and the data is split across two different tests.
 *   - Only run experiments whose copy still makes a truthful claim. "Free pilot" is a real offer
 *     on this site; do not test invented scarcity or discounts.
 *   - Experiments only run when a valid PostHog token is configured (requireAnalytics). A split
 *     test that nobody measures is just a random change to the page.
 */
window.BRIATTI_AB_CONFIG = {
  version: '2026-11-18',
  requireAnalytics: true,
  /* Copy keys above the fold. While these are being swapped the elements are kept invisible for
     at most 1.2s, so a visitor cannot see the control label change under the pointer. */
  eagerCopy: ['hero.cta'],
  experiments: [
    {
      key: 'hero_cta_copy',
      name: 'Hero CTA: name the free pilot',
      status: 'live',
      pages: ['index'],
      traffic: 100,
      hypothesis:
        'The hero button currently says what the visitor does ("Request a callback"). Naming the ' +
        'zero-risk offer should remove the fear of a sales call and increase clicks into the form.',
      primaryMetric: 'form_cta_click',
      primaryFilter: { cta_location: 'hero' },
      guardrail: 'form_submit_success',
      variants: {
        control: { weight: 50, copy: { 'hero.cta': 'Request a callback' } },
        pilot: { weight: 50, copy: { 'hero.cta': 'Get a free pilot build' } }
      }
    },
    {
      key: 'form_button_copy',
      name: 'Form button: promise a reply window',
      status: 'live',
      pages: ['index'],
      traffic: 100,
      hypothesis:
        'A visitor who has filled the form still hesitates over what pressing the button commits ' +
        'them to. Stating the reply window should increase completed submissions.',
      primaryMetric: 'form_submit_success',
      guardrail: 'form_cta_click',
      variants: {
        control: { weight: 50, copy: { 'form.submit': 'Request a callback' } },
        reply: { weight: 50, copy: { 'form.submit': 'Send — reply within a day' } }
      }
    },
    {
      key: 'form_friction',
      name: 'Contact form: hide the optional fields',
      status: 'live',
      pages: ['index'],
      traffic: 100,
      hypothesis:
        'Company and phone are optional but still read as work. Hiding them behind one disclosure ' +
        'should increase starts and submissions without losing the people who want to add them.',
      primaryMetric: 'form_start',
      guardrail: 'form_submit_success',
      variants: {
        control: { weight: 50 },
        lean: { weight: 50 }
      }
    },
    {
      key: 'pilot_cta_copy',
      name: 'Pilot band CTA: start instead of claim',
      status: 'draft',
      pages: ['index'],
      traffic: 100,
      hypothesis:
        '"Claim" asks for a transaction; "start" describes a first step. The softer verb should ' +
        'lift clicks on the zero-risk pilot band.',
      primaryMetric: 'form_cta_click',
      primaryFilter: { cta_location: 'pilot' },
      guardrail: 'form_submit_success',
      variants: {
        control: { weight: 50, copy: { 'pilot.cta': 'Claim the free pilot' } },
        start: { weight: 50, copy: { 'pilot.cta': 'Start with a free pilot build' } }
      }
    },
    {
      key: 'sticky_mobile_cta',
      name: 'Mobile: persistent CTA after the hero',
      status: 'draft',
      device: 'mobile',
      pages: ['index'],
      traffic: 100,
      hypothesis:
        'On a phone the only route to the form is a scroll back to the nav or the pilot band. A ' +
        'quiet bottom bar after the hero should recover that click without covering the form.',
      primaryMetric: 'form_cta_click',
      primaryFilter: { cta_location: 'sticky-mobile' },
      guardrail: 'form_submit_success',
      variants: {
        control: { weight: 50 },
        bar: {
          weight: 50,
          sticky: {
            label: 'Get a free pilot build',
            href: '#contact',
            after: 700
          }
        }
      }
    }
  ]
};
