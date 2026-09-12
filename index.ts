import { Plugin } from "@opencode/plugin"

type SavedModel = {
  providerID: string
  id: string
  variant?: string
  updatedAt: string
}

const KEY = "last-model"

function isSavedModel(value: unknown): value is SavedModel {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return typeof v.providerID === "string" &&
    typeof v.id === "string" &&
    (v.variant === undefined || typeof v.variant === "string")
}

export default Plugin.define({
  id: "remember-last-model",

  async setup(ctx) {
    // Load the persisted selection once when the global plugin starts.
    const raw = await ctx.storage.get(KEY)
    let saved: SavedModel | undefined = isSavedModel(raw) ? raw : undefined

    // Make the saved provider/model the catalog default. This is what makes
    // a newly-created session start on the remembered model.
    if (saved) {
      try {
        await ctx.catalog.transform((catalog) => {
          if (catalog.model.get(saved!.providerID, saved!.id)) {
            catalog.model.default.set(saved!.providerID, saved!.id)
          }
        })
      } catch (error) {
        console.warn("[remember-last-model] unable to set saved model as default", error)
      }
    }

    // Apply the saved variant to newly-created sessions as early as possible.
    // We also have a context-hook fallback below because event delivery can
    // differ between OpenCode releases/embedded hosts.
    const controller = new AbortController()

    const restoreOnSessionCreate = async () => {
      if (!saved) return

      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event.type !== "session.created") continue

          const info = (event as {
            type: "session.created"
            properties?: { info?: { id?: string } }
          }).properties?.info

          const sessionID = info?.id
          if (!sessionID || !saved?.variant) continue

          // The model itself is already supplied by the catalog default.
          // switchModel is used here specifically to restore the variant.
          await ctx.session.switchModel({
            sessionID,
            model: {
              providerID: saved.providerID,
              id: saved.id,
              variant: saved.variant,
            },
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("[remember-last-model] event subscription stopped", error)
        }
      }
    }

    void restoreOnSessionCreate()

    // Observe the model actually used for the agent loop. This catches:
    // - interactive model changes
    // - model changes made by commands/other plugins
    // - restored sessions
    //
    // If the provider/model differs from the saved one, treat it as a new
    // explicit selection and persist it.
    //
    // If only the variant is missing on the first request after startup,
    // re-apply the saved variant and don't overwrite the saved value yet.
    await ctx.session.hook("context", async (event) => {
      const current = event.model
      if (!current) return

      if (
        saved &&
        current.providerID === saved.providerID &&
        current.id === saved.id &&
        saved.variant !== undefined &&
        current.variant !== saved.variant
      ) {
        try {
          await ctx.session.switchModel({
            sessionID: event.sessionID,
            model: {
              providerID: saved.providerID,
              id: saved.id,
              variant: saved.variant,
            },
          })
          return
        } catch {
          // If the host cannot switch during this hook, fall through and
          // preserve the actually-used selection below.
        }
      }

      const next: SavedModel = {
        providerID: current.providerID,
        id: current.id,
        ...(current.variant !== undefined ? { variant: current.variant } : {}),
        updatedAt: new Date().toISOString(),
      }

      // Avoid unnecessary writes.
      if (
        saved?.providerID === next.providerID &&
        saved?.id === next.id &&
        saved?.variant === next.variant
      ) {
        return
      }

      saved = next
      await ctx.storage.set(KEY, next)
    })

    return () => controller.abort()
  },
})
