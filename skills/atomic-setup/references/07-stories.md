# Step 7: stories to the standard

Setup writes the harness and the checks, not the client's stories. This is the standard
every library component's `*.stories.tsx` follows, and the standard `atomic-design:component`
(a later change) writes to. Put it in front of the team and in `AGENTS.md` through the
rules block.

- `title` is `<Level>/<Name>`: `Atoms/Button`, `Molecules/DownloadList`.
- `args` hold plain data and no-op callbacks.
- One story per state the spec or design names. Always consider: default, empty, loading,
  disabled, error, long content (the longest locale's copy).
- Every story reads correctly under each `locale` and `theme` global. These are toolbar
  switches, not separate stories.
- The meta carries a doc card, `parameters.atomic`, with at least `status` and `owner`
  (fields: the core skill's `references/doc-card.md`).
- Names describe structure, not the screen where the component first appeared.
- Static copy goes through `t()`; served labels arrive as props.
- Templates take regions as slots. If a story needs route composition, put a memory
  router in the story, never in the component.

**Check:** step 6's suite is green and step 5's test finds a stories file beside every
component that is not in the baseline.
