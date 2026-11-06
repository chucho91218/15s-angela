import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export type Store = {
  get<T>(key: string): Promise<T | null>
  put(key: string, value: unknown): Promise<void>
  list(prefix: string): Promise<string[]>
  del(key: string): Promise<void>
}

const VALID_PREFIX = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i

// Las claves pueden armarse con datos externos: nunca deben salir de la carpeta.
function assertValidKey(key: string) {
  if (!key.endsWith('.json') || !VALID_PREFIX.test(key.slice(0, -'.json'.length))) {
    throw new Error('Clave de almacenamiento inválida')
  }
}

function isMissing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT'
}

export function createFileStore(root: string): Store {
  return {
    async get<T>(key: string) {
      assertValidKey(key)
      try {
        return JSON.parse(await readFile(join(root, key), 'utf8')) as T
      } catch (error) {
        if (isMissing(error)) return null
        throw error
      }
    },

    async put(key, value) {
      assertValidKey(key)
      const path = join(root, key)
      await mkdir(dirname(path), { recursive: true, mode: 0o700 })
      // Escritura atómica: quien lee nunca ve un archivo a medio escribir.
      const temp = `${path}.${crypto.randomUUID()}.tmp`
      await writeFile(temp, JSON.stringify(value), { mode: 0o600 })
      await rename(temp, path)
    },

    async list(prefix) {
      if (!VALID_PREFIX.test(prefix)) {
        throw new Error('Prefijo de almacenamiento inválido')
      }
      try {
        const files = await readdir(join(root, prefix))
        return files
          .filter((file) => file.endsWith('.json'))
          .map((file) => `${prefix}/${file}`)
      } catch (error) {
        if (isMissing(error)) return []
        throw error
      }
    },

    async del(key) {
      assertValidKey(key)
      await rm(join(root, key), { force: true })
    },
  }
}

export type R2BucketLike = {
  get(key: string): Promise<{ text(): Promise<string> } | null>
  put(key: string, value: string): Promise<unknown>
  delete(key: string): Promise<void>
  list(options: { prefix: string; cursor?: string; delimiter?: string }): Promise<{
    objects: { key: string }[]
    truncated: boolean
    cursor?: string
  }>
}

function assertValidPrefix(prefix: string) {
  if (!VALID_PREFIX.test(prefix)) {
    throw new Error('Prefijo de almacenamiento inválido')
  }
}

export function createR2Store(
  getBucket: () => R2BucketLike | Promise<R2BucketLike>,
): Store {
  return {
    async get<T>(key: string) {
      assertValidKey(key)
      const object = await (await getBucket()).get(key)
      return object ? (JSON.parse(await object.text()) as T) : null
    },

    async put(key, value) {
      assertValidKey(key)
      await (await getBucket()).put(key, JSON.stringify(value))
    },

    async list(prefix) {
      assertValidPrefix(prefix)
      const bucket = await getBucket()
      const keys: string[] = []
      let cursor: string | undefined
      do {
        const page = await bucket.list({ prefix: `${prefix}/`, delimiter: '/', cursor })
        keys.push(...page.objects.map(({ key }) => key).filter((key) => key.endsWith('.json')))
        cursor = page.truncated ? page.cursor : undefined
      } while (cursor)
      return keys
    },

    async del(key) {
      assertValidKey(key)
      await (await getBucket()).delete(key)
    },
  }
}

async function getCloudflareBucket() {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare')
  const { RSVP_BUCKET } = getCloudflareContext().env as unknown as {
    RSVP_BUCKET?: R2BucketLike
  }
  if (!RSVP_BUCKET) throw new Error('Falta el bucket RSVP_BUCKET en Cloudflare')
  return RSVP_BUCKET
}

const cloudflareStore = createR2Store(getCloudflareBucket)
const fileStore = createFileStore(
  process.env.RSVP_DATA_DIR ?? join(/*turbopackIgnore: true*/ process.cwd(), 'data'),
)

// Se decide en cada llamada: en Workers las variables llegan recién con el pedido.
// El disco no persiste en Workers; allí se guarda en R2 (ver wrangler.jsonc).
const current = () => (process.env.RSVP_STORE === 'r2' ? cloudflareStore : fileStore)

export const store: Store = {
  get: (key) => current().get(key),
  put: (key, value) => current().put(key, value),
  list: (prefix) => current().list(prefix),
  del: (key) => current().del(key),
}
