/* PostHog project settings.
 *
 * The project token is a public, write-only ingestion key. It is not a secret, but it must be
 * the token of *your* project: paste it below and the consent banner starts appearing on the
 * next deploy. While the placeholder is in place the site intentionally sends nothing.
 *
 * EU Cloud is the default here: events go to eu.i.posthog.com and the project data is hosted in
 * the EU (Frankfurt). If the project was created in the US region, change both hosts to
 * https://us.i.posthog.com and https://us.posthog.com, and update the region in legal.html.
 *
 * Setup checklist (also in AB-TESTING.md):
 *   1. Paste the phc_... token.
 *   2. In PostHog: Project settings -> "Discard client IP data" = on.
 *   3. Project settings -> data retention = 12 months.
 *   4. Create the dashboard/funnel from the queries in AB-TESTING.md.
 */
window.BRIATTI_ANALYTICS = {
  posthogKey: 'phc_REPLACE_WITH_EU_PROJECT_TOKEN',
  ingestHost: 'https://eu.i.posthog.com',
  appHost: 'https://eu.posthog.com',
  region: 'EU',
  consentVersion: 1,
  debug: false
};
