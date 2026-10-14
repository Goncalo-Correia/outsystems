# Conventions

These are common OutSystems 11 defaults. Adjust them to the team's standard; Claude follows whatever this file says.

## Naming

| Element | Convention | Example |
|---|---|---|
| Module | PascalCase, layer suffix | `Sales_CS`, `Payments_IS`, `Sales_Th` |
| Entity | Singular PascalCase | `Customer`, `OrderLine` |
| Static entity | Singular PascalCase | `OrderStatus` |
| Attribute | PascalCase. Foreign keys are `<Entity>Id` | `Name`, `CustomerId` |
| Boolean attribute | `Is…` / `Has…` | `IsActive`, `HasAttachments` |
| Structure | PascalCase, describing the shape | `CustomerSummary`, `OrderRequest` |
| Server action | Verb + noun | `Customer_Create`, `Order_GetTotals` |
| Client action | Verb + noun | `ValidateForm`, `RefreshList` |
| Screen | Noun, or Noun + `Detail` / `List` | `Customers`, `CustomerDetail` |
| Block | Noun describing the widget | `CustomerCard`, `HoursCalendar` |
| Role | PascalCase noun | `SalesManager` |
| Site property | PascalCase | `MaxUploadSizeMB` |
| Timer | `Timer_` + purpose | `Timer_SendReminders` |

## Data

- Entities that other modules read are **public with Read Only = Yes**. Writes go through public server actions in the Core module (`Customer_Create`, `Customer_Update`, …).
- Delete rules: `Protect` by default. Use `Delete` only for child records that have no meaning without the parent.
- Index the attributes used in filters on large tables.
- Store dates as Date Time in UTC. Convert for display in the UI.

## Logic

- Business rules live in server actions in Core, not in screen actions.
- Check permissions in the server action, not only on the screen. Screens can be bypassed.
- Raise user exceptions for business-rule violations, and catch them at the screen to show a feedback message.
- Keep client actions free of business logic. They validate input and call server actions or data actions.

## UI

- Use OutSystems UI patterns and blocks before custom HTML and CSS.
- App-wide CSS goes in the theme. Screen-specific CSS stays on the screen.
- Every screen has an explicit role check, or is marked Anonymous on purpose.

## Changes through the MCP

- One story per change set. Don't mix unrelated changes in a single review.
- Read before you write. Confirm an element's current state with the live read tools, not only with `snapshots/`.
- Lay out action flows before merging (see the `servicestudio-mcp-oml` skill).
