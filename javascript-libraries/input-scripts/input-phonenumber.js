(function () {
  "use strict";

  /* ---- Config ------------------------------------------------------------- */

  // What the value is allowed to be, tested over the WHOLE value:
  // an optional leading "+" (country code) followed by digits only.
  // No spaces, parentheses, dots or dashes.
  var VALID_VALUE = /^\+?\d*$/;

  // Same rule as a per-character strip, used to salvage pasted text.
  var DISALLOWED_CHARS = /[^\d+]/g;

  // The input may not be rendered yet when this action runs (e.g. bound to
  // OnInitialize instead of OnReady), so retry for a short while before warning.
  var LOOKUP_RETRIES = 5;
  var LOOKUP_DELAY_MS = 100;

  /* ---- Element resolution ------------------------------------------------- */

  var inputId = $parameters.InputId;

  // The Id may point at the <input> itself or at a wrapper around it
  // (Input widgets inside a container / custom pattern).
  function resolveInput(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return el;
    return el.querySelector("input, textarea");
  }

  function start(attempt) {
    var input = resolveInput(inputId);

    if (!input) {
      if (attempt < LOOKUP_RETRIES) {
        setTimeout(function () { start(attempt + 1); }, LOOKUP_DELAY_MS);
      } else {
        console.warn("InputPhoneNumber: input '" + inputId + "' not found.");
      }
      return;
    }

    attach(input);
  }

  /* ---- Value helpers ------------------------------------------------------ */

  // Value the input would end up with if `text` replaced the current selection.
  function prospectiveValue(el, text) {
    var value = el.value;
    var start = el.selectionStart;
    var end = el.selectionEnd;

    // selectionStart/End are null on input types that don't support selection.
    if (start === null || end === null) { start = value.length; end = start; }

    return value.slice(0, start) + text + value.slice(end);
  }

  // Longest acceptable version of `text` for the current caret position:
  // drop every disallowed character, then drop stray "+" signs if the "+" is
  // not landing at the start of the value.
  function sanitizeInsertion(el, text) {
    var kept = String(text).replace(DISALLOWED_CHARS, "");
    if (VALID_VALUE.test(prospectiveValue(el, kept))) return kept;

    kept = kept.replace(/\+/g, "");
    return VALID_VALUE.test(prospectiveValue(el, kept)) ? kept : "";
  }

  // Write a value in a way React (which ODC renders with) notices: go through
  // the native setter so React's value tracker is bypassed, then fire a
  // bubbling "input" event so the bound variable updates.
  function setValue(el, value) {
    var desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
    if (desc && desc.set) { desc.set.call(el, value); } else { el.value = value; }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* ---- Handlers ----------------------------------------------------------- */

  // beforeinput is the single choke point for typing, pasting, dropping and
  // IME commits: cancelling it stops the character from ever reaching the value.
  function onBeforeInput(event) {
    var data = event.data;

    // Deletions, undo/redo and composition starts carry no data — always allow.
    if (data === null || data === undefined || data === "") return;

    var el = event.target;
    if (VALID_VALUE.test(prospectiveValue(el, data))) return;

    event.preventDefault();

    // Typing an invalid character is simply swallowed. Pasted/dropped text is
    // usually mostly valid, so insert the sanitized remainder instead of
    // discarding the whole payload.
    var isBulk = event.inputType === "insertFromPaste" ||
                 event.inputType === "insertFromDrop" ||
                 data.length > 1;
    if (!isBulk) return;

    var kept = sanitizeInsertion(el, data);
    if (kept === "") return;

    // execCommand keeps the caret position and the undo stack intact; fall back
    // to a manual splice when it is unavailable.
    var start = el.selectionStart;
    if (!document.execCommand || !document.execCommand("insertText", false, kept)) {
      var next = prospectiveValue(el, kept);
      setValue(el, next);
      if (start !== null) {
        var caret = start + kept.length;
        try { el.setSelectionRange(caret, caret); } catch (e) { /* unsupported type */ }
      }
    }
  }

  // Safety net for input paths that bypass beforeinput (browser autofill,
  // speech input, programmatic writes): strip whatever slipped through.
  function onInput(event) {
    var el = event.target;
    if (VALID_VALUE.test(el.value)) return;

    var cleaned = el.value.replace(DISALLOWED_CHARS, "");
    // Keep at most one "+", and only in front.
    var leadingPlus = cleaned.charAt(0) === "+";
    cleaned = (leadingPlus ? "+" : "") + cleaned.replace(/\+/g, "");

    var caret = el.selectionStart;
    setValue(el, cleaned);
    if (caret !== null) {
      var pos = Math.min(caret, cleaned.length);
      try { el.setSelectionRange(pos, pos); } catch (e) { /* unsupported type */ }
    }
  }

  /* ---- Wiring ------------------------------------------------------------- */

  function attach(input) {
    // The client action can run again on every re-render; bind only once.
    if (input.dataset.phoneFilterAttached === "true") return;
    input.dataset.phoneFilterAttached = "true";

    // Numeric keypad on mobile, and let password managers/browsers autofill it.
    if (!input.getAttribute("inputmode")) input.setAttribute("inputmode", "tel");
    if (!input.getAttribute("autocomplete")) input.setAttribute("autocomplete", "tel");

    input.addEventListener("beforeinput", onBeforeInput);
    input.addEventListener("input", onInput);

    // Clean an initial value that was set outside the widget.
    if (input.value && !VALID_VALUE.test(input.value)) {
      onInput({ target: input });
    }
  }

  if (!inputId) {
    console.warn("InputPhoneNumber: InputId is empty.");
    return;
  }

  start(0);
})();
