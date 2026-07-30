# NY Session ATR Levels — Tradovate custom indicator

Draws 21 horizontal levels for each New York regular trading session:

- **Center** line anchored to the **open of the first NY-session candle** (09:30 ET).
- **10 lines above** and **10 lines below**, each spaced by **1× ATR**.
- Levels are drawn **only from NY open (09:30 ET) to NY close (16:00 ET)**; outside the session the plots return nothing so the lines break.
- Re-maps on **every candle close** (Tradovate calls `map()` per closed bar) and **re-anchors automatically** at the next NY open.

## Install

1. In Tradovate, open **Chart → Indicators → gear icon → Add Indicator / Custom Indicators** (the code editor).
2. Create a new indicator and **paste the entire contents of `nySessionAtrLevels.js`**.
3. Save. It appears in the indicator list as **"NY Session ATR Levels"** under the **Custom** tag.
4. Add it to a chart. Works best on **intraday timeframes** (1m–15m) so the 09:30 open bar is captured precisely.

## Parameters

- **atrPeriod** (default `14`) — Wilder's ATR lookback used for the line spacing.

## Behavior notes / assumptions

- **Session window** is the equity RTH window **09:30–16:00 America/New_York**, DST-aware (computed without `Intl`, so it works in Tradovate's sandbox). To use a different window, edit `SESSION_OPEN_MIN` / `SESSION_CLOSE_MIN` at the top of the file.
- **Flat lines by default.** Both the center price and the ATR spacing are captured on the session-open bar and held constant for the whole session, so all 21 lines are truly horizontal. Set `DYNAMIC_ATR = true` at the top of the file to recompute the spacing on every candle instead (lines will then step as ATR changes).
- **Opening candle** = the first bar whose ET timestamp is at/after 09:30. On a timeframe that doesn't land on 09:30 exactly (e.g. 5m starting 09:31), the first in-session bar is used.
- **Colors** are set in `schemeStyles.dark` (center = amber solid, ups = teal dashed, downs = red dashed) and can also be changed per-plot in the indicator's UI settings. If Tradovate rejects the `schemeStyles`/`lineStyle` field on your build, delete that block — the indicator still works and colors remain editable in the UI.

## Files

- `nySessionAtrLevels.js` — the indicator (single file; paste this into Tradovate).
