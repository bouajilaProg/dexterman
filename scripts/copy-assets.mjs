/**
 * copy-assets.mjs
 * Copies non-TypeScript assets (.html, .xsl, .xml, etc.) from src/ to dist/
 * so the production server can find them at runtime.
 *
 * tsc only compiles .ts/.tsx files; this script fills the gap.
 */
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'

const SRC = 'src'
const DIST = 'dist'
const EXTENSIONS = new Set(['.html', '.xsl', '.xml', '.css', '.json', '.svg', '.png', '.jpg', '.ico'])

async function copyAssets(dir) {
    const entries = await readdir(dir)

    for (const entry of entries) {
        const fullPath = join(dir, entry)
        const info = await stat(fullPath)

        if (info.isDirectory()) {
            await copyAssets(fullPath)
        } else if (EXTENSIONS.has(extname(entry).toLowerCase())) {
            const rel = relative(SRC, fullPath)
            const dest = join(DIST, rel)
            await mkdir(join(dest, '..'), { recursive: true })
            await copyFile(fullPath, dest)
            console.log(`  copied: ${rel}`)
        }
    }
}

console.log('Copying non-TS assets from src/ to dist/ ...')
await copyAssets(SRC)
console.log('Done.')
