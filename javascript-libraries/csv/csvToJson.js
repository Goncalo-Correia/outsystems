(function () {
  "use strict";

  // In: the raw CSV text.  Out: a JSON array of objects, one per data row,
  // keyed by the header row. Every value stays text.
  var csv = $parameters.CSV;

  // Separators tried, in order, when sniffing the first record.
  var CANDIDATES = [",", ";", "\t", "|"];

  /* ---- Errors ------------------------------------------------------------- */

  // Anything thrown as a CsvError is a problem with the *file* and its message
  // is meant to be shown to the user. Anything else is a bug in this script and
  // gets reported as such — the two must not read alike in ErrorMessage.
  function CsvError(message) {
    this.message = message;
  }

  function fail(message) {
    throw new CsvError(message);
  }

  /* ---- Delimiter sniffing ------------------------------------------------- */

  // Count a candidate only outside quoted sections, and only over the first
  // record, so a comma inside "Lisboa, PT" does not win over a real ";".
  function countInFirstRecord(text, candidate) {
    var count = 0;
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (inQuotes) {
        if (ch !== '"') continue;
        // "" inside a quoted field is an escaped quote, not the end of it.
        if (text.charAt(i + 1) === '"') { i++; continue; }
        inQuotes = false;
        continue;
      }

      if (ch === '"') { inQuotes = true; continue; }
      if (ch === "\n" || ch === "\r") break;
      if (ch === candidate) count++;
    }

    return count;
  }

  function sniffDelimiter(text) {
    var best = CANDIDATES[0];
    var bestCount = 0;

    for (var i = 0; i < CANDIDATES.length; i++) {
      var count = countInFirstRecord(text, CANDIDATES[i]);
      if (count > bestCount) { bestCount = count; best = CANDIDATES[i]; }
    }

    // No separator at all: single-column file, any candidate behaves the same.
    return best;
  }

  /* ---- Parsing ------------------------------------------------------------ */

  // RFC 4180 state machine: handles quoted fields, "" escapes, separators and
  // newlines inside quotes, and CRLF / LF / CR line endings. Returns a list of
  // rows, each row a list of raw field strings.
  function parseRows(text, sep) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    // A quoted field counts as content even when empty, which is what tells a
    // real `""` row apart from the empty tail left by a trailing newline.
    var wasQuoted = false;
    // Physical lines, counted through quoted newlines too, so an error can name
    // the line the user sees in their editor.
    var line = 1;
    var quoteStartLine = 0;

    function endField() {
      row.push(field);
      field = "";
      wasQuoted = false;
    }

    function endRow() {
      endField();
      rows.push(row);
      row = [];
    }

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);

      if (inQuotes) {
        if (ch === "\n") line++;
        if (ch === "\r" && text.charAt(i + 1) !== "\n") line++;
        if (ch !== '"') { field += ch; continue; }
        if (text.charAt(i + 1) === '"') { field += '"'; i++; continue; }
        inQuotes = false;
        continue;
      }

      if (ch === '"' && field === "") {
        inQuotes = true;
        wasQuoted = true;
        quoteStartLine = line;
        continue;
      }
      if (ch === sep) { endField(); continue; }

      if (ch === "\r") {
        // Consume the LF of a CRLF pair as part of the same line break.
        if (text.charAt(i + 1) === "\n") i++;
        line++;
        endRow();
        continue;
      }

      if (ch === "\n") { line++; endRow(); continue; }

      field += ch;
    }

    // An unclosed quote swallows everything after it: without this check a file
    // with one stray `"` collapses into a single record and looks like a
    // successful parse that lost most of its rows.
    if (inQuotes) {
      fail("Unterminated quoted value starting on line " + quoteStartLine +
           ". Check that every \" in the file is closed, and that quotes inside " +
           "a value are doubled (\"\").");
    }

    // A trailing newline leaves an empty pending row — don't emit it.
    if (field !== "" || wasQuoted || row.length > 0) endRow();

    return rows;
  }

  // A line of only empty fields (blank line, or ";;;" padding) carries no record.
  function isBlankRow(cells) {
    for (var i = 0; i < cells.length; i++) {
      if (cells[i] !== "") return false;
    }
    return true;
  }

  /* ---- Shaping ------------------------------------------------------------ */

  // Column names must be unique and non-empty to survive as JSON keys:
  // "" becomes Column<N>, a repeat becomes <name>_2, <name>_3, ...
  function buildHeader(cells) {
    var names = [];
    var seen = {};

    for (var i = 0; i < cells.length; i++) {
      var name = String(cells[i]).trim();
      if (name === "") name = "Column" + (i + 1);

      var key = "k_" + name;
      if (Object.prototype.hasOwnProperty.call(seen, key)) {
        seen[key]++;
        name = name + "_" + seen[key];
      } else {
        seen[key] = 1;
      }

      names.push(name);
    }

    return names;
  }

  function toRecord(cells, names) {
    var record = {};

    for (var i = 0; i < names.length; i++) {
      // Short row: the missing columns are present but empty.
      record[names[i]] = i < cells.length ? cells[i] : "";
    }

    // Long row: keep the surplus rather than silently dropping data.
    for (var j = names.length; j < cells.length; j++) {
      record["Column" + (j + 1)] = cells[j];
    }

    return record;
  }

  /* ---- Run ---------------------------------------------------------------- */

  function run(text) {
    text = String(text);

    // Drop a UTF-8 BOM so it never ends up glued to the first column name.
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    var rows = parseRows(text, sniffDelimiter(text));

    // Leading blank lines before the header are noise.
    while (rows.length > 0 && isBlankRow(rows[0])) rows.shift();
    if (rows.length === 0) fail("The CSV has no header row.");

    var names = buildHeader(rows[0]);
    var records = [];

    for (var r = 1; r < rows.length; r++) {
      if (isBlankRow(rows[r])) continue;
      records.push(toRecord(rows[r], names));
    }

    if (records.length === 0) {
      fail("The CSV has a header row but no data rows.");
    }

    return records;
  }

  /* ---- Outputs ------------------------------------------------------------ */

  // Both outputs are always written: ErrorMessage empty means JSON is safe to
  // deserialize, ErrorMessage filled means JSON is "[]" and the text is meant
  // for the user. A malformed file must not throw out of the client action.
  try {
    if (csv === null || csv === undefined || String(csv).trim() === "") {
      fail("The CSV is empty.");
    }

    $parameters.JSON = JSON.stringify(run(csv));
    $parameters.ErrorMessage = "";
  } catch (e) {
    $parameters.JSON = "[]";

    if (e instanceof CsvError) {
      $parameters.ErrorMessage = e.message;
    } else {
      // Not a problem with the file — surface it as such and log the detail for
      // the browser console, where the stack is still available.
      console.error("CsvToJson: unexpected error", e);
      $parameters.ErrorMessage = "Could not read the CSV: " +
        (e && e.message ? e.message : String(e));
    }
  }
})();
