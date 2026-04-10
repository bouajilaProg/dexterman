import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { editorEndpoint } from './pages/editor/editor.js'

const app = new Hono()

app.use('/styles.css', serveStatic({
  root: './public'
}))

app.get('/', editorEndpoint)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
