# OpenCode Remember Last Model

A global OpenCode plugin that remembers the last provider, model, and variant you actually use and restores them across restarts.

## Install

Copy this directory to:

```text
~/.config/opencode/plugins/remember-last-model/
```

You should end up with:

```text
~/.config/opencode/plugins/remember-last-model/index.ts
```

OpenCode automatically discovers TypeScript plugins in the global `~/.config/opencode/plugins/` directory.

Restart OpenCode after copying the file.

## Behavior

- First run: uses your normal OpenCode/project default.
- After you select a provider/model/variant and use it, the plugin persists it.
- Next OpenCode startup: the remembered provider/model becomes the catalog default.
- The remembered variant is restored when a new session is created.
- If you explicitly select another model/variant, the new selection becomes the remembered one.
- The state is stored using OpenCode's durable plugin storage; no API keys or prompts are written by this plugin.

## Verify

Run:

```bash
opencode plugin list
```

The plugin should appear as `remember-last-model`.

Then:

1. Start OpenCode.
2. Select a model with `/models`.
3. Use it for one request.
4. Quit OpenCode.
5. Start OpenCode again.
6. The same provider/model should be selected automatically.

## Notes

OpenCode's root `model` config supports `provider/model`, but its catalog default does not retain a variant. This plugin therefore restores the model through the catalog default and restores the variant through the session API.

The plugin deliberately does not edit `opencode.json`; your normal configuration remains unchanged.
