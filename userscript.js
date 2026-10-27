// ==UserScript==
// @name         SAT Question Bank — SAT-style layout
// @namespace    https://satquestionbank.org/
// @version      1.0.0
// @description  Puts practice questions and answer choices side by side and changes primary buttons to blue.
// @match        https://satquestionbank.org/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  let timerPaused = false;
  const nativeSetInterval = window.setInterval;

  // The site's question timer advances through a one-second interval.
  window.setInterval = function (handler, delay, ...args) {
    if (typeof handler !== 'function' || Number(delay) !== 1000) {
      return nativeSetInterval.call(this, handler, delay, ...args);
    }

    return nativeSetInterval.call(this, function (...callbackArgs) {
      if (!timerPaused) {
        handler.apply(this, callbackArgs);
      }
    }, delay, ...args);
  };

  const style = document.createElement('style');
  style.id = 'sqb-sat-style';
  style.textContent = `
    #sqb-timer-pause {
      min-height: 2rem;
      padding: 0.25rem 0.6rem;
      border: 1px solid #2563eb;
      border-radius: 0.5rem;
      background: #2563eb;
      color: #fff;
      font: inherit;
      font-size: 0.875rem;
      cursor: pointer;
    }

    #sqb-timer-pause:hover {
      background: #1d4ed8;
    }

    #sqb-timer-pause:focus-visible {
      outline: 3px solid #93c5fd;
      outline-offset: 2px;
    }

    /* Replace the site's bright pink primary actions with a clear SAT-style blue. */
    .btn-primary {
      background-color: #2563eb !important;
      border-color: #2563eb !important;
      color: #fff !important;
      box-shadow: 0 3px 6px rgb(37 99 235 / 28%) !important;
    }

    /* The cross-out control uses btn-primary only while its checkbox is checked. */
    #allowCrossingAnswersToggle:has(input:checked) {
      background-color: #2563eb !important;
      border-color: #2563eb !important;
      color: #fff !important;
      box-shadow: 0 3px 6px rgb(37 99 235 / 28%) !important;
    }

    .btn-primary:hover:not(:disabled),
    #allowCrossingAnswersToggle:has(input:checked):hover {
      background-color: #1d4ed8 !important;
      border-color: #1d4ed8 !important;
      box-shadow: 0 3px 7px rgb(29 78 216 / 34%) !important;
    }

    .btn-primary:focus-visible {
      outline: 3px solid #93c5fd;
      outline-offset: 2px;
    }

    /* The question prompt and answer form become the two columns of the practice view. */
    body:has(.explanation_content)
      .flex.place-content-center.gap-3:has(> main > .explanation_content) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
      gap: 1.25rem;
      width: min(100%, 1160px);
      margin-inline: auto;
    }

    body:has(.explanation_content)
      .flex.place-content-center.gap-3 > main:has(> .explanation_content) {
      display: contents;
    }

    body:has(.explanation_content) .explanation_content {
      grid-column: 1;
      grid-row: 1;
      min-width: 0;
      padding: 1.25rem;
      border: 1px solid color-mix(in srgb, var(--color-base-content) 18%, transparent);
      border-radius: 0.75rem;
      background: var(--color-base-100);
      color: var(--color-base-content);
      line-height: 1.65;
    }

    body:has(.explanation_content) .explanation_content > :first-child {
      margin-top: 0;
    }

    body:has(.explanation_content) form.w-full {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
      padding: 1.25rem;
      border: 1px solid color-mix(in srgb, var(--color-base-content) 18%, transparent);
      border-radius: 0.75rem;
      background: var(--color-base-100);
    }

    body:has(.explanation_content) form fieldset {
      gap: 0.75rem;
      padding: 0;
    }

    body:has(.explanation_content) form fieldset > div {
      align-items: stretch;
    }

    body:has(.explanation_content) form label {
      min-width: 0;
      min-height: 3.25rem;
      align-items: flex-start;
    }

    /* Keep the checked radio and its ring, but use blue instead of the site's pink. */
    body:has(.explanation_content) form label:has(input:checked) {
      --tw-ring-color: #2563eb !important;
    }

    body:has(.explanation_content) form label p {
      margin: 0;
      line-height: 1.55;
    }

    body:has(.explanation_content) .join.mt-3.w-full {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-self: center;
      width: min(100%, 32rem);
      margin-top: 0;
    }

    @media (max-width: 760px) {
      body:has(.explanation_content)
        .flex.place-content-center.gap-3:has(> main > .explanation_content) {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.875rem;
      }

      body:has(.explanation_content) .explanation_content,
      body:has(.explanation_content) form.w-full {
        grid-column: 1;
        grid-row: auto;
        padding: 1rem;
      }

      body:has(.explanation_content) .join.mt-3.w-full {
        grid-column: 1;
        grid-row: auto;
      }
    }
  `;

  function addTimerPauseButton() {
    const timerLabel = document
      .querySelector('.i-material-symbols-alarm-outline-rounded')
      ?.closest('label');

    if (!timerLabel || timerLabel.parentElement?.querySelector('#sqb-timer-pause')) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'sqb-timer-pause';
    button.type = 'button';
    button.textContent = timerPaused ? 'Resume' : 'Pause';
    button.setAttribute('aria-label', timerPaused ? 'Resume timer' : 'Pause timer');
    button.setAttribute('aria-pressed', String(timerPaused));
    button.addEventListener('click', () => {
      timerPaused = !timerPaused;
      button.textContent = timerPaused ? 'Resume' : 'Pause';
      button.setAttribute('aria-label', timerPaused ? 'Resume timer' : 'Pause timer');
      button.setAttribute('aria-pressed', String(timerPaused));
    });

    timerLabel.insertAdjacentElement('afterend', button);
  }

  function initializeUserscript() {
    if (document.head && !document.head.contains(style)) {
      document.head.appendChild(style);
    }
    addTimerPauseButton();
  }

  const observer = new MutationObserver(initializeUserscript);
  observer.observe(document, { childList: true, subtree: true });
  initializeUserscript();
})();
