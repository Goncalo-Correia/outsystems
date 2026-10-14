# Snapshots

The state of each module as Model API code, as returned by the Service Studio read tools. Refreshed after every publish by the `outsystems-mcp-publish` skill, which can also refresh them on request.

```
snapshots/<Module>/
  README.md              overview: type, version, counts, last refresh
  data-model.cs          getDataModel (includes entities from references)
  structures.cs          getStructures
  settings.cs            getSettings (site properties)
  names/*.json           every get…Names list, sorted
  server-actions/*.cs    getServerAction, one file per action   (full mode)
  client-actions/*.cs    getClientAction                         (full mode)
  screens/*.cs           getScreen / getScreenTraditional        (full mode)
  web-blocks/*.cs        getWebBlock / getWebBlockTraditional    (full mode)
  roles/*.cs             getRole                                 (full mode)
  …
```

To see what changed in a module between publishes:

```bash
git log -p -- snapshots/<Module>/
```
