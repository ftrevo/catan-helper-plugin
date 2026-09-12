import { DEFAULT_MODEL_SET, type ModelSetId, isModelSetId } from '../vision/modelSets'

export type Settings = {
  readonly modelSet: ModelSetId
}

export type SettingsStore = {
  load(): Promise<Settings>
  save(settings: Settings): Promise<void>
}

const STORAGE_KEY = 'settings'
const DEFAULTS: Settings = { modelSet: DEFAULT_MODEL_SET }

const sanitize = (raw: unknown): Settings => {
  const candidate = (raw ?? {}) as Partial<Record<keyof Settings, unknown>>
  const modelSet =
    typeof candidate.modelSet === 'string' && isModelSetId(candidate.modelSet) ? candidate.modelSet : DEFAULTS.modelSet
  return { modelSet }
}

/** User preferences survive browser restarts, hence `chrome.storage.local` rather than `session`. */
const chromeLocalStore = (): SettingsStore => ({
  async load() {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    return sanitize(stored[STORAGE_KEY])
  },
  async save(settings) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings })
  },
})

const memoryStore = (): SettingsStore => {
  let settings = DEFAULTS
  return {
    load: async () => settings,
    save: async (next) => {
      settings = next
    },
  }
}

export const createSettingsStore = (): SettingsStore =>
  typeof chrome !== 'undefined' && chrome.storage?.local ? chromeLocalStore() : memoryStore()
