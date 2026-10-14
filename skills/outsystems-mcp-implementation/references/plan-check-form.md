# Plan check form markup

Markup for the `widget_code` of `mcp__visualize__show_widget` (elicitation shell). It renders inline in the conversation. Never save it as an `.html` file or publish it as an Artifact.

How it works:

- One `.elicit-group` per plan step. `data-name` = the row ID (`P01`, `P02`, …), so the payload reads `P01: Yes`, `P02: No`, `P02 (other): <reason>`.
- The "No" pill carries `data-other`, so selecting it reveals the paired `.elicit-other` reason box.
- Tag badge next to the ID: Approved = `var(--bg-success)` / `var(--text-success)`; Rejected = `var(--bg-danger)` / `var(--text-danger)`. Never pre-select a pill from the tag.
- Under the step text: the reason in danger colour (Rejected), or the evidence (Approved), plus "Verify at runtime." when it applies, then the round status.
- Rows fixed in this round use the yellow style shown on P02: background `var(--bg-warning)`, border `var(--border-warning)` and a "Fixed in round N" note with the user's reason and what was done.
- The header SVG is fixed chrome from the elicitation guide: copy it byte-for-byte.
- Footer: keep the Skip button (required by the shell); label the submit button "Submit plan check".
- The widget rules forbid HTML comments: don't add any.

```html
<h2 class="sr-only">Implementation plan check listing each plan step with Claude's assessment and a Yes or No answer with a reason when No.</h2>
<form class="elicit">
  <div class="elicit-header">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M11.586 2a1.5 1.5 0 0 1 1.06.44l2.914 2.914a1.5 1.5 0 0 1 .44 1.06V16.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.492-1.347L4 16.5v-13A1.5 1.5 0 0 1 5.5 2zM5.5 3a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h-2.5A1.5 1.5 0 0 1 11 5.5V3zm7.04 10.304a.5.5 0 0 1 .92.392c-.295.69-.871 1.304-1.66 1.304-.487 0-.892-.234-1.2-.574-.309.34-.713.574-1.2.574-.486 0-.892-.233-1.2-.574-.31.34-.714.574-1.2.574a.5.5 0 0 1 0-1c.212 0 .52-.18.74-.696l.034-.067a.5.5 0 0 1 .886.067c.221.516.528.696.74.696.213 0 .52-.18.74-.696l.035-.067a.5.5 0 0 1 .885.067c.22.516.527.696.74.696s.519-.18.74-.696m0-4a.5.5 0 0 1 .92.392c-.295.69-.871 1.304-1.66 1.304-.487 0-.892-.234-1.2-.574-.309.34-.713.574-1.2.574-.486 0-.892-.233-1.2-.574-.31.34-.714.574-1.2.574a.5.5 0 0 1 0-1c.212 0 .52-.18.74-.696l.034-.067a.5.5 0 0 1 .886.067c.221.516.528.696.74.696.213 0 .52-.18.74-.696l.035-.067a.5.5 0 0 1 .885.067c.22.516.527.696.74.696s.519-.18.74-.696M12 5.5a.5.5 0 0 0 .5.5h2.293L12 3.207z"/></svg>
    <span>ClaudeSheet · US2 · implementation plan check · round 2</span>
  </div>
  <div class="elicit-body">

    <div class="elicit-group" style="padding:12px 14px; border:0.5px solid var(--border); border-radius:12px;">
      <label class="elicit-question">
        <span style="font-size:12px; padding:2px 8px; border-radius:var(--radius); background:var(--bg-danger); color:var(--text-danger);">Rejected</span>
        <span style="font-family:var(--font-mono); font-size:13px;">P01 · Step 1</span>
      </label>
      <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin:4px 0 8px;">
        OnAfterFetch: if ErrorMessage is not empty, call FeedbackMessageShow (error).<br>
        <span style="color:var(--text-danger);">Reason: GetSummaryOnAfterFetch uses a Message node (Type = Error), not FeedbackMessageShow. Documented deviation, see implementation notes.</span><br>
        <span style="color:var(--text-muted);">Unchanged</span>
      </div>
      <div class="elicit-pills" data-name="P01" data-multi="false">
        <button type="button" class="elicit-pill" data-value="Yes">Yes</button>
        <button type="button" class="elicit-pill" data-value="No" data-other>No</button>
      </div>
      <input type="text" class="elicit-other" data-for="P01" placeholder="Why is this a no?" hidden>
    </div>

    <div class="elicit-group" style="padding:12px 14px; border:0.5px solid var(--border-warning); border-radius:12px; background:var(--bg-warning);">
      <label class="elicit-question">
        <span style="font-size:12px; padding:2px 8px; border-radius:var(--radius); background:var(--bg-success); color:var(--text-success);">Approved</span>
        <span style="font-family:var(--font-mono); font-size:13px;">P02 · Step 2</span>
      </label>
      <div style="font-size:13px; color:var(--text-warning); line-height:1.6; margin:4px 0 8px;">
        Fixed in round 2. Your reason: "RefreshKey must default to 0". Done: TotalHoursMonth input RefreshKey default set to 0.<br>
        <span style="color:var(--text-secondary);">Block TotalHoursMonth with inputs Year, Month, RefreshKey. Evidence: Interface › UI Flows › SheetBlocks › TotalHoursMonth, inputs Year (Integer, mandatory), Month (Integer, mandatory), RefreshKey (Integer, default 0).</span>
      </div>
      <div class="elicit-pills" data-name="P02" data-multi="false">
        <button type="button" class="elicit-pill" data-value="Yes">Yes</button>
        <button type="button" class="elicit-pill" data-value="No" data-other>No</button>
      </div>
      <input type="text" class="elicit-other" data-for="P02" placeholder="Why is this a no?" hidden>
    </div>

  </div>
  <div class="elicit-footer">
    <button type="button" class="elicit-skip">Skip</button>
    <button type="button" class="elicit-submit">Submit plan check</button>
  </div>
</form>
```
