/* Briatti analytics and consent.
 *
 * This is a small first-party client for PostHog's public capture endpoint, not posthog-js. That is
 * deliberate:
 *   - the site loads no third-party JavaScript at all (a hard constraint in PRODUCT.md);
 *   - the marketing pages need events, not session replay, autocapture or the toolbar;
 *   - the A/B assignment already happens locally in ab.js, before paint, which posthog-js feature
 *     flags cannot do without a server bootstrap.
 * The page makes one request to eu.i.posthog.com/i/v0/e/ per event, and only after consent.
 *
 * Events are anonymous in PostHog's sense: no identify(), no person profiles ($process_person_profile:
 * false), no IP
 * recording (PostHog project setting), and never the contents of the form.
 */
(function (window, document) {
  'use strict';

  var A = window.BRIATTI_ANALYTICS || {};
  var AB = window.BriattiAB;
  var INGEST_HOST = (A.ingestHost || 'https://eu.i.posthog.com').replace(/\/+$/, '');
  var KEY = A.posthogKey || '';
  var CONSENT_VERSION = A.consentVersion || 1;
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function queryParam(name) {
    try {
      return new window.URLSearchParams(window.location.search).get(name);
    } catch (e) {
      var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
    }
  }

  var DEBUG = A.debug === true || queryParam('ab_debug') === '1';
  var CONFIGURED = /^phc_[A-Za-z0-9_-]{8,}$/.test(KEY) && KEY.indexOf('REPLACE') === -1;
  var SHOULD_OFFER = CONFIGURED || DEBUG;
  var started = false;
  var funnelBound = false;
  var sid = '';
  var sent = {};
  var formStartedAt = 0;
  var lastTrigger = null;
  var banner = null;

  function log() {
    if (!DEBUG || !window.console || !window.console.debug) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[briatti analytics]');
    window.console.debug.apply(window.console, args);
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var bytes = new Uint8Array(16);
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = [];
    for (var j = 0; j < 16; j++) hex.push((bytes[j] + 0x100).toString(16).slice(1));
    return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' + hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10).join('');
  }

  function consentIsGranted() {
    return !!(AB && !AB.isBlocked() && AB.getConsent() === 'granted');
  }

  function getSid() {
    if (sid) return sid;
    try {
      var stored = window.sessionStorage.getItem('briatti_sid');
      if (stored && UUID_RE.test(stored)) {
        sid = stored;
        return sid;
      }
    } catch (e) {}
    sid = uuid();
    try { window.sessionStorage.setItem('briatti_sid', sid); } catch (e) {}
    return sid;
  }

  function superProps() {
    var props = {};
    var assignments = AB ? AB.getAssignments() : {};
    Object.keys(assignments).forEach(function (key) {
      props['ab_' + key] = assignments[key];
    });
    props.ab_preview = AB ? AB.isPreview() : false;
    props.ab_config_version = AB ? AB.version : '';
    props.$process_person_profile = false;
    return props;
  }

  function pageProps() {
    var props = {
      $title: document.title,
      $current_url: window.location.href,
      $pathname: window.location.pathname,
      $host: window.location.host,
      $session_id: getSid(),
      site_host: window.location.hostname
    };
    if (document.referrer) {
      props.$referrer = document.referrer;
      try { props.$referring_domain = new window.URL(document.referrer).hostname; } catch (e) {}
    }
    props.$viewport_width = window.innerWidth || 0;
    props.$viewport_height = window.innerHeight || 0;
    if (window.screen) {
      props.$screen_width = window.screen.width || 0;
      props.$screen_height = window.screen.height || 0;
    }
    return props;
  }

  function send(event, props) {
    if (!AB) return;
    if (!consentIsGranted()) return;
    if (!started) return;

    var properties = {};
    var base = superProps();
    Object.keys(base).forEach(function (key) { properties[key] = base[key]; });
    var page = pageProps();
    Object.keys(page).forEach(function (key) { properties[key] = page[key]; });
    if (props) Object.keys(props).forEach(function (key) { properties[key] = props[key]; });
    properties.$insert_id = uuid();
    properties.$lib = 'briatti-web';
    properties.$lib_version = '1.0.0';

    var payload = {
      api_key: KEY,
      event: event,
      distinct_id: AB.getVid(),
      timestamp: new Date().toISOString(),
      properties: properties
    };

    if (!window.__briattiEvents) window.__briattiEvents = [];
    if (window.__briattiEvents.length < 200) {
      window.__briattiEvents.push({ event: event, at: payload.timestamp, properties: properties });
    }

    if (!CONFIGURED) {
      log('would send (no token configured)', event, properties);
      return;
    }
    if (!window.fetch) return;

    log('send', event, properties);
    try {
      window.fetch(INGEST_HOST + '/i/v0/e/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        keepalive: true,
        mode: 'cors'
      })['catch'](function () {
        log('send failed', event);
      });
    } catch (e) {
      log('send threw', event, e);
    }
  }

  function sendOnce(event, props) {
    if (sent[event]) return;
    sent[event] = true;
    send(event, props);
  }

  function ctaLocation(el) {
    if (!el || !el.closest) return 'other';
    if (el.classList && el.classList.contains('ab-sticky-cta')) return 'sticky-mobile';
    if (el.closest('nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('#pilot')) return 'pilot';
    if (el.closest('#ladder')) return 'ladder';
    if (el.closest('#contact')) return 'contact';
    return 'other';
  }

  function bindFunnel() {
    if (funnelBound) return;
    funnelBound = true;

    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!link) return;
      var url;
      try { url = new window.URL(link.href, window.location.href); } catch (e) { return; }

      if (url.hash === '#contact') {
        send('form_cta_click', {
          cta_location: ctaLocation(link),
          cta_label: (link.textContent || '').trim().slice(0, 80),
          cta_href: link.getAttribute('href') || ''
        });
        return;
      }
      if (url.protocol === 'mailto:') {
        send('email_click', {
          cta_location: ctaLocation(link),
          cta_label: link.getAttribute('href') || ''
        });
        return;
      }
      if (url.pathname.indexOf('demo.html') !== -1 && window.location.pathname.indexOf('demo.html') === -1) {
        send('demo_open', { cta_location: ctaLocation(link) });
      }
    }, true);

    var form = document.querySelector('.contact-form');
    if (!form) return;

    function formStart(source) {
      if (formStartedAt) return;
      formStartedAt = Date.now();
      sendOnce('form_start', { form_id: 'contact', first_field: source || 'unknown' });
    }

    form.addEventListener('focusin', function (event) {
      var field = event.target;
      formStart(field && (field.name || field.id) ? (field.name || field.id) : 'field');
    }, true);
    form.addEventListener('input', function () { formStart('input'); }, true);

    form.addEventListener('submit', function () {
      if (form.elements._honey && form.elements._honey.value) return;
      sendOnce('form_submit', {
        form_id: 'contact',
        ms_since_start: formStartedAt ? Date.now() - formStartedAt : null
      });
    }, true);

    if ('IntersectionObserver' in window) {
      var observer = new window.IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        sendOnce('form_view', { form_id: 'contact' });
      }, { threshold: 0.35 });
      observer.observe(form);
    } else {
      sendOnce('form_view', { form_id: 'contact' });
    }

    document.addEventListener('briatti:form-success', function () {
      send('form_submit_success', {
        form_id: 'contact',
        ms_since_start: formStartedAt ? Date.now() - formStartedAt : null
      });
    });
    document.addEventListener('briatti:form-error', function () {
      send('form_submit_error', { form_id: 'contact' });
    });
    document.addEventListener('briatti:form-expand', function () {
      send('form_optional_revealed', { form_id: 'contact' });
    });
  }

  function start() {
    if (started) return;
    if (!CONFIGURED && !DEBUG) {
      log('not starting: no PostHog project token configured');
      return;
    }
    if (!consentIsGranted()) return;
    started = true;
    getSid();
    send('$pageview', { $pageview_source: 'first-party' });
    send('consent_granted', { consent_version: CONSENT_VERSION });
    var active = AB ? AB.getActive() : [];
    active.forEach(function (item) {
      send('experiment_exposed', {
        experiment: item.key,
        experiment_name: item.name,
        variant: item.variant
      });
    });
    bindFunnel();
    log('started', active);
  }

  function stop() {
    started = false;
    try { window.sessionStorage.removeItem('briatti_sid'); } catch (e) {}
    sid = '';
    log('stopped');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function hideBanner() {
    if (!banner) return;
    var node = banner;
    banner = null;
    node.classList.add('is-leaving');
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 240);
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    lastTrigger = null;
  }

  function buildBanner() {
    if (!SHOULD_OFFER || !AB) return;
    if (banner) return;
    var state = AB.isBlocked() ? 'blocked' : AB.getConsent();
    var node = el('div', 'ph-consent');
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-labelledby', 'ph-consent-title');
    node.setAttribute('aria-describedby', 'ph-consent-body');

    var head = el('div', 'ph-consent-head');
    var kicker = el('p', 'ph-consent-kicker', 'Privacy');
    var title = el('h2', 'ph-consent-title', state === 'granted' ? 'Analytics is on' : state === 'denied' || state === 'blocked' ? 'Analytics is off' : 'A little measurement, if you allow it');
    title.id = 'ph-consent-title';
    head.appendChild(kicker);
    head.appendChild(title);
    node.appendChild(head);

    var body = el('div', 'ph-consent-body');
    body.id = 'ph-consent-body';
    if (state === 'granted') {
      body.appendChild(el('p', '', 'You allowed pseudonymous analytics. It tells us which buttons and messages lead to enquiries, and it runs the A/B tests on this page. No ads, no session recording, and never what you type in the form.'));
      body.appendChild(el('p', '', 'You can turn it off here at any time.'));
    } else if (state === 'blocked') {
      body.appendChild(el('p', '', 'Your browser sends a Global Privacy Control or Do Not Track signal, so this site does not measure your visit. A/B tests still render, but nothing about you is recorded.'));
    } else if (state === 'denied') {
      body.appendChild(el('p', '', 'Analytics is off. Nothing about your visit is recorded and no analytics request is made.'));
      body.appendChild(el('p', '', 'If you change your mind, you can turn it on here.'));
    } else {
      body.appendChild(el('p', '', 'We would like to use PostHog to see which buttons and messages lead to enquiries, and to run A/B tests on this page. It stores a random ID in your browser and records the page, the variant you saw, clicks on calls to action, and form starts and submissions. It never records what you type in the form.'));
      body.appendChild(el('p', '', 'No ads, no session recording, no selling data. Nothing is sent until you choose.'));
    }
    node.appendChild(body);

    var actions = el('div', 'ph-consent-actions');
    if (state === 'blocked') {
      var closeBlocked = el('button', 'ph-consent-btn ph-consent-btn-primary', 'Close');
      closeBlocked.type = 'button';
      closeBlocked.addEventListener('click', hideBanner);
      actions.appendChild(closeBlocked);
    } else if (state === 'granted') {
      var keep = el('button', 'ph-consent-btn ph-consent-btn-primary', 'Keep it on');
      keep.type = 'button';
      keep.addEventListener('click', hideBanner);
      var off = el('button', 'ph-consent-btn', 'Turn it off');
      off.type = 'button';
      off.addEventListener('click', function () {
        AB.setConsent('denied', 'banner');
        stop();
        hideBanner();
      });
      actions.appendChild(keep);
      actions.appendChild(off);
    } else {
      var allow = el('button', 'ph-consent-btn ph-consent-btn-primary', state === 'denied' ? 'Turn analytics on' : 'Allow analytics');
      allow.type = 'button';
      allow.addEventListener('click', function () {
        var choice = AB.setConsent('granted', 'banner');
        hideBanner();
        if (choice === 'granted') {
          start();
        } else {
          buildBanner();
        }
      });
      var deny = el('button', 'ph-consent-btn', state === 'denied' ? 'Keep it off' : 'No thanks');
      deny.type = 'button';
      deny.addEventListener('click', function () {
        AB.setConsent('denied', 'banner');
        stop();
        hideBanner();
      });
      actions.appendChild(allow);
      actions.appendChild(deny);
    }
    node.appendChild(actions);

    var footnote = el('p', 'ph-consent-note');
    var notice = el('a', '', 'Read the notice');
    notice.href = 'legal.html#analytics';
    footnote.appendChild(notice);
    footnote.appendChild(document.createTextNode(' You can change your choice under Privacy settings in the footer.'));
    node.appendChild(footnote);

    // First in the body so a keyboard user reaches it before the page's links, while the card
    // itself stays fixed to the corner.
    document.body.insertBefore(node, document.body.firstChild);
    banner = node;
    window.requestAnimationFrame(function () {
      node.classList.add('is-visible');
      if (lastTrigger) {
        var first = node.querySelector('.ph-consent-btn-primary');
        if (first) first.focus();
      }
    });
  }

  function openBanner() {
    if (!SHOULD_OFFER || !AB) return;
    buildBanner();
  }

  function injectPrivacySettings() {
    if (!SHOULD_OFFER) return;
    if (document.querySelector('[data-consent-open]')) return;
    var footer = document.querySelector('footer');
    var host = null;
    if (footer) host = footer.querySelector('.foot-links') || footer.querySelector('.container') || footer;
    if (!host) host = document.querySelector('.sb-footer');
    if (!host) return;
    var button = el('button', 'privacy-settings', 'Privacy settings');
    button.type = 'button';
    button.setAttribute('data-consent-open', '');
    host.appendChild(button);
  }

  function init() {
    if (!AB) return;
    if (DEBUG) {
      var forced = queryParam('consent');
      if (forced === 'granted' || forced === 'denied') {
        AB.setConsent(forced, 'debug');
      }
    }
    injectPrivacySettings();
    document.addEventListener('click', function (event) {
      var opener = event.target && event.target.closest ? event.target.closest('[data-consent-open]') : null;
      if (!opener) return;
      event.preventDefault();
      lastTrigger = opener;
      buildBanner();
    });
    document.addEventListener('briatti:consent', function (event) {
      if (!event.detail) return;
      if (event.detail.choice === 'granted') start();
      if (event.detail.choice === 'denied') stop();
    });
    if (consentIsGranted()) {
      start();
    } else if (SHOULD_OFFER && AB.getConsent() === null && !AB.isBlocked()) {
      window.setTimeout(function () {
        if (AB.getConsent() === null && !banner) buildBanner();
      }, 600);
    }
    window.addEventListener('pagehide', function () {
      if (started) send('$pageleave', { $pageleave_source: 'pagehide' });
    });
    log('init', { configured: CONFIGURED, consent: AB.getConsent(), blocked: AB.isBlocked(), active: AB.getActive() });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
