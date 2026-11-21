/* Briatti A/B engine.
 *
 * Loaded synchronously in <head>, after js/experiments.config.js and js/analytics.config.js and
 * before the body is parsed. It:
 *   1. gives every visitor a stable random id (persistent only after analytics consent, otherwise
 *      in memory for this page view);
 *   2. bucks them into each eligible experiment with a hash, so assignment is stable across pages
 *      and reloads without a server;
 *   3. writes the assignment to <html data-ab-key="variant"> before first paint, which lets the
 *      stylesheet make structural changes without a flash of the control;
 *   4. swaps copy on DOMContentLoaded and records the variant in a hidden form field;
 *   5. offers ?ab=preview, ?ab=off and ?ab=on for QA.
 *
 * It deliberately has no dependency on PostHog. Analytics attaches to it; it never waits for
 * analytics. If the PostHog token is missing and requireAnalytics is on, no experiment runs, so
 * the site cannot split traffic it cannot measure.
 */
(function (window, document) {
  'use strict';

  var CONFIG = window.BRIATTI_AB_CONFIG;
  if (!CONFIG || !CONFIG.experiments || !CONFIG.experiments.length) {
    window.BriattiAB = window.BriattiAB || { ready: true, getConsent: function () { return null; }, getActive: function () { return []; }, getAssignments: function () { return {}; }, isBlocked: function () { return true; }, isPreview: function () { return false; }, getVid: function () { return ''; }, setConsent: function () { return 'denied'; }, refresh: function () {} };
    return;
  }

  var CONSENT_KEY = 'briatti_consent_v1';
  var VISITOR_KEY = 'briatti_vid';
  var OVERRIDE_KEY = 'briatti_ab_override';
  var DISABLED_KEY = 'briatti_ab_disabled';
  var SESSION_KEY = 'briatti_sid';
  var CONSENT_VERSION = 1;
  var EAGER_TIMEOUT = 1200;
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function queryParam(name) {
    try {
      return new window.URLSearchParams(window.location.search).get(name);
    } catch (e) {
      var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
    }
  }

  var MODE = queryParam('ab');
  var DEBUG = queryParam('ab_debug') === '1' || MODE === 'preview';
  var PREVIEW = MODE === 'preview';

  function debugLog() {
    if (!DEBUG || !window.console || !window.console.debug) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[briatti ab]');
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

  function safeGet(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function safeSet(store, key, value) {
    try { store.setItem(key, value); return true; } catch (e) { return false; }
  }
  function safeRemove(store, key) {
    try { store.removeItem(key); } catch (e) {}
  }
  function readJSON(key) {
    var raw = safeGet(window.localStorage, key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function writeJSON(key, value) {
    return safeSet(window.localStorage, key, JSON.stringify(value));
  }

  function isBlocked() {
    var nav = window.navigator || {};
    return nav.globalPrivacyControl === true ||
      nav.doNotTrack === '1' || nav.doNotTrack === 'yes' ||
      window.doNotTrack === '1' || window.doNotTrack === 'yes';
  }

  var memConsent = null;

  function readConsent() {
    if (memConsent) return memConsent;
    var stored = readJSON(CONSENT_KEY);
    if (!stored || stored.v !== CONSENT_VERSION) return null;
    if (stored.choice === 'granted' || stored.choice === 'denied') return stored.choice;
    return null;
  }

  function effectiveConsent() {
    if (isBlocked()) return 'denied';
    return readConsent();
  }

  function analyticsConfigured() {
    var cfg = window.BRIATTI_ANALYTICS || {};
    var key = cfg.posthogKey || '';
    return /^phc_[A-Za-z0-9_-]{8,}$/.test(key) &&
      key.indexOf('REPLACE') === -1 &&
      !!cfg.ingestHost;
  }

  function pageName() {
    var path = window.location.pathname || '/';
    var file = path.substring(path.lastIndexOf('/') + 1);
    if (!file || file === 'index.html') return 'index';
    return file.replace(/\.html?$/i, '');
  }

  function isMobile() {
    try {
      return !!(window.matchMedia && window.matchMedia('(max-width: 720px)').matches);
    } catch (e) { return false; }
  }

  function device() {
    return isMobile() ? 'mobile' : 'desktop';
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h += h << 13; h ^= h >>> 7;
    h += h << 3; h ^= h >>> 17;
    h += h << 5;
    return h >>> 0;
  }

  var memVid = uuid();
  var disabled = safeGet(window.localStorage, DISABLED_KEY) === '1';
  var overrides = readJSON(OVERRIDE_KEY) || {};
  var assignments = {};
  var active = [];
  var assignedRootKeys = [];
  var domApplied = false;
  var stickyWired = false;

  function getVid() {
    if (effectiveConsent() === 'granted') {
      var stored = safeGet(window.localStorage, VISITOR_KEY);
      if (stored && UUID_RE.test(stored)) return stored;
      safeSet(window.localStorage, VISITOR_KEY, memVid);
      return memVid;
    }
    return memVid;
  }

  function pickVariant(experiment, vid) {
    var variantKeys = Object.keys(experiment.variants || {});
    if (!variantKeys.length) return null;
    var total = 0;
    var i;
    for (i = 0; i < variantKeys.length; i++) {
      total += Number(experiment.variants[variantKeys[i]].weight) || 0;
    }
    if (total <= 0) return null;
    var point = (hash(experiment.key + '|variant|' + vid) % 100000) / 100000 * total;
    for (i = 0; i < variantKeys.length; i++) {
      point -= Number(experiment.variants[variantKeys[i]].weight) || 0;
      if (point < 0) return variantKeys[i];
    }
    return variantKeys[variantKeys.length - 1];
  }

  function eligible(experiment, vid) {
    if (disabled) return null;
    var override = overrides[experiment.key];
    if (override && experiment.variants[override]) {
      return { variant: override, preview: true };
    }
    if (experiment.status !== 'live') return null;
    if (CONFIG.requireAnalytics !== false && !analyticsConfigured() && !DEBUG) return null;
    var pages = experiment.pages || ['*'];
    if (pages.indexOf('*') === -1 && pages.indexOf(pageName()) === -1) return null;
    if (experiment.device && experiment.device !== device()) return null;
    var traffic = experiment.traffic == null ? 100 : Number(experiment.traffic);
    if (traffic <= 0) return null;
    if (traffic < 100) {
      var bucket = hash(experiment.key + '|traffic|' + vid) % 10000;
      if (bucket >= traffic * 100) return null;
    }
    var variant = pickVariant(experiment, vid);
    return variant ? { variant: variant, preview: false } : null;
  }

  var vid = getVid();

  CONFIG.experiments.forEach(function (experiment) {
    if (!experiment || !experiment.key || !experiment.variants) return;
    var chosen = eligible(experiment, vid);
    if (!chosen) {
      debugLog('not eligible:', experiment.key, experiment.status);
      return;
    }
    assignments[experiment.key] = chosen.variant;
    active.push({
      key: experiment.key,
      name: experiment.name || experiment.key,
      variant: chosen.variant,
      preview: chosen.preview,
      experiment: experiment
    });
  });

  var root = document.documentElement;
  active.forEach(function (item) {
    root.setAttribute('data-ab-' + item.key, item.variant);
    assignedRootKeys.push('data-ab-' + item.key);
  });
  if (active.some(function (item) { return item.preview; })) root.classList.add('ab-preview');

  function copyKeySafe(key) {
    return /^[a-zA-Z0-9_.-]+$/.test(key);
  }

  function copyFor(item) {
    var variants = item.experiment.variants || {};
    var variant = variants[item.variant];
    return variant && variant.copy ? variant.copy : null;
  }

  function needsEagerCover() {
    var eager = CONFIG.eagerCopy || [];
    if (!eager.length) return false;
    for (var i = 0; i < active.length; i++) {
      var item = active[i];
      var copy = copyFor(item);
      if (!copy) continue;
      var control = item.experiment.variants.control && item.experiment.variants.control.copy;
      for (var j = 0; j < eager.length; j++) {
        var key = eager[j];
        if (!Object.prototype.hasOwnProperty.call(copy, key)) continue;
        if (!control || control[key] !== copy[key]) return true;
      }
    }
    return false;
  }

  var eagerCover = needsEagerCover();
  if (eagerCover) root.classList.add('ab-copy-pending');
  if (eagerCover) {
    window.setTimeout(function () { root.classList.remove('ab-copy-pending'); }, EAGER_TIMEOUT);
  }

  function applyCopy() {
    active.forEach(function (item) {
      var copy = copyFor(item);
      if (!copy) return;
      Object.keys(copy).forEach(function (key) {
        if (!copyKeySafe(key)) return;
        var nodes = document.querySelectorAll('[data-ab-copy="' + key + '"]');
        var text = copy[key];
        if (typeof text !== 'string') return;
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].textContent !== text) nodes[i].textContent = text;
        }
      });
    });
    root.classList.remove('ab-copy-pending');
  }

  function addFormMeta() {
    var form = document.querySelector('.contact-form');
    if (!form) return;
    var value = active.map(function (item) {
      return item.key + '=' + item.variant + (item.preview ? ' (preview)' : '');
    }).join('; ') || 'none';
    var input = form.querySelector('input[name="ab_variants"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'ab_variants';
      form.appendChild(input);
    }
    input.value = value;
    input.setAttribute('value', value);
  }

  function syncOptionalFields() {
    var row = document.getElementById('cf-optional');
    if (!row) return;
    // The row is hidden by variant CSS before paint. Disable its inputs while hidden so a hidden
    // company or phone value can never be submitted, or filled by autofill, behind the visitor's back.
    var hidden = window.getComputedStyle ? window.getComputedStyle(row).display === 'none' : false;
    ['cf-company', 'cf-phone'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.disabled = hidden;
    });
  }

  function wireOptionalFields() {
    var form = document.querySelector('.contact-form');
    var toggle = document.querySelector('[data-ab-optional-toggle]');
    if (!form || !toggle) return;
    syncOptionalFields();
    if (toggle.getAttribute('data-ab-wired') === '1') return;
    toggle.setAttribute('data-ab-wired', '1');
    toggle.addEventListener('click', function () {
      form.classList.add('is-expanded');
      toggle.setAttribute('aria-expanded', 'true');
      syncOptionalFields();
      var first = document.getElementById('cf-company');
      if (first) first.focus();
      try {
        document.dispatchEvent(new window.CustomEvent('briatti:form-expand'));
      } catch (e) {}
    });
  }

  function setupStickyCta(item, options) {
    if (stickyWired || document.querySelector('.ab-sticky-cta')) return;
    stickyWired = true;
    var link = document.createElement('a');
    link.className = 'ab-sticky-cta';
    link.href = options.href || '#contact';
    link.textContent = options.label || 'Request a callback';
    link.setAttribute('data-ab-sticky', item.variant);
    document.body.appendChild(link);

    var after = Number(options.after) || 600;
    var contact = document.getElementById('contact');
    var pastHero = false;
    var atForm = false;
    var shown = false;

    // DESIGN.md bans scroll listeners. A 1px sentinel placed at the experiment's threshold and an
    // observer on the contact section give the same answer without one.
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;left:0;top:' + after + 'px;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(sentinel);

    function update() {
      var next = pastHero && !atForm;
      if (next !== shown) {
        shown = next;
        link.classList.toggle('is-visible', next);
      }
    }

    if ('IntersectionObserver' in window) {
      new window.IntersectionObserver(function (entries) {
        // top < 0 means the sentinel has gone above the viewport; a sentinel that starts below it
        // must not show the bar until the visitor actually scrolls past.
        pastHero = entries[0].boundingClientRect.top < 0;
        update();
      }, { threshold: 0 }).observe(sentinel);

      if (contact) {
        new window.IntersectionObserver(function (entries) {
          atForm = entries[0].isIntersecting;
          update();
        }, { threshold: 0, rootMargin: '0px 0px -15% 0px' }).observe(contact);
      }
    }
  }

  function wireStickyCta() {
    active.forEach(function (item) {
      var variant = item.experiment.variants[item.variant];
      if (!variant || !variant.sticky) return;
      if (!isMobile()) return;
      setupStickyCta(item, variant.sticky);
    });
  }

  function applyToDom() {
    if (domApplied) return;
    domApplied = true;
    applyCopy();
    addFormMeta();
    wireOptionalFields();
    wireStickyCta();
    document.documentElement.classList.remove('ab-copy-pending');
    try {
      document.dispatchEvent(new window.CustomEvent('briatti:ab-ready', { detail: { assignments: assignments } }));
    } catch (e) {}
  }

  function refresh() {
    if (!domApplied) return;
    applyCopy();
    addFormMeta();
  }

  function setConsent(choice, source) {
    if (choice !== 'granted' && choice !== 'denied') return effectiveConsent() || 'denied';
    if (choice === 'granted' && isBlocked()) choice = 'denied';
    memConsent = choice;
    writeJSON(CONSENT_KEY, { v: CONSENT_VERSION, choice: choice, ts: new Date().toISOString() });
    if (choice === 'granted') {
      // Persist exactly the id the assignments were computed with; an older stored id would make
      // analytics report a different variant from the one this page rendered.
      safeSet(window.localStorage, VISITOR_KEY, vid);
    } else {
      safeRemove(window.localStorage, VISITOR_KEY);
      safeRemove(window.sessionStorage, SESSION_KEY);
    }
    try {
      document.dispatchEvent(new window.CustomEvent('briatti:consent', { detail: { choice: choice, source: source || 'ui' } }));
    } catch (e) {}
    return choice;
  }

  function buildPreviewPanel() {
    if (document.querySelector('.ab-panel')) return;
    var panel = document.createElement('div');
    panel.className = 'ab-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'A/B test preview');

    var head = document.createElement('div');
    head.className = 'ab-panel-head';
    var title = document.createElement('strong');
    title.textContent = 'A/B preview';
    var close = document.createElement('a');
    close.className = 'ab-panel-close';
    close.href = window.location.pathname;
    close.setAttribute('aria-label', 'Close preview');
    close.textContent = '\u00d7';
    head.appendChild(title);
    head.appendChild(close);
    panel.appendChild(head);

    var note = document.createElement('p');
    note.className = 'ab-panel-note';
    note.textContent = 'Overrides apply only in this browser and are tagged as preview in analytics.';
    panel.appendChild(note);

    if (!active.length) {
      var empty = document.createElement('p');
      empty.className = 'ab-panel-empty';
      empty.textContent = 'No experiment is running here. Check the token in js/analytics.config.js, or use the select below to preview one anyway.';
      panel.appendChild(empty);
    }

    CONFIG.experiments.forEach(function (experiment) {
      var row = document.createElement('div');
      row.className = 'ab-panel-row';
      var label = document.createElement('label');
      label.textContent = experiment.name || experiment.key;
      var select = document.createElement('select');
      var none = document.createElement('option');
      none.value = '';
      none.textContent = 'not eligible';
      select.appendChild(none);
      Object.keys(experiment.variants).forEach(function (key) {
        var option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        select.appendChild(option);
      });
      select.value = assignments[experiment.key] || '';
      select.addEventListener('change', function () {
        var next = readJSON(OVERRIDE_KEY) || {};
        if (select.value) next[experiment.key] = select.value;
        else delete next[experiment.key];
        writeJSON(OVERRIDE_KEY, next);
        safeRemove(window.localStorage, DISABLED_KEY);
        window.location.reload();
      });
      var status = document.createElement('span');
      status.className = 'ab-panel-status';
      status.textContent = experiment.status + (assignments[experiment.key] ? ' \u00b7 ' + assignments[experiment.key] : '');
      label.appendChild(select);
      label.appendChild(status);
      row.appendChild(label);
      panel.appendChild(row);
    });

    var actions = document.createElement('div');
    actions.className = 'ab-panel-actions';
    var reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Clear overrides';
    reset.addEventListener('click', function () {
      safeRemove(window.localStorage, OVERRIDE_KEY);
      safeRemove(window.localStorage, DISABLED_KEY);
      window.location.reload();
    });
    var control = document.createElement('a');
    control.href = window.location.pathname + '?ab=off';
    control.textContent = 'View control';
    actions.appendChild(reset);
    actions.appendChild(control);
    panel.appendChild(actions);
    document.body.appendChild(panel);
  }

  function handleModeParam() {
    if (MODE === 'off') {
      safeSet(window.localStorage, DISABLED_KEY, '1');
      safeRemove(window.localStorage, OVERRIDE_KEY);
      window.location.replace(window.location.pathname);
      return true;
    }
    if (MODE === 'on') {
      safeRemove(window.localStorage, DISABLED_KEY);
      window.location.replace(window.location.pathname);
      return true;
    }
    if (MODE === 'reset') {
      safeRemove(window.localStorage, OVERRIDE_KEY);
      safeRemove(window.localStorage, DISABLED_KEY);
      window.location.replace(window.location.pathname);
      return true;
    }
    if (MODE === 'control') {
      var next = {};
      CONFIG.experiments.forEach(function (experiment) {
        if (experiment.variants.control) next[experiment.key] = 'control';
      });
      writeJSON(OVERRIDE_KEY, next);
      safeRemove(window.localStorage, DISABLED_KEY);
      window.location.replace(window.location.pathname);
      return true;
    }
    return false;
  }

  var redirecting = handleModeParam();
  if (!redirecting) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyToDom);
    } else {
      applyToDom();
    }
    if (PREVIEW) {
      if (document.body) buildPreviewPanel();
      else document.addEventListener('DOMContentLoaded', buildPreviewPanel);
    }
  }

  window.BriattiAB = {
    version: CONFIG.version || '',
    ready: true,
    getConsent: effectiveConsent,
    isBlocked: isBlocked,
    isConfigured: analyticsConfigured,
    isPreview: function () {
      // ?ab_debug=1 is a QA visit too; tag it so the report can exclude it.
      return PREVIEW || DEBUG || active.some(function (item) { return item.preview; });
    },
    getVid: getVid,
    getAssignments: function () {
      var out = {};
      Object.keys(assignments).forEach(function (key) { out[key] = assignments[key]; });
      return out;
    },
    getActive: function () {
      return active.map(function (item) {
        return { key: item.key, name: item.name, variant: item.variant, preview: item.preview };
      });
    },
    setConsent: setConsent,
    refresh: refresh,
    hash: hash
  };

  debugLog('active experiments', active.map(function (item) { return item.key + '=' + item.variant; }));
})(window, document);
