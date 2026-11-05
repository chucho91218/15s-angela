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

// DEBT: archivos en disco, sin base de datos. Techo: en Cloudflare Workers el disco
// no persiste. Camino de upgrade: implementar esta misma interfaz Store sobre R2.
export const store = createFileStore(
  process.env.RSVP_DATA_DIR ?? join(/*turbopackIgnore: true*/ process.cwd(), 'data'),
)
