# CSV

Client-side CSV handling. Each file is the body of a single ODC client action, reading its inputs
from `$parameters` and writing its outputs back to `$parameters`.

| Script | Direction |
| --- | --- |
| [`csvToJson.js`](csvToJson.js) | CSV text → JSON text (import) |
| [`jsonToCsv.js`](jsonToCsv.js) | JSON text → CSV text (export) |

Both share the same error contract: two outputs, where `ErrorMessage` empty means the result is
usable and `ErrorMessage` filled means the result is empty and the message is for the user. Neither
throws.

## `csvToJson.js` — CSV text → JSON text

Parses a CSV string into a JSON **array of objects**, one object per data row, keyed by the column
names of the header row. Pure text-in / text-out: no DOM, no network, no dependencies — the output
is meant to be fed straight into ODC's **JSON Deserialize** against a structure list.

```
NumeroDeclaracao;NIF;Quantidade          [{"NumeroDeclaracao":"25PT000123456789A1",
25PT000123456789A1;500000000;150    ->     "NIF":"500000000","Quantidade":"150"}]
```

### Client action

| Parameter | Direction | Type | Description |
| --- | --- | --- | --- |
| `CSV` | Input | Text | The raw CSV. |
| `JSON` | Output | Text | The JSON array, or `[]` if the parse failed. |
| `ErrorMessage` | Output | Text | Empty on success; otherwise a message to show the user. |

No configuration: the delimiter is detected, the first row is always the header, and every value
comes out as a JSON string.

### Error handling

The contract is a single check:

> **`ErrorMessage` empty** → `JSON` holds at least one record and is safe to deserialize.
> **`ErrorMessage` filled** → `JSON` is `[]`; show the message.

The action never throws, so it needs no exception handler around it — test `ErrorMessage` instead.
There is no partial success: the script never returns a half-parsed list next to an error, because a
JSON array that silently lost rows is worse than a refusal.

| Condition | `ErrorMessage` |
| --- | --- |
| `CSV` empty, blank, or `NullTextIdentifier` | `The CSV is empty.` |
| Nothing but blank/separator-only lines | `The CSV has no header row.` |
| Header present, zero data rows | `The CSV has a header row but no data rows.` |
| A `"` is opened and never closed | `Unterminated quoted value starting on line <N>. …` |
| A bug in the script itself | `Could not read the CSV: <detail>` (plus a `console.error` with the stack) |

`<N>` is the physical line the quote opened on, counted through quoted newlines, so it matches what
the user sees in Excel or a text editor. This case is worth failing on rather than salvaging: one
stray `"` swallows every line after it, which would otherwise look like a clean parse that quietly
dropped most of the file.

Note what is **not** an error — these are normal and parse without a message: ragged rows, duplicate
or blank column names, blank lines anywhere, a single-column file, and a trailing newline.

### Parsing rules (RFC 4180)

- **Delimiter** — sniffed from the first record: `,` `;` tab `|`, whichever occurs most **outside
  quotes**. That is what makes `city;country` win over the comma inside `"Lisboa, PT"`.
- **Quoted fields** — `"..."` may contain the delimiter, `\n`, `\r`, and `""` for a literal `"`.
- **Line endings** — CRLF, LF and lone CR all end a record.
- **Blank lines** are skipped, wherever they appear; a trailing newline does not produce an empty row.
- **UTF-8 BOM** is stripped, so the first column name is not silently prefixed with an invisible
  character.
- **Short rows** get `""` for the missing columns; **long rows** keep the surplus under `Column<N>`
  (N is 1-based over the whole row) rather than dropping data.
- **Header names** are trimmed and forced to be usable JSON keys: an empty name becomes `Column<N>`,
  a repeated name gets `_2`, `_3`, … appended.
- An **unterminated quote** is rejected with a line number — see *Error handling* above.

### Why every value stays text

Deserializing `"150"` into an Integer or Decimal attribute works in ODC; deserializing `150` into a
Text attribute does not. Text is also the only correct reading of a Portuguese-locale export, where
`42,5` is a decimal and `007` must keep its leading zero. Convert to numbers in the structure, not
in the parser.

### Wiring

Call it from any client action or screen event — it does not touch the DOM, so it is safe on
`OnInitialize`. The usual chain after an upload:

1. **BinaryToText** (or `FileToText`) on the uploaded file → CSV text.
2. **CsvToJson** → `JSON` + `ErrorMessage`.
3. **If** `ErrorMessage <> ""` → show it (Feedback Message / validation) and stop.
4. **JSON Deserialize** with a `List` of your structure as the data type → typed records.

Keep the structure's attribute names identical to the CSV column names; that mapping is what the
output is built to satisfy.

## `jsonToCsv.js` — JSON text → CSV text

Writes a JSON array of objects out as CSV: one header row from the record properties, then one row
per record. The inverse of `csvToJson.js`, and the second half of an export — feed it the output of
ODC's **JSON Serialize** over a list.

```
[{"NumeroDeclaracao":"25PT000123456789A1",          NumeroDeclaracao,NIF,Quantidade
  "NIF":"500000000","Quantidade":"150"}]      ->    25PT000123456789A1,500000000,150
```

### Client action

| Parameter | Direction | Type | Description |
| --- | --- | --- | --- |
| `JSON` | Input | Text | A JSON array of objects. A single object is accepted too, and becomes a one-row CSV. |
| `CSV` | Output | Text | The CSV text, or `""` if conversion failed. |
| `ErrorMessage` | Output | Text | Empty on success; otherwise a message to show the user. |

### Writing rules (RFC 4180)

- **Columns** are the union of every record's properties, in first-seen order — a record carrying a
  property the first one lacks still gets a column instead of being silently truncated. Records
  missing a column get an empty field, so the output is always rectangular.
- **Quoting** is applied only where required: a field containing the delimiter, a `"`, or a line
  break is wrapped in quotes, and inner quotes are doubled. Everything else is written bare.
- **Line endings** are CRLF, which is what Excel expects.
- **Values** — strings as-is; numbers and booleans as their plain text; `null`, `undefined` and
  missing properties as an empty field; a nested object or array as its JSON, so nothing is lost to
  `[object Object]`. `Infinity`/`NaN` (not valid JSON but reachable via `1e999`) become empty.
- **Header cells** are quoted by the same rule as values, so a property name containing a comma
  survives.
- There is **no trailing newline** — the last record ends the string.

### Delimiter

`DELIMITER` at the top of the script is `,` (RFC 4180). Change it to `";"` when the file is destined
for a Portuguese-locale Excel, which opens comma-separated files as a single column. Round-tripping
works either way, because `csvToJson.js` sniffs the delimiter rather than assuming one.

### Error handling

Same contract as `csvToJson.js`: `ErrorMessage` empty → `CSV` is complete; `ErrorMessage` filled →
`CSV` is `""`.

| Condition | `ErrorMessage` |
| --- | --- |
| `JSON` empty or blank | `The JSON is empty.` |
| Not parseable | `The JSON is not valid: <detail>` |
| Parses to a scalar or `null` | `The JSON must be an array of objects, but it is a number.` |
| An item is not an object | `Every item in the JSON must be an object, but item 2 is null.` |
| `[]` | `The JSON has no records.` |
| Records with no properties (`[{}]`) | `The JSON records have no properties.` |
| A bug in the script itself | `Could not write the CSV: <detail>` (plus a `console.error`) |

Item numbers in messages are 1-based, matching how a user counts records.

### Wiring

The usual export chain:

1. **JSON Serialize** over your list → JSON text.
2. **JsonToCsv** → `CSV` + `ErrorMessage`.
3. **If** `ErrorMessage <> ""` → show it and stop.
4. **TextToBinary** → `Download` (set the filename's extension to `.csv`).

### Round-tripping with `csvToJson.js`

`CSV → JSON → CSV → JSON` returns the same JSON, with one documented exception: a **ragged** source
file becomes rectangular, because CSV cannot express "this row has no 4th field" as distinct from
"the 4th field is empty". Converting again after that changes nothing — the pair reaches a fixed
point. Values are text on both sides, so no numeric or date reformatting happens in either direction.
