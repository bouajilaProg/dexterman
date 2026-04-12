/**
 * @title pages/docs/docs.ts
 * @descrption Server-side docs module that renders read-only API docs and executes endpoints.
 */
import type { Context } from "hono";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { apiCall } from "../../lib/runner.js";
import { embed, transformXmlWithPath } from "../../lib/transform.js";

const isDev = fileURLToPath(import.meta.url).includes("/src/");
const BASE_DIR = join(process.cwd(), isDev ? "src" : "dist");
const DATA_PATH = join(process.cwd(), "data/base.xml");

const docsPath = (file: string) => join(BASE_DIR, "pages/docs", file);

type ExecuteMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type ExecutePayload = {
  url?: string;
  method?: string;
  body?: unknown;
};

const ALLOWED_METHODS = new Set<ExecuteMethod>([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);

/**
 * @title normalizeUrl
 * @description Ensures docs execute endpoint receives a non-empty http/https URL.
 */
const normalizeUrl = (value: unknown) => {
  if (typeof value !== "string") {
    throw new Error("Endpoint URL must be a string");
  }

  const url = value.trim();
  if (!url) {
    throw new Error("Endpoint URL is required");
  }

  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https protocols are allowed");
  }

  return parsed.toString();
};

/**
 * @title normalizeMethod
 * @description Validates and normalizes HTTP method for execution.
 */
const normalizeMethod = (value: unknown): ExecuteMethod => {
  if (typeof value !== "string") {
    throw new Error("HTTP method must be a string");
  }

  const method = value.trim().toUpperCase();
  if (!ALLOWED_METHODS.has(method as ExecuteMethod)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return method as ExecuteMethod;
};

/**
 * @title renderDocsPage
 * @description Renders docs HTML from XML using docs XSLT into the docs layout shell.
 */
const renderDocsPage = async () => {
  const [layout, xml] = await Promise.all([
    readFile(docsPath("page.html"), "utf-8"),
    readFile(DATA_PATH, "utf-8"),
  ]);

  const docsHtml = await transformXmlWithPath(
    xml,
    docsPath("components/docs.xsl"),
  );
  return embed(layout, "docs", docsHtml);
};

export async function docsEndpoint(c: Context) {
  try {
    return c.html(await renderDocsPage());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to render docs page";
    return c.html(`<h1>Docs Error</h1><pre>${message}</pre>`, 500);
  }
}

export async function docsExecuteEndpoint(c: Context) {
  try {
    const payload = await c.req.json<ExecutePayload>();
    const url = normalizeUrl(payload.url);
    const method = normalizeMethod(payload.method);
    const body = payload.body ?? {};

    const result = await apiCall<unknown>(url, method, body);
    return c.json({ ok: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Request execution failed";
    return c.json({ ok: false, error: message }, 400);
  }
}
