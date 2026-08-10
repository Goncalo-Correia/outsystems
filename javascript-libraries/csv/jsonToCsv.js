(function () {
  "use strict";

  // In: a JSON array of objects.  Out: CSV text — one header row built from the
  // record properties, then one row per record. The inverse of csvToJson.js.
  var json = $parameters.JSON;

  /* ---- Config ------------------------------------------------------------- */

  // Field separator. RFC 4180 says comma; switch to ";" if the file is destined
  // for a Portuguese-locale Excel, which reads comma-separated files as a single
  // column. csvToJson.js sniffs the separator, so round-tripping works either way.
  var DELIMITER = ",";

  // RFC 4180 record separator. CRLF is what Excel expects.
  var NEWLINE = "\r\n";

  /* ---- Errors ------------------------------------------------------------- */

  // Anything thrown as a JsonError is a problem with the *input* and its message
  // is meant to be shown to the user. Anything else is a bug in this script and
  // gets reported as such — the two must not read alike in ErrorMessage.
  function JsonError(message) {
    this.message = message;
  }

  function fail(message) {
    throw new JsonError(message);
  }

  // "a string" / "a number" / "an array" — for messages that name what was found
  // where an object was expected.
  function describe(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "an array";

    var type = typeof value;
    if (type === "number") return "a number";
    if (type === "string") return "a string";
    if (type === "boolean") return "a boolean";
    return "a " + type;
  }

  /* ---- Columns ------------------------------------------------------------ */

  // The union of every record's own properties, in first-seen order: a record
  // holding a property the first one lacks still gets a column instead of being
  // silently truncated.
  function collectColumns(records) {
    var names = [];
    var seen = {};

    for (var i = 0; i < records.length; i++) {
      for (var key in records[i]) {
        if (!Object.prototype.hasOwnProperty.call(records[i], key)) continue;

        var marker = "k_" + key;
        if (Object.prototype.hasOwnProperty.call(seen, marker)) continue;

        seen[marker] = true;
        names.push(key);
      }
    }

    return names;
  }

  /* ---- Values ------------------------------------------------------------- */

  // JSON scalars become their plain text; a missing or null property becomes an
  // empty field; a nested object or array is kept as JSON rather than dropped or
  // rendered as "[object Object]".
  function toText(value) {
    if (value === null || value === undefined) return "";

    var type = typeof value;
    if (type === "string") return value;
    if (type === "number") return isFinite(value) ? String(value) : "";
    if (type === "boolean") return value ? "true" : "false";

    return JSON.stringify(value);
  }

  // RFC 4180: quote a field only when it has to be quoted — because it contains
  // the separator, a quote, or a line break — and double any quote inside it.
  function escapeField(text) {
    var mustQuote =
      text.indexOf(DELIMITER) > -1 ||
      text.indexOf('"') > -1 ||
      text.indexOf("\n") > -1 ||
      text.indexOf("\r") > -1;

    if (!mustQuote) return text;
    return '"' + text.split('"').join('""') + '"';
  }

  function buildRow(cells) {
    var out = [];
    for (var i = 0; i < cells.length; i++) out.push(escapeField(cells[i]));
    return out.join(DELIMITER);
  }

  /* ---- Run ---------------------------------------------------------------- */

  function parse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      fail("The JSON is not valid: " + (e && e.message ? e.message : String(e)));
    }
  }

  // Accepts an array of objects, and — as a convenience — a single object, which
  // becomes a one-row CSV.
  function toRecords(data) {
    if (data === null || data === undefined) {
      fail("The JSON must be an array of objects, but it is null.");
    }

    if (!Array.isArray(data)) {
      if (typeof data !== "object") {
        fail("The JSON must be an array of objects, but it is " + describe(data) + ".");
      }
      return [data];
    }

    if (data.length === 0) fail("The JSON has no records.");

    for (var i = 0; i < data.length; i++) {
      if (data[i] === null || typeof data[i] !== "object" || Array.isArray(data[i])) {
        fail("Every item in the JSON must be an object, but item " + (i + 1) +
             " is " + describe(data[i]) + ".");
      }
    }

    return data;
  }

  function run(text) {
    var records = toRecords(parse(String(text)));
    var columns = collectColumns(records);

    if (columns.length === 0) fail("The JSON records have no properties.");

    var lines = [buildRow(columns)];

    for (var r = 0; r < records.length; r++) {
      var cells = [];
      for (var c = 0; c < columns.length; c++) {
        cells.push(toText(records[r][columns[c]]));
      }
      lines.push(buildRow(cells));
    }

    return lines.join(NEWLINE);
  }

  /* ---- Outputs ------------------------------------------------------------ */

  // Both outputs are always written: ErrorMessage empty means CSV is complete,
  // ErrorMessage filled means CSV is "" and the text is meant for the user.
  // Bad input must not throw out of the client action.
  try {
    if (json === null || json === undefined || String(json).trim() === "") {
      fail("The JSON is empty.");
    }

    $parameters.CSV = run(json);
    $parameters.ErrorMessage = "";
  } catch (e) {
    $parameters.CSV = "";

    if (e instanceof JsonError) {
      $parameters.ErrorMessage = e.message;
    } else {
      // Not a problem with the input — surface it as such and log the detail for
      // the browser console, where the stack is still available.
      console.error("JsonToCsv: unexpected error", e);
      $parameters.ErrorMessage = "Could not write the CSV: " +
        (e && e.message ? e.message : String(e));
    }
  }
})();
