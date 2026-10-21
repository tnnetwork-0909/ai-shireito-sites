(function () {
  'use strict';

  const STORAGE_KEY = 'nudgepay:v1';
  const STAGES = [
    { key: 'before', label: '3 days before', offset: -3 },
    { key: 'due', label: 'Due today', offset: 0 },
    { key: 'late3', label: '3 days late', offset: 3 },
    { key: 'late7', label: '7 days late', offset: 7 },
    { key: 'late14', label: '14 days late', offset: 14 }
  ];
  const TONES = [
    { key: 'polite', label: 'Polite', tagline: 'Warm and friendly. Best for good clients.' },
    { key: 'standard', label: 'Standard', tagline: 'Clear and professional. Works for most clients.' },
    { key: 'firm', label: 'Firm', tagline: "Direct and serious. For when you've been ignored." }
  ];
  const FIELD_IDS = ['clientName', 'yourName', 'amount', 'currency', 'invoiceNumber', 'dueDate', 'clientEmail', 'paymentDetails'];
  const REQUIRED_IDS = ['clientName', 'yourName', 'amount', 'currency', 'invoiceNumber', 'dueDate'];
  const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'NZD'];
  const form = document.getElementById('invoice-form');
  const fields = Object.fromEntries(FIELD_IDS.map((id) => [id, document.getElementById(id)]));
  const tabs = document.getElementById('stage-tabs');
  const timingNote = document.getElementById('timing-note');
  const cards = document.getElementById('tone-cards');
  const actionStatus = document.getElementById('action-status');
  let selectedStage = null;
  let statusTimer = null;

  // Local noon plus setDate works across daylight-saving changes without a one-day shift.
  function localToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  }

  function parseLocalDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(2000, month - 1, day, 12);
    date.setFullYear(year);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function addDays(date, days) {
    const result = new Date(date.getTime());
    result.setHours(12, 0, 0, 0);
    result.setDate(result.getDate() + days);
    return result;
  }

  function addBusinessDays(date, days) {
    let result = addDays(date, 0);
    for (let added = 0; added < days;) {
      result = addDays(result, 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) added += 1;
    }
    return result;
  }

  function localDateValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  }

  function formatShortDate(date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  function compareDays(a, b) {
    return a.getFullYear() - b.getFullYear() || a.getMonth() - b.getMonth() || a.getDate() - b.getDate();
  }

  function currentStage(dueDate, today) {
    if (compareDays(today, dueDate) < 0) return 'before';
    if (compareDays(today, dueDate) === 0) return 'due';
    if (compareDays(today, addDays(dueDate, 7)) < 0) return 'late3';
    if (compareDays(today, addDays(dueDate, 14)) < 0) return 'late7';
    return 'late14';
  }

  function readInput() {
    return Object.fromEntries(FIELD_IDS.map((id) => [id, fields[id].value.trim()]));
  }

  function saveInput() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(readInput())); } catch (_) { /* Storage may be unavailable in private browsing. */ }
  }

  function restoreInput() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { /* Ignore unavailable or malformed storage. */ }
    if (saved && typeof saved === 'object') {
      FIELD_IDS.forEach((id) => {
        if (typeof saved[id] === 'string') fields[id].value = saved[id];
      });
    } else {
      fields.dueDate.value = localDateValue(addDays(localToday(), 7));
    }
  }

  function missingFields(input) {
    return REQUIRED_IDS.filter((id) => {
      if (id === 'amount') return !Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0 || !fields.amount.validity.valid;
      if (id === 'currency') return !CURRENCIES.includes(input.currency);
      if (id === 'dueDate') return !parseLocalDate(input.dueDate);
      if (id === 'invoiceNumber') return !input.invoiceNumber.replace(/^#+\s*/, '').trim();
      return !input[id];
    });
  }

  function valuesFor(input, dueDate, sendDate, today) {
    const amount = Number(input.amount);
    const validAmount = Number.isFinite(amount) && amount > 0 && fields.amount.validity.valid && CURRENCIES.includes(input.currency);
    const invoiceNumber = input.invoiceNumber.replace(/^#+\s*/, '').trim();
    const paymentDetails = input.paymentDetails.trim();
    return {
      clientName: input.clientName || null,
      yourName: input.yourName || null,
      amount: validAmount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: input.currency }).format(amount) : null,
      invoiceNumber: invoiceNumber || null,
      dueDate: dueDate ? formatDate(dueDate) : null,
      dueDateShort: dueDate ? formatShortDate(dueDate) : null,
      replyByDate: sendDate ? formatDate(addBusinessDays(compareDays(sendDate, today) > 0 ? sendDate : today, 5)) : null,
      paymentLine: paymentDetails ? (/^https?:\/\//i.test(paymentDetails) ? `You can pay here: ${paymentDetails}` : `Payment details: ${paymentDetails}`) : ''
    };
  }

  function templateText(template, values) {
    // The payment line sits between two paragraphs; without it they still need a blank line between them.
    return template.replace(/\n\{paymentLine\}\n/g, values.paymentLine ? '\n\n{paymentLine}\n\n' : '\n\n');
  }

  const PLACEHOLDER_LABELS = {
    clientName: 'Client name', yourName: 'Your name', amount: 'Amount due',
    invoiceNumber: 'Invoice number', dueDate: 'Due date', dueDateShort: 'Due date',
    replyByDate: 'Reply date', paymentLine: 'Payment details'
  };

  function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] == null ? `[${PLACEHOLDER_LABELS[key] || key}]` : values[key]);
  }

  function fillDisplay(element, template, values) {
    const pattern = /\{(\w+)\}/g;
    let start = 0;
    for (const match of template.matchAll(pattern)) {
      element.appendChild(document.createTextNode(template.slice(start, match.index)));
      const value = values[match[1]];
      if (value == null) {
        const mark = document.createElement('mark');
        mark.className = 'missing-value';
        mark.textContent = `[${PLACEHOLDER_LABELS[match[1]] || match[1]}]`;
        element.appendChild(mark);
      } else {
        element.appendChild(document.createTextNode(value));
      }
      start = match.index + match[0].length;
    }
    element.appendChild(document.createTextNode(template.slice(start)));
  }

  function showStatus(message, kind) {
    actionStatus.hidden = false;
    actionStatus.textContent = message;
    actionStatus.dataset.kind = kind;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { actionStatus.hidden = true; }, 5000);
  }

  const FIELD_LABELS = {
    clientName: 'Client name', yourName: 'Your name', amount: 'Amount due', currency: 'Currency',
    invoiceNumber: 'Invoice number', dueDate: 'Due date'
  };

  function hasRequiredFields(input) {
    const missing = missingFields(input);
    if (missing.length) {
      const amountHint = missing.includes('amount') && input.amount && fields.amount.validity.stepMismatch
        ? ' Use up to 2 decimal places for Amount due.' : '';
      showStatus(`Fill in or correct these fields: ${missing.map((id) => FIELD_LABELS[id]).join(', ')}.${amountHint}`, 'error');
      // On narrow screens the form sits above the cards, so focusing also scrolls the problem into view.
      fields[missing[0]].focus();
      return false;
    }
    return true;
  }

  // The client email only matters for the mailto link, so copying never depends on it.
  function canOpenEmail(input) {
    if (!hasRequiredFields(input)) return false;
    if (input.clientEmail && !fields.clientEmail.validity.valid) {
      showStatus('Enter a valid client email or leave it blank.', 'error');
      fields.clientEmail.focus();
      return false;
    }
    return true;
  }

  function fallbackCopy(text) {
    const previousFocus = document.activeElement;
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length); // iOS Safari ignores select() on readonly fields.
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    area.remove();
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    return copied;
  }

  function selectForManualCopy(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Shows the exact text in a selected box so a manual copy matches what the button would have copied.
  function showManualCopyBox(container, text) {
    let area = container.querySelector('.manual-copy');
    if (!area) {
      area = document.createElement('textarea');
      area.className = 'manual-copy';
      area.setAttribute('readonly', '');
      area.setAttribute('aria-label', 'Email text to copy manually');
      container.appendChild(area);
    }
    area.value = text;
    area.rows = Math.min(14, text.split('\n').length + 1);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
  }

  async function copyText(text, button, manualTarget, manualLabel = 'email body') {
    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* Try the older browser API below. */ }
    }
    if (!copied) copied = fallbackCopy(text);
    if (copied) {
      const original = button.dataset.originalLabel || button.textContent;
      button.dataset.originalLabel = original;
      button.textContent = 'Copied';
      clearTimeout(button._resetTimer);
      button._resetTimer = setTimeout(() => { button.textContent = original; }, 1500);
      showStatus('Copied to clipboard.', 'success');
    } else {
      const original = button.dataset.originalLabel || button.textContent;
      button.dataset.originalLabel = original;
      button.textContent = 'Copy failed';
      clearTimeout(button._resetTimer);
      button._resetTimer = setTimeout(() => { button.textContent = original; }, 5000);
      if (typeof manualTarget === 'function') manualTarget();
      else if (manualTarget) selectForManualCopy(manualTarget);
      showStatus(`Copy failed. The ${manualLabel} is now selected; press Ctrl+C (or ⌘C) to copy it.`, 'error');
    }
  }

  function mailtoLink(recipient, subject, body) {
    const crlfBody = body.replace(/\r\n|\r|\n/g, '\r\n');
    // Valid addresses may contain ?, & or #, which would otherwise break the link; keep @ readable for mail apps.
    const to = encodeURIComponent(recipient).replace(/%40/g, '@');
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(crlfBody)}`;
  }

  function renderTabs(dueDate, today, activeKey) {
    tabs.replaceChildren();
    STAGES.forEach((stage, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'stage-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(stage.key === selectedStage));
      tab.setAttribute('aria-controls', 'message-panel');
      tab.tabIndex = stage.key === selectedStage ? 0 : -1;
      const label = document.createElement('span');
      label.className = 'stage-label';
      label.textContent = stage.label;
      const date = document.createElement('span');
      date.className = 'stage-date';
      date.textContent = dueDate ? formatShortDate(addDays(dueDate, stage.offset)) : '—';
      tab.append(label, date);
      if (stage.key === activeKey && dueDate) {
        const todayBadge = document.createElement('span');
        todayBadge.className = 'today-badge';
        // "Today" only when the suggested date is today; otherwise it would contradict "Send on {date}" below.
        todayBadge.textContent = compareDays(addDays(dueDate, stage.offset), today) === 0 ? 'Today' : 'Current';
        tab.appendChild(todayBadge);
      }
      // render() rebuilds the tabs, so move focus to the new button or keyboard users lose their place.
      tab.addEventListener('click', () => { selectedStage = stage.key; render(); tabs.children[index].focus(); });
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? STAGES.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + STAGES.length) % STAGES.length;
        selectedStage = STAGES[next].key;
        render();
        tabs.children[next].focus();
      });
      tabs.appendChild(tab);
    });
  }

  function renderTiming(dueDate, today, activeKey, sendDate) {
    timingNote.replaceChildren();
    if (!dueDate) {
      timingNote.classList.remove('warning', 'future');
      timingNote.textContent = 'Add a due date to see the suggested send dates.';
      return;
    }
    const activeIndex = STAGES.findIndex((stage) => stage.key === activeKey);
    const selectedIndex = STAGES.findIndex((stage) => stage.key === selectedStage);
    if (selectedIndex < activeIndex) {
      timingNote.classList.add('warning');
      timingNote.classList.remove('future');
      const message = document.createElement('span');
      message.textContent = `This email no longer fits today's date. Use “${STAGES[activeIndex].label}” instead.`;
      const switchButton = document.createElement('button');
      switchButton.type = 'button';
      switchButton.className = 'switch-button';
      switchButton.textContent = 'Switch';
      switchButton.addEventListener('click', () => { selectedStage = activeKey; render(); });
      timingNote.append(message, switchButton);
    } else if (selectedIndex === activeIndex && compareDays(sendDate, today) <= 0) {
      // Also covers a late start, e.g. "3 days before" opened the day before the due date: still the right email.
      timingNote.classList.remove('warning', 'future');
      timingNote.textContent = compareDays(sendDate, today) === 0
        ? `Send today, ${formatDate(today)}.`
        : `Send today, ${formatDate(today)}. This email still fits, even though the suggested date (${formatDate(sendDate)}) has passed.`;
    } else {
      timingNote.classList.remove('warning');
      timingNote.classList.add('future');
      const main = document.createElement('span');
      main.textContent = `Send on ${formatDate(sendDate)}`;
      const helper = document.createElement('span');
      helper.className = 'timing-helper';
      helper.textContent = selectedIndex === activeIndex
        ? '(it already fits today, or you can schedule it in your email app)'
        : '(you can schedule it in your email app)';
      timingNote.append(main, helper);
    }
    if ((sendDate.getDay() === 0 || sendDate.getDay() === 6) && compareDays(sendDate, today) >= 0) {
      const weekendNote = document.createElement('span');
      weekendNote.className = 'timing-helper weekend-helper';
      weekendNote.textContent = 'The suggested date falls on a weekend; check whether that timing works for your client.';
      timingNote.appendChild(weekendNote);
    }
  }

  function makeAction(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderCards(input, dueDate, today, sendDate) {
    cards.replaceChildren();
    const values = valuesFor(input, dueDate, sendDate, today);
    TONES.forEach((tone) => {
      const template = window.NUDGEPAY_TEMPLATES[selectedStage][tone.key];
      const subjectTemplate = templateText(template.subject, values);
      const bodyTemplate = templateText(template.body, values);
      const subject = interpolate(subjectTemplate, values);
      const body = interpolate(bodyTemplate, values);
      const card = document.createElement('article');
      card.className = `tone-card tone-${tone.key}`;
      const top = document.createElement('div');
      top.className = 'card-top';
      const title = document.createElement('h3');
      title.textContent = tone.label;
      const tagline = document.createElement('p');
      tagline.textContent = tone.tagline;
      top.append(title, tagline);
      const scheduled = document.createElement('p');
      scheduled.className = 'card-send-date';
      scheduled.textContent = sendDate ? `Suggested send date · ${formatDate(sendDate)}` : 'Suggested send date · Add a due date';
      const subjectLabel = document.createElement('span');
      subjectLabel.className = 'email-label';
      subjectLabel.textContent = 'SUBJECT';
      const subjectBox = document.createElement('div');
      subjectBox.className = 'email-subject';
      fillDisplay(subjectBox, subjectTemplate, values);
      const bodyLabel = document.createElement('span');
      bodyLabel.className = 'email-label';
      bodyLabel.textContent = 'BODY';
      const bodyBox = document.createElement('div');
      bodyBox.className = 'email-body';
      fillDisplay(bodyBox, bodyTemplate, values);
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      actions.appendChild(makeAction('Copy email', 'action-button primary-action', (event) => {
        const fullText = `Subject: ${subject}\n\n${body}`;
        if (hasRequiredFields(readInput())) copyText(fullText, event.currentTarget, () => showManualCopyBox(card, fullText), 'full email (with subject)');
      }));
      actions.appendChild(makeAction('Copy body', 'action-button secondary-action', (event) => {
        if (hasRequiredFields(readInput())) copyText(body, event.currentTarget, bodyBox);
      }));
      const mail = document.createElement('a');
      mail.className = 'action-button mail-action';
      mail.textContent = 'Open in email app';
      mail.href = mailtoLink(input.clientEmail, subject, body);
      mail.addEventListener('click', (event) => {
        if (!canOpenEmail(readInput())) { event.preventDefault(); return; }
        // Without a default mail app the click does nothing visible, so point to the copy buttons.
        showStatus('Opening your email app… If nothing happens, use Copy email instead.', 'success');
      });
      actions.appendChild(mail);
      card.append(top, scheduled, subjectLabel, subjectBox, bodyLabel, bodyBox, actions);
      cards.appendChild(card);
    });
  }

  function render() {
    const input = readInput();
    const dueDate = parseLocalDate(input.dueDate);
    const today = localToday();
    const activeKey = dueDate ? currentStage(dueDate, today) : null;
    if (!selectedStage) selectedStage = activeKey || 'before';
    const stage = STAGES.find((item) => item.key === selectedStage);
    const sendDate = dueDate ? addDays(dueDate, stage.offset) : null;
    renderTabs(dueDate, today, activeKey);
    renderTiming(dueDate, today, activeKey, sendDate);
    renderCards(input, dueDate, today, sendDate);
  }

  restoreInput();
  selectedStage = parseLocalDate(fields.dueDate.value) ? currentStage(parseLocalDate(fields.dueDate.value), localToday()) : 'before';
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', (event) => {
    if (event.target === fields.dueDate) {
      const dueDate = parseLocalDate(fields.dueDate.value);
      if (dueDate) selectedStage = currentStage(dueDate, localToday());
    }
    saveInput();
    render();
  });
  form.addEventListener('change', () => { saveInput(); render(); });
  document.getElementById('clear-form').addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Ignore unavailable storage. */ }
    form.reset();
    fields.dueDate.value = localDateValue(addDays(localToday(), 7));
    selectedStage = 'before';
    actionStatus.hidden = true;
    render();
  });
  render();
})();
