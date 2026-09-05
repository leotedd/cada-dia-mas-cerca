/* =========================================================================
   CADA DÍA MÁS CERCA — app.js
   -------------------------------------------------------------------------
   Todo lo que normalmente querrás cambiar (fotos, frases, fecha, textos)
   vive en el objeto CONFIG, justo abajo. El resto del archivo es lógica
   que no deberías necesitar tocar.
   ========================================================================= */

(function () {
  'use strict';

  /* =======================================================================
     1) CONFIGURACIÓN — edita aquí fotos, frases, fecha y textos
     ======================================================================= */
  const CONFIG = {
    // Zona horaria de referencia para decidir qué día se desbloquea.
    // Guatemala es UTC-6 todo el año (no tiene horario de verano).
    timezoneOffsetHours: 6,

    // Textos de la portada (sección 1)
    hero: {
      title: 'Cada día más cerca',
      subtitle: 'Hay distancias que solo hacen que el abrazo sea más esperado.',
      countdownFooter: 'Nuestro momento se acerca...',
    },

    // Mensajes reutilizados en toda la página
    messages: {
      dailyPlaceholder: 'Nuestro recuerdo de hoy ❤️',
      lockedHint: 'Este recuerdo todavía está esperando su momento.',
      comingSoonPhrase: 'Nuestro primer recuerdo está por comenzar.',
    },

    // Fecha y hora EXACTA del reencuentro, en hora local de Guatemala.
    // month: 1 = enero ... 12 = diciembre (formato humano, no de JS)
    meeting: {
      year: 2026,
      month: 9,
      day: 11,
      hour: 0,
      minute: 0,

      dateLabel: '11 • 09 • 2026',
      // Foto original ("cuarta imagen"), reservada para el día del encuentro.
      photo: 'images/cuarta%20imagen.jpeg',
      placeholderText: 'Aquí vivirá la foto de nuestro reencuentro ❤️',

      title: 'Hoy la distancia termina. ❤️',
      paragraph: 'Después de tantos días contando el tiempo,\npor fin llegó el día que tanto esperabas.',
      finalLines: [
        'Ya no faltan días.',
        'Ya no faltan horas.',
        'Solo falta ese abrazo.',
      ],
    },

    // Un objeto por cada día de espera (del 4 al 10 de septiembre de 2026).
    // - day: número de día del mes (se desbloquea a las 00:00 hora Guatemala)
    // - remaining: cuántos días faltan para el reencuentro ese día
    // - image: ruta de la fotografía (si no existe, se ve un placeholder).
    //   Los nombres de archivo con espacios se escriben con %20 (los
    //   archivos reales en images/ SÍ tienen espacios en su nombre, no se
    //   renombraron: esto es solo la forma correcta de escribir la ruta).
    // - phrase: frase de ese día (algunas son bromas personales EXACTAS,
    //   pedidas así por el usuario; no reemplazar por frases genéricas)
    days: [
      { day: 4, remaining: 7, image: 'images/foto%20dia%20uno%20nueva.jpeg', phrase: '¿Estás más emocionada que cuando miras al perro enano? 😂' },
      { day: 5, remaining: 6, image: 'images/foto%20dia%202%20nueva.jpeg', phrase: 'Un día menos para volver a encontrarnos.' },
      { day: 6, remaining: 5, image: 'images/foto%203%20nueva.jpeg', phrase: 'Recuerda: ya no verlo. 😂' },
      { day: 7, remaining: 4, image: 'images/juntoo%20a%20foto%204%20.jpeg', phrase: 'Obligatorio bloquear a Juan Carlos. 😂' },
      { day: 8, remaining: 3, image: 'images/segunda%20imagen.jpeg', phrase: 'Ya casi puedo imaginar ese primer abrazo.' },
      { day: 9, remaining: 2, image: 'images/junto%20a%20foto%20dia%206%20.jpeg', phrase: '¿Aún piensas en el perro enano? 😂' },
      { day: 10, remaining: 1, image: 'images/tercera%20imagen.jpeg', phrase: 'Mañana la distancia deja de existir. ❤️' },
    ],
  };

  /* =======================================================================
     2) UTILIDADES DE FECHA / ZONA HORARIA (Guatemala, UTC-6)
     -------------------------------------------------------------------------
     En vez de comparar strings de fecha (algo ambiguo y dependiente del
     navegador), construimos timestamps absolutos (milisegundos UTC) a partir
     de la hora local de Guatemala. Así la cuenta regresiva funciona igual
     sin importar en qué zona horaria esté el celular de quien la abre.
     ======================================================================= */

  /**
   * Convierte una fecha/hora "local de Guatemala" a un timestamp absoluto
   * (milisegundos desde 1970, UTC), sin depender de Date.parse ni de
   * strings de fecha ambiguos.
   */
  function guatemalaTimestamp(year, month, day, hour, minute) {
    // month llega en formato humano (1-12); Date.UTC espera 0-11.
    // Como Guatemala = UTC-6, la hora UTC equivalente es hora local + 6.
    return Date.UTC(year, month - 1, day, hour + CONFIG.timezoneOffsetHours, minute, 0, 0);
  }

  const MEETING_TS = guatemalaTimestamp(
    CONFIG.meeting.year,
    CONFIG.meeting.month,
    CONFIG.meeting.day,
    CONFIG.meeting.hour,
    CONFIG.meeting.minute
  );

  /* =======================================================================
     ========================================
     MODO DE PRUEBA - DESACTIVAR AL PUBLICAR
     ========================================
     -------------------------------------------------------------------------
     Sirve SOLO para revisar manualmente cada día de la cuenta regresiva
     durante el desarrollo, sin esperar a que llegue la fecha real.

     - MODO_PRUEBA = true  -> toda la página se comporta como si el día
       actual fuera DIA_PRUEBA (4 al 10 = días de espera, 11 = encuentro).
     - MODO_PRUEBA = false -> se ignora DIA_PRUEBA por completo y la página
       vuelve al funcionamiento real, con la fecha/hora de Guatemala.

     Esto NO cambia CONFIG.meeting (la fecha real del reencuentro), NO
     cambia la zona horaria y NO toca el bloqueo de días futuros: solo
     desplaza el reloj interno que la página usa para decidir "qué hora es
     ahora mismo" (ver getNow() más abajo). El contador de horas/minutos/
     segundos sigue corriendo con normalidad durante la simulación, como si
     de verdad fuera esa fecha.

     >>> PARA PROBAR OTRO DÍA: cambia solo el número de DIA_PRUEBA. <<<
     >>> ANTES DE PUBLICAR EL SITIO: vuelve a poner MODO_PRUEBA = false. <<<
     ======================================================================= */
  const MODO_PRUEBA = true;
  const DIA_PRUEBA = 11; // 4-10 = días de espera · 11 = día del encuentro

  /**
   * Timestamp (medianoche, hora Guatemala) del día que se está simulando.
   */
  function resolveTestDayTimestamp(diaPrueba) {
    return guatemalaTimestamp(CONFIG.meeting.year, CONFIG.meeting.month, diaPrueba, 0, 0);
  }

  /**
   * Desplazamiento (en milisegundos) que se le suma al reloj real para que
   * la página "viva" en DIA_PRUEBA. Se calcula una sola vez, al cargar la
   * página, y luego el tiempo sigue avanzando con normalidad a partir de ahí
   * (por eso el contador se mantiene coherente durante la simulación).
   */
  const DIAS_VALIDOS_PRUEBA = [4, 5, 6, 7, 8, 9, 10, 11];

  const TEST_TIME_OFFSET_MS = (function () {
    if (!MODO_PRUEBA) return 0;

    if (DIAS_VALIDOS_PRUEBA.indexOf(DIA_PRUEBA) === -1) {
      console.warn('MODO_PRUEBA: DIA_PRUEBA debe ser un número entre 4 y 11. Se ignora la simulación.');
      return 0;
    }

    return resolveTestDayTimestamp(DIA_PRUEBA) - Date.now();
  })();

  /**
   * "Ahora" que debe usar TODA la página (cuenta regresiva, línea de
   * tiempo, tarjeta del día, pantalla del encuentro, progreso). El resto
   * del código llama siempre a getNow() en vez de Date.now(), para que el
   * modo de prueba se aplique desde un único lugar.
   */
  function getNow() {
    return Date.now() + TEST_TIME_OFFSET_MS;
  }

  /**
   * Día elegido a mano en la línea de tiempo MIENTRAS MODO_PRUEBA = true:
   * permite hacer clic en cualquier fecha del 4 al 11 para revisarla al
   * instante, sin esperar a que llegue de verdad. Con MODO_PRUEBA = false
   * esta variable no se usa en absoluto (la línea de tiempo vuelve a
   * calcular su estado real, ver computeDaysRuntime()).
   */
  let testSelectedDay = (MODO_PRUEBA && DIAS_VALIDOS_PRUEBA.indexOf(DIA_PRUEBA) !== -1)
    ? DIA_PRUEBA
    : CONFIG.days[0].day;
  /* ======================================================================= */

  /* =======================================================================
     3) ESTADO Y REFERENCIAS DEL DOM
     ======================================================================= */
  const dom = {};
  let meetingTriggered = false;
  let countdownIntervalId = null;
  let lastCurrentDayNumber = null;

  function cacheDom() {
    dom.bgDecor = document.getElementById('bg-decor');

    dom.heroTitleText = document.getElementById('hero-title-text');
    dom.heroSubtitle = document.getElementById('hero-subtitle');
    dom.countdownFooter = document.getElementById('countdown-footer');

    dom.cdDays = document.getElementById('cd-days');
    dom.cdHours = document.getElementById('cd-hours');
    dom.cdMinutes = document.getElementById('cd-minutes');
    dom.cdSeconds = document.getElementById('cd-seconds');

    dom.progressFill = document.getElementById('progress-fill');

    dom.countdownSection = document.getElementById('countdown-section');
    dom.dailySection = document.getElementById('daily-section');

    dom.featuredCard = document.getElementById('featured-card');
    dom.featuredPhoto = document.getElementById('featured-photo');
    dom.featuredPlaceholder = document.getElementById('featured-placeholder');
    dom.featuredPlaceholderText = document.getElementById('featured-placeholder-text');
    dom.featuredPhrase = document.getElementById('featured-phrase');
    dom.featuredRemaining = document.getElementById('featured-remaining');

    dom.timeline = document.getElementById('timeline');
    dom.timelineHint = document.getElementById('timeline-hint');

    dom.meetingScreen = document.getElementById('meeting-screen');
    dom.meetingPhoto = document.getElementById('meeting-photo');
    dom.meetingPlaceholder = document.getElementById('meeting-placeholder');
    dom.meetingPlaceholderText = document.getElementById('meeting-placeholder-text');
    dom.meetingTitle = document.getElementById('meeting-title');
    dom.meetingParagraph = document.getElementById('meeting-paragraph');
    dom.meetingDate = document.getElementById('meeting-date');
    dom.meetingFinal = document.getElementById('meeting-final');
  }

  /* =======================================================================
     4) TEXTOS ESTÁTICOS — se pintan desde CONFIG una sola vez
     ======================================================================= */
  function paintStaticTexts() {
    dom.heroTitleText.textContent = CONFIG.hero.title;
    dom.heroSubtitle.textContent = CONFIG.hero.subtitle;
    dom.countdownFooter.textContent = CONFIG.hero.countdownFooter;

    dom.meetingPlaceholderText.textContent = CONFIG.meeting.placeholderText;
    dom.meetingTitle.textContent = CONFIG.meeting.title;
    dom.meetingParagraph.textContent = CONFIG.meeting.paragraph; // el CSS respeta los \n (white-space: pre-line)
    dom.meetingDate.textContent = CONFIG.meeting.dateLabel;

    dom.meetingFinal.innerHTML = '';
    CONFIG.meeting.finalLines.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      dom.meetingFinal.appendChild(p);
    });
  }

  /* =======================================================================
     5) FONDO DECORATIVO — estrellas y corazones discretos
     ======================================================================= */
  function buildBackgroundDecor() {
    const fragment = document.createDocumentFragment();

    // Estrellas discretas
    const STAR_COUNT = 22;
    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement('span');
      star.className = 'bg-star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      star.style.animationDuration = (3 + Math.random() * 3).toFixed(2) + 's';
      fragment.appendChild(star);
    }

    // Corazones flotantes muy discretos (pocos, para no saturar la pantalla)
    const HEART_COUNT = 5;
    for (let i = 0; i < HEART_COUNT; i++) {
      const heart = document.createElement('span');
      heart.className = 'bg-heart';
      heart.textContent = '❤';
      heart.style.left = Math.random() * 100 + '%';
      heart.style.animationDelay = (Math.random() * 14).toFixed(2) + 's';
      heart.style.animationDuration = (14 + Math.random() * 8).toFixed(2) + 's';
      fragment.appendChild(heart);
    }

    dom.bgDecor.appendChild(fragment);
  }

  /* =======================================================================
     6) CARGA DE FOTOGRAFÍAS CON PLACEHOLDER ELEGANTE
     -------------------------------------------------------------------------
     Si la fotografía todavía no existe (o la ruta falla), el diseño no se
     rompe: en su lugar se mantiene visible el placeholder elegante.
     ======================================================================= */
  function setPhoto(imgEl, placeholderEl, src, placeholderText) {
    if (placeholderText !== undefined) {
      const textEl = placeholderEl.querySelector('.placeholder-text');
      if (textEl) textEl.textContent = placeholderText;
    }

    // El marco (.photo-frame) usa una relación de aspecto por defecto en CSS
    // mientras no hay foto confirmada; en cuanto la foto carga, se ajusta a
    // su relación de aspecto REAL (ver más abajo) para que fotos verticales
    // u horizontales nunca se recorten de forma agresiva ni se deformen.
    const frameEl = imgEl.closest('.photo-frame');

    // Mientras se decide si la imagen existe, se ve el placeholder.
    imgEl.classList.remove('is-visible');
    placeholderEl.classList.remove('is-hidden');
    imgEl.removeAttribute('src');
    if (frameEl) frameEl.style.removeProperty('aspect-ratio');

    if (!src) return; // sin ruta: nos quedamos en el placeholder

    const tester = new Image();
    tester.onload = function () {
      imgEl.src = src;
      imgEl.classList.add('is-visible');
      placeholderEl.classList.add('is-hidden');

      // Respeta la relación de aspecto real de la foto (móvil first: evita
      // cortes agresivos en fotos verticales u horizontales del celular).
      if (frameEl && tester.naturalWidth && tester.naturalHeight) {
        frameEl.style.aspectRatio = `${tester.naturalWidth} / ${tester.naturalHeight}`;
      }
    };
    tester.onerror = function () {
      // La foto todavía no existe: el placeholder se queda como está.
      imgEl.classList.remove('is-visible');
      placeholderEl.classList.remove('is-hidden');
      if (frameEl) frameEl.style.removeProperty('aspect-ratio');
    };
    tester.src = src;
  }

  /* =======================================================================
     7) CÁLCULO DE ESTADO DE CADA DÍA (pasado / actual / futuro)
     ======================================================================= */
  function computeDaysRuntime(now) {
    return CONFIG.days.map((entry) => {
      const startTs = guatemalaTimestamp(CONFIG.meeting.year, CONFIG.meeting.month, entry.day, 0, 0);
      const endTs = guatemalaTimestamp(CONFIG.meeting.year, CONFIG.meeting.month, entry.day + 1, 0, 0);

      let status = 'future';
      if (now >= endTs) status = 'past';
      else if (now >= startTs) status = 'current';

      return { config: entry, startTs, endTs, status };
    });
  }

  function findCurrentDayNumber(now) {
    const runtime = computeDaysRuntime(now);
    const current = runtime.find((d) => d.status === 'current');
    return current ? current.config.day : null;
  }

  /* =======================================================================
     8) TARJETA DEL DÍA — selección y pintado
     ======================================================================= */
  function remainingLabel(remaining) {
    return remaining === 1 ? 'Falta 1 día' : `Faltan ${remaining} días`;
  }

  function restartAnimation(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // fuerza reflow para poder repetir la animación
    el.classList.add(className);
  }

  function selectDay(dayNumber) {
    const entry = CONFIG.days.find((d) => d.day === dayNumber);
    if (!entry) return;

    dom.featuredPhrase.textContent = entry.phrase;
    dom.featuredRemaining.textContent = remainingLabel(entry.remaining);
    setPhoto(dom.featuredPhoto, dom.featuredPlaceholder, entry.image, CONFIG.messages.dailyPlaceholder);
    restartAnimation(dom.featuredCard, 'is-appearing');

    highlightActiveChip(dayNumber);
    dom.timelineHint.textContent = '';
  }

  function showComingSoonState() {
    dom.featuredPhrase.textContent = CONFIG.messages.comingSoonPhrase;
    dom.featuredRemaining.textContent = '';
    setPhoto(dom.featuredPhoto, dom.featuredPlaceholder, null, CONFIG.messages.dailyPlaceholder);
    restartAnimation(dom.featuredCard, 'is-appearing');
  }

  function showLockedHint() {
    dom.timelineHint.textContent = CONFIG.messages.lockedHint;
    restartAnimation(dom.timelineHint, 'is-appearing');
  }

  function highlightActiveChip(dayNumber) {
    const chips = dom.timeline.querySelectorAll('.timeline-chip');
    chips.forEach((chip) => {
      chip.classList.toggle('is-selected', Number(chip.dataset.day) === dayNumber);
    });
  }

  /* =======================================================================
     9) LÍNEA DE TIEMPO (del 4 al 11 de septiembre)
     ======================================================================= */
  function buildTimeline() {
    const now = getNow();
    const runtime = computeDaysRuntime(now);
    dom.timeline.innerHTML = '';

    runtime.forEach(({ config, status }) => {
      // ========================================
      // MODO DE PRUEBA - DESACTIVAR AL PUBLICAR
      // ========================================
      // Con MODO_PRUEBA = true, TODOS los días se muestran desbloqueados
      // y clicables: el que está seleccionado se resalta igual que el día
      // "actual" real (misma clase is-current de siempre), y el resto se
      // ve como consultable (is-past). Con MODO_PRUEBA = false esta rama
      // no se usa: se aplica el status real calculado arriba, intacto.
      const effectiveStatus = MODO_PRUEBA
        ? (config.day === testSelectedDay ? 'current' : 'past')
        : status;

      dom.timeline.appendChild(createChip({
        day: config.day,
        status: effectiveStatus,
        isMeeting: false,
      }));
    });

    // El día 11 (encuentro): en modo real se desbloquea solo cuando llega
    // la fecha (ver tick()); en MODO DE PRUEBA también queda clicable
    // siempre, para poder revisar la pantalla especial cuando quieras.
    const meetingReached = now >= MEETING_TS;
    const meetingStatus = MODO_PRUEBA
      ? (testSelectedDay === CONFIG.meeting.day ? 'current' : 'past')
      : (meetingReached ? 'past' : 'future');

    dom.timeline.appendChild(createChip({
      day: CONFIG.meeting.day,
      status: meetingStatus,
      isMeeting: true,
    }));
  }

  function createChip({ day, status, isMeeting }) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `timeline-chip is-${status}${isMeeting ? ' is-meeting' : ''}`;
    chip.dataset.day = String(day);

    const dayEl = document.createElement('span');
    dayEl.className = 'chip-day';
    dayEl.textContent = String(day).padStart(2, '0');

    const monthEl = document.createElement('span');
    monthEl.className = 'chip-month';
    monthEl.textContent = 'SEP';

    const iconEl = document.createElement('span');
    iconEl.className = 'chip-icon';
    iconEl.textContent = status === 'future' ? '🔒' : isMeeting ? '❤' : status === 'current' ? '✦' : '✓';

    chip.append(dayEl, monthEl, iconEl);

    chip.addEventListener('click', () => {
      // ========================================
      // MODO DE PRUEBA - DESACTIVAR AL PUBLICAR
      // ========================================
      // Con MODO_PRUEBA = true, cualquier día (4 al 11) es clicable y
      // cambia el contenido al instante, sin recargar la página, sin
      // importar el status real. Con MODO_PRUEBA = false este bloque no
      // se ejecuta jamás y el comportamiento real (más abajo) sigue igual.
      if (MODO_PRUEBA) {
        testSelectedDay = day;
        buildTimeline(); // refresca cuál día queda resaltado
        if (isMeeting) {
          enterMeetingView();
        } else {
          enterDailyView();
          selectDay(day);
        }
        return;
      }

      // Comportamiento REAL (MODO_PRUEBA = false): días futuros bloqueados
      // y el encuentro solo se muestra automáticamente al llegar la fecha.
      if (status === 'future') {
        restartAnimation(chip, 'is-shaking');
        showLockedHint();
        return;
      }
      if (isMeeting) return; // el encuentro se muestra solo cuando llega la fecha
      selectDay(day);
    });

    return chip;
  }

  /* =======================================================================
     10) BARRA DE PROGRESO
     ======================================================================= */
  const EXPERIENCE_START_TS = guatemalaTimestamp(
    CONFIG.meeting.year,
    CONFIG.meeting.month,
    CONFIG.days[0].day,
    0,
    0
  );

  function updateProgressBar(now) {
    const total = MEETING_TS - EXPERIENCE_START_TS;
    const elapsed = now - EXPERIENCE_START_TS;
    const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
    dom.progressFill.style.width = percent + '%';
  }

  /* =======================================================================
     11) CUENTA REGRESIVA
     ======================================================================= */
  function splitDiff(diffMs) {
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  }

  function renderCountdown(days, hours, minutes, seconds) {
    dom.cdDays.textContent = String(days).padStart(2, '0');
    dom.cdHours.textContent = String(hours).padStart(2, '0');
    dom.cdMinutes.textContent = String(minutes).padStart(2, '0');
    dom.cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  function tick() {
    const now = getNow();
    const diff = MEETING_TS - now;

    if (diff <= 0) {
      renderCountdown(0, 0, 0, 0);
      // En MODO DE PRUEBA nunca se dispara la transición automática: ahí el
      // cambio entre día normal y pantalla del encuentro es 100% manual,
      // con clics en la línea de tiempo (ver createChip). Esto solo aplica
      // en el comportamiento real.
      if (!MODO_PRUEBA && !meetingTriggered) {
        meetingTriggered = true;
        clearInterval(countdownIntervalId);
        // Deja un instante en 00:00:00:00 antes de revelar la pantalla especial.
        setTimeout(transitionToMeetingScreen, 1400);
      }
      return;
    }

    const { days, hours, minutes, seconds } = splitDiff(diff);
    renderCountdown(days, hours, minutes, seconds);
    updateProgressBar(now);

    // Si el celular se queda abierto pasada la medianoche (hora Guatemala),
    // el "recuerdo" activo se actualiza solo, sin necesidad de recargar.
    const currentDayNumber = findCurrentDayNumber(now);
    if (currentDayNumber !== lastCurrentDayNumber) {
      lastCurrentDayNumber = currentDayNumber;
      buildTimeline();
      if (currentDayNumber) selectDay(currentDayNumber);
    }
  }

  function startCountdown() {
    tick();
    countdownIntervalId = setInterval(tick, 1000);
  }

  /* =======================================================================
     12) TRANSICIÓN AL DÍA DEL ENCUENTRO
     ======================================================================= */
  function transitionToMeetingScreen() {
    dom.countdownSection.classList.add('is-leaving');
    dom.dailySection.classList.add('is-leaving');

    setTimeout(() => {
      dom.countdownSection.hidden = true;
      dom.dailySection.hidden = true;
      revealMeetingScreen();
    }, 650); // debe coincidir con la duración de la transición en el CSS
  }

  function revealMeetingScreen() {
    setPhoto(dom.meetingPhoto, dom.meetingPlaceholder, CONFIG.meeting.photo, CONFIG.meeting.placeholderText);
    dom.meetingScreen.hidden = false;
    restartAnimation(dom.meetingScreen, 'is-entering');
  }

  function showMeetingScreenImmediately() {
    // La página se abrió después de la fecha del reencuentro:
    // se muestra la pantalla especial directamente, sin animación de transición.
    enterMeetingView();
  }

  /**
   * Oculta la cuenta regresiva / experiencia diaria y muestra la pantalla
   * del encuentro, de forma inmediata. A diferencia de
   * transitionToMeetingScreen() (la animación real de una sola vez), esto
   * se puede llamar las veces que haga falta: lo usa showMeetingScreenImmediately()
   * y también el clic en el día 11 durante el MODO DE PRUEBA.
   *
   * ========================================
   * MODO DE PRUEBA - DESACTIVAR AL PUBLICAR
   * ========================================
   * La línea de tiempo (04-11) vive dentro de .daily-section, junto a la
   * tarjeta de foto+frase. En producción (MODO_PRUEBA = false) se oculta
   * TODA la sección al llegar el encuentro (comportamiento real, sin
   * cambios). Pero en MODO DE PRUEBA eso dejaría sin acceso a la línea de
   * tiempo mientras se ve la pantalla del encuentro, impidiendo volver a
   * los demás días — por eso ahí solo se oculta la tarjeta de foto+frase
   * (.featured-card), y la línea de tiempo se queda visible y clicable.
   */
  function enterMeetingView() {
    dom.countdownSection.classList.remove('is-leaving');
    dom.dailySection.classList.remove('is-leaving');
    dom.countdownSection.hidden = true;

    if (MODO_PRUEBA) {
      dom.dailySection.hidden = false;
      dom.featuredCard.hidden = true;
    } else {
      dom.dailySection.hidden = true;
    }

    revealMeetingScreen();
  }

  /**
   * ========================================
   * MODO DE PRUEBA - DESACTIVAR AL PUBLICAR
   * ========================================
   * Vuelve de la pantalla del encuentro a la cuenta regresiva / experiencia
   * diaria. Solo la usa el clic en un día 4-10 durante el MODO DE PRUEBA
   * (en producción, una vez que el encuentro llega, la página se queda ahí
   * y nunca hace falta "volver").
   */
  function enterDailyView() {
    dom.meetingScreen.hidden = true;
    dom.meetingScreen.classList.remove('is-entering');
    dom.countdownSection.hidden = false;
    dom.dailySection.hidden = false;
    dom.featuredCard.hidden = false;
  }

  /* =======================================================================
     13) INICIO
     ======================================================================= */
  function selectInitialDay() {
    const now = getNow();
    const runtime = computeDaysRuntime(now);
    const current = runtime.find((d) => d.status === 'current');

    if (current) {
      lastCurrentDayNumber = current.config.day;
      selectDay(current.config.day);
      return;
    }

    const firstDay = runtime[0];
    if (now < firstDay.startTs) {
      // Todavía no comienza la experiencia diaria.
      showComingSoonState();
      return;
    }

    // Salvaguarda defensiva (no debería ocurrir con las fechas configuradas).
    const lastPast = [...runtime].reverse().find((d) => d.status === 'past');
    selectDay(lastPast ? lastPast.config.day : firstDay.config.day);
  }

  function init() {
    cacheDom();
    paintStaticTexts();
    buildBackgroundDecor();
    buildTimeline();

    // ========================================
    // MODO DE PRUEBA - DESACTIVAR AL PUBLICAR
    // ========================================
    // DIA_PRUEBA solo decide la vista INICIAL al cargar la página (usando
    // las mismas funciones que usa el clic en un chip, ver createChip): si
    // es 11 arranca en la pantalla del encuentro, si no en el día
    // correspondiente. En cualquier caso el reloj arranca siempre, para que
    // el contador se mantenga coherente, y la línea de tiempo queda 100%
    // disponible para navegar manualmente a cualquier otro día después.
    if (MODO_PRUEBA) {
      startCountdown();
      if (testSelectedDay === CONFIG.meeting.day) {
        enterMeetingView();
      } else {
        enterDailyView();
        selectDay(testSelectedDay);
      }
      return;
    }

    // Comportamiento REAL (MODO_PRUEBA = false): sin cambios.
    const now = getNow();
    if (now >= MEETING_TS) {
      showMeetingScreenImmediately();
    } else {
      selectInitialDay();
      startCountdown();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
