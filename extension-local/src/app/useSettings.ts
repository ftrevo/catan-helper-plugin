import { useCallback, useEffect, useState } from 'react'
import { type Settings, type SettingsStore } from '../platform/settingsStore'
import { DEFAULT_MODEL_SET } from '../vision/modelSets'

/** Loads persisted preferences on mount and writes every change back. */
export const useSettings = (store: SettingsStore): [Settings, (patch: Partial<Settings>) => void] => {
  const [settings, setSettings] = useState<Settings>({ modelSet: DEFAULT_MODEL_SET })

  useEffect(() => {
    let cancelled = false
    store
      .load()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded)
      })
      .catch(() => {
        /* Defaults are fine when nothing was stored yet. */
      })
    return () => {
      cancelled = true
    }
  }, [store])

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch }
        void store.save(next)
        return next
      })
    },
    [store]
  )

  return [settings, update]
}
