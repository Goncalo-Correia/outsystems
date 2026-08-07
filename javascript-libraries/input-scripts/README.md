# Input Scripts

Small client-side scripts that constrain what a user can type into an ODC Input widget. Each script is the body of a single client action and reads its inputs from `$parameters`.

## `input-phonenumber.js` — phone-number-only input

Restricts an input to an optional leading `+` followed by digits — nothing else.

| Character | Notes |
| --- | --- |
| `+` | only as the **first** character (country code) |
| `0`–`9` | digits |

Everything else is blocked: letters, spaces, parentheses, dots, dashes and every other symbol. `+351912345678` is accepted; `+351 (21) 123-456` is not.

### Client action

| Input parameter | Type | Description |
| --- | --- | --- |
| `InputId` | Text | Id of the Input widget to filter — bind it to the widget's `.Id`. May also be the Id of a container wrapping the input; the script then filters the first `input`/`textarea` inside it. |

Run the action on the screen's / block's **`OnReady`** (the input must already be rendered). If it runs earlier, the script retries the lookup for ~500 ms before giving up with a `console.warn`.

### Behaviour

- **Typing** an invalid character is swallowed — the caret does not move and the bound variable never sees it.
- **Pasting or dropping** text keeps the valid part instead of rejecting the whole payload, so a formatted number pasted from elsewhere still lands: `+351 (21) 123-456.7` becomes `+351211234567`.
- **Deleting, undo/redo and caret movement** are untouched.
- **Autofill / speech input / programmatic writes** are cleaned by a second pass on `input`, and the cleaned value is written through the native setter so ODC's React binding picks it up.
- The input gets `inputmode="tel"` (numeric keypad on mobile) and `autocomplete="tel"`, unless it already declares them.
- Binding is idempotent — re-running the action on a re-render does not stack handlers.

### Changing the allowed set

Two constants at the top of the script define the rule, and both paths (typing and paste) follow them:

- `VALID_VALUE` — `/^\+?\d*$/`, tested against the **whole** prospective value. Testing the whole value rather than single characters is what makes the "`+` only in front" rule possible.
- `DISALLOWED_CHARS` — `/[^\d+]/g`, the same rule as a per-character strip, used to salvage pasted text.

To allow separators again (spaces, `(` `)`, `-`, `.`), widen both: `/^\+?[\d\s().-]*$/` and `/[^\d\s+().-]/g`.
