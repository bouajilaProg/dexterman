import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { editorDataEndpoint, editorEndpoint, editorSaveEndpoint } from './pages/editor/editor.js'

const app = new Hono()

app.use('/styles.css', serveStatic({
  root: './public'
}))

app.use('/editor/*', serveStatic({
  root: './dist/pages/editor',
  rewriteRequestPath: (path) => path.replace(/^\/editor/, '')
}))

app.use('/editor.js', serveStatic({
  root: './dist/pages/editor',
  rewriteRequestPath: () => '/ui.js'
}))

app.use('/components/*', serveStatic({
  root: './dist/pages/editor'
}))

app.get('/', editorEndpoint)
app.get('/editor/data', editorDataEndpoint)
app.post('/editor/save', editorSaveEndpoint)
app.get('/health', (c) => c.text('ok'))

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
