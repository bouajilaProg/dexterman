import type { Context } from 'hono'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { attachEditorScript } from './components/ui/editor.js'

const editorTestResultPath = join(process.cwd(), 'src/pages/editor/test/result.html')

export async function editorEndpoint(c: Context) {
  const html = await readFile(editorTestResultPath, 'utf-8')
  const finalHtml = html.replace('</body>', `<script>${attachEditorScript}</script></body>`)
  return c.html(finalHtml)
}
