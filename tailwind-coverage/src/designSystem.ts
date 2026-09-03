import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { __unstable__loadDesignSystem } from 'tailwindcss'

export async function loadPinnedDesignSystem() {
  const projectRoot = path.resolve(import.meta.dir, '..')
  const theme = await readFile(
    path.join(projectRoot, 'node_modules/tailwindcss/theme.css'),
    'utf8'
  )
  return __unstable__loadDesignSystem(`${theme}\n@tailwind utilities;`)
}
