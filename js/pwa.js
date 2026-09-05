/* =========================================================================
   CADA DÍA MÁS CERCA — js/pwa.js
   -------------------------------------------------------------------------
   Añade el comportamiento PWA SIN tocar la lógica de la cuenta regresiva
   (js/app.js queda intacto):

     1. Registra el Service Worker y gestiona sus actualizaciones.
     2. En Android/Chrome, si el navegador ofrece `beforeinstallprompt`,
        muestra un aviso discreto: "Agregar a pantalla de inicio ❤️".
     3. En iPhone/Safari, muestra una indicación discreta para usar
        Compartir → "Añadir a pantalla de inicio".
     4. Nunca instala nada automáticamente: siempre requiere la acción del
        usuario. Si ya se abrió como app instalada (standalone), no muestra
        ningún aviso.
   ========================================================================= */
(function () {
  'use strict';

  var DISMISS_KEY = 'cdmc-pwa-hint-dismissed';

  // --- ¿Ya se está ejecutando como aplicación instalada? ---
  function isStandalone() {
    return (
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  }

  function isDismissed() {
    try { return window.localStorage.getItem(DISMISS_KEY) === '1'; }
    catch (e) { return false; }
  }
  function setDismissed() {
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  /* -----------------------------------------------------------------
     1. SERVICE WORKER
  ----------------------------------------------------------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js').then(function (reg) {
        // Si aparece un SW nuevo, pídele que se active en cuanto pueda.
        function promote(worker) {
          if (!worker) return;
          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage('SKIP_WAITING');
            }
          });
        }
        if (reg.waiting && navigator.serviceWorker.controller) {
          reg.waiting.postMessage('SKIP_WAITING');
        }
        reg.addEventListener('updatefound', function () {
          promote(reg.installing);
        });
        // Busca actualizaciones al volver a la pestaña.
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') reg.update().catch(function () {});
        });
      }).catch(function () { /* sin SW la página sigue funcionando igual */ });

      // Cuando el SW nuevo toma control, recarga una sola vez para
      // servir los archivos actualizados de forma coherente.
      var refreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshed) return;
        refreshed = true;
        window.location.reload();
      });
    });
  }

  /* -----------------------------------------------------------------
     2 y 3. AVISO DISCRETO DE INSTALACIÓN
  ----------------------------------------------------------------- */
  if (isStandalone() || isDismissed()) return;

  var deferredPrompt = null;
  var hintEl = null;

  function buildHint(kind) {
    var el = document.createElement('div');
    el.className = 'pwa-hint' + (kind === 'ios' ? ' pwa-hint--ios' : '');
    el.setAttribute('role', 'note');

    var text = document.createElement('span');
    text.className = 'pwa-hint__text';

    var actions = document.createElement('span');
    actions.className = 'pwa-hint__actions';

    if (kind === 'android') {
      text.textContent = 'Guarda este recuerdo en tu teléfono ❤️';
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'pwa-hint__btn';
      add.textContent = 'Agregar a pantalla de inicio ❤️';
      add.addEventListener('click', onAndroidAdd);
      actions.appendChild(add);
    } else {
      text.innerHTML =
        'Para guardar este recuerdo ❤️<br>toca <strong>Compartir</strong> y luego ' +
        '&laquo;A&ntilde;adir a pantalla de inicio&raquo;.';
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'pwa-hint__close';
    close.setAttribute('aria-label', 'Cerrar aviso');
    close.innerHTML = '&times;';
    close.addEventListener('click', hideHint);
    actions.appendChild(close);

    el.appendChild(text);
    el.appendChild(actions);
    document.body.appendChild(el);
    // fuerza reflow para animar la entrada
    void el.offsetWidth;
    el.classList.add('is-visible');
    return el;
  }

  function showHint(kind) {
    if (hintEl || isStandalone() || isDismissed()) return;
    hintEl = buildHint(kind);
  }

  function hideHint() {
    setDismissed();
    if (!hintEl) return;
    hintEl.classList.remove('is-visible');
    var node = hintEl;
    hintEl = null;
    window.setTimeout(function () {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }, 450);
  }

  function onAndroidAdd() {
    if (!deferredPrompt) { hideHint(); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      deferredPrompt = null;
      hideHint();
    });
  }

  // --- Android / Chrome ---
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();            // no mostrar el mini-infobar del navegador
    deferredPrompt = e;
    showHint('android');
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    setDismissed();
    hideHint();
  });

  // --- iPhone / iPad con Safari (sin beforeinstallprompt) ---
  var ua = window.navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isIOSSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);

  if (isIOSSafari && !isStandalone()) {
    // pequeña espera para no competir con la carga inicial
    window.setTimeout(function () { showHint('ios'); }, 2500);
  }
})();
