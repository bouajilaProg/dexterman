import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { docsEndpoint, docsExecuteEndpoint } from "./pages/docs/docs.js";
import {
  editorDataEndpoint,
  editorEndpoint,
  editorSaveEndpoint,
} from "./pages/editor/editor.js";

const app = new Hono();

app.use(
  "/styles.css",
  serveStatic({
    root: "./public",
  }),
);

app.use(
  "/vendor/*",
  serveStatic({
    root: "./node_modules/lucide/dist/umd",
    rewriteRequestPath: (path) => path.replace(/^\/vendor\//, ""),
  }),
);

app.use(
  "/editor/*",
  serveStatic({
    root: "./dist/pages/editor",
    rewriteRequestPath: (path) => path.replace(/^\/editor/, ""),
  }),
);

app.use(
  "/docs/*",
  serveStatic({
    root: "./dist/pages/docs",
    rewriteRequestPath: (path) => path.replace(/^\/docs/, ""),
  }),
);

app.use(
  "/editor.js",
  serveStatic({
    root: "./dist/pages/editor",
    rewriteRequestPath: () => "/ui.js",
  }),
);

app.use(
  "/components/*",
  serveStatic({
    root: "./dist/pages/editor",
  }),
);

app.get("/", editorEndpoint);
app.get("/docs", docsEndpoint);
app.get("/editor/data", editorDataEndpoint);
app.post("/editor/save", editorSaveEndpoint);
app.post("/docs/execute", docsExecuteEndpoint);
app.get("/health", (c) => c.text("ok"));

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
