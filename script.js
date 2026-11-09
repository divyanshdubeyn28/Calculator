(function () {
  'use strict';

  const MAX_DIGITS = 15;
  const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  let current = '0';
  let previous = '';
  let operator = null;
  let resetNext = false;
  let expression = '';
  let error = false;

  const resultEl = document.getElementById('result');
  const exprEl = document.getElementById('expression');

  function clean(n) { return parseFloat(n.toPrecision(12)); }

  function numToString(n) {
    if (n !== 0 && (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-9)) {
      return n.toExponential(6).replace(/\.?0+e/, 'e').replace('e+', 'e');
    }
    return String(n);
  }

  function format(str) {
    if (str.includes('e') || str === '') return str;
    const neg = str.startsWith('-');
    const [int, dec] = str.replace('-', '').split('.');
    const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + withCommas + (dec !== undefined ? '.' + dec : '');
  }

  function updateDisplay() {
    const text = error ? current : format(current);
    resultEl.textContent = text;
    exprEl.textContent = expression;
    resultEl.className = 'result' + (error ? ' error' :
      text.length > 16 ? ' small' : text.length > 11 ? ' medium' : '');
    document.querySelectorAll('.btn.op').forEach(b =>
      b.classList.toggle('active', !error && b.dataset.op === operator && resetNext));
  }

  function showError(msg) {
    current = msg; previous = ''; operator = null; expression = '';
    resetNext = false; error = true; updateDisplay();
  }

  function clearAll() {
    current = '0'; previous = ''; operator = null;
    resetNext = false; expression = ''; error = false; updateDisplay();
  }

  function guard() { if (error) clearAll(); }

  function appendDigit(d) {
    guard();
    if (resetNext) { current = d; resetNext = false; if (!operator) expression = ''; }
    else if (current === '0') current = d;
    else if (current === '-0') current = '-' + d;
    else if (current.replace(/[-.]/g, '').length < MAX_DIGITS) current += d;
    updateDisplay();
  }

  function appendDecimal() {
    guard();
    if (resetNext) { current = '0.'; resetNext = false; if (!operator) expression = ''; }
    else if (!current.includes('.')) current += '.';
    updateDisplay();
  }

  function calculate() {
    const a = parseFloat(previous), b = parseFloat(current);
    if (isNaN(a) || isNaN(b)) return null;
    switch (operator) {
      case '+': return clean(a + b);
      case '-': return clean(a - b);
      case '*': return clean(a * b);
      case '/': return b === 0 ? null : clean(a / b);
      default: return b;
    }
  }

  function chooseOperator(op) {
    guard();
    if (operator && !resetNext) {
      const r = calculate();
      if (r === null) return showError(parseFloat(current) === 0 && operator === '/' ? "Can't divide by zero" : 'Error');
      current = numToString(r);
    }
    previous = current; operator = op; resetNext = true;
    expression = format(previous) + ' ' + SYMBOLS[op];
    updateDisplay();
  }

  function equals() {
    if (error || !operator) return;
    if (resetNext && previous === '') return;
    
    const currentBeforeCalc = current;
    const r = calculate();
    if (r === null) return showError("Can't divide by zero");
    
    expression = format(previous) + ' ' + SYMBOLS[operator] + ' ' + format(currentBeforeCalc) + ' =';
    current = numToString(r); 
    previous = ''; 
    operator = null; 
    resetNext = true;
    updateDisplay();
  }

  function percent() {
    guard();
    const c = parseFloat(current);
    const v = operator && previous !== '' ? clean(parseFloat(previous) * c / 100) : clean(c / 100);
    current = numToString(v); resetNext = false;
    updateDisplay();
  }

  function toggleSign() {
    guard();
    if (resetNext && operator) { current = '-0'; resetNext = false; }
    else if (current === '0') return;
    else current = current.startsWith('-') ? current.slice(1) : '-' + current;
    updateDisplay();
  }

  function deleteLast() {
    if (error) return clearAll();
    if (resetNext) return;
    current = current.slice(0, -1);
    if (current === '' || current === '-') current = '0';
    updateDisplay();
  }

  document.querySelector('.keys').addEventListener('click', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    if (b.dataset.num !== undefined) appendDigit(b.dataset.num);
    else if (b.dataset.op) chooseOperator(b.dataset.op);
    else switch (b.dataset.action) {
      case 'clear': clearAll(); break;
      case 'delete': deleteLast(); break;
      case 'percent': percent(); break;
      case 'sign': toggleSign(); break;
      case 'decimal': appendDecimal(); break;
      case 'equals': equals(); break;
    }
  });

  function flash(selector) {
    const b = document.querySelector(selector); if (!b) return;
    b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 120);
  }

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { appendDigit(k); flash(`[data-num="${k}"]`); }
    else if ('+-*/'.includes(k) && k.length === 1) { e.preventDefault(); chooseOperator(k); flash(`[data-op="${k}"]`); }
    else if (k === '.' || k === ',') { appendDecimal(); flash('[data-action="decimal"]'); }
    else if (k === '%') { percent(); flash('[data-action="percent"]'); }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); flash('[data-action="equals"]'); }
    else if (k === 'Backspace') { deleteLast(); flash('[data-action="delete"]'); }
    else if (k === 'Escape') { clearAll(); flash('[data-action="clear"]'); }
  });

  updateDisplay();
})();