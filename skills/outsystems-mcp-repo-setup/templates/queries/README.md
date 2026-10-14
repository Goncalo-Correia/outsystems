# ModelQL queries

Reusable queries for the Service Studio MCP `runQuery` tool. They query the **module model** at design time, not the database. A query starts with `Root { … }`, and every field needs a selection set.

Save useful ones here as `<purpose>.graphql` with a comment saying what each one answers.

## Examples

All server actions:

```graphql
Root { ServerActions { Name } }
```
