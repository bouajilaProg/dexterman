/**
 * @title pages/docs/ui.ts
 * @descrption Browser docs behavior to execute endpoints and render JSON output per API card.
 */

type ExecuteResponse = {
  ok: boolean;
  result?: unknown;
  error?: string;
};

const ENV_STORAGE_KEY = "dexterman:env-vars";

const getEnvVars = (): Record<string, string> => {
  try {
    const raw = window.localStorage.getItem(ENV_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      vars[key] = typeof value === "string" ? value : " ";
    }
    return vars;
  } catch {
    return {};
  }
};

const parseFieldValue = (raw: string, type: string) => {
  const trimmed = raw.trim();
  if (trimmed === "") return "";

  const normalizedType = type.trim().toLowerCase();
  if (normalizedType === "number") {
    const num = Number(trimmed);
    if (Number.isNaN(num)) {
      throw new Error(`Invalid number value: ${trimmed}`);
    }
    return num;
  }

  if (normalizedType === "boolean") {
    const normalized = trimmed.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    throw new Error(`Invalid boolean value: ${trimmed}`);
  }

  if (normalizedType === "object" || normalizedType === "array") {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      normalizedType === "object" &&
      (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    ) {
      throw new Error(`Field expects object, got ${trimmed}`);
    }
    if (normalizedType === "array" && !Array.isArray(parsed)) {
      throw new Error(`Field expects array, got ${trimmed}`);
    }
    return parsed;
  }

  return trimmed;
};

const buildBodyFromInputs = (card: Element) => {
  const entries: Record<string, unknown> = {};
  const fields = card.querySelectorAll<HTMLInputElement>(
    "[data-request-field]",
  );

  for (const field of fields) {
    const name = (field.getAttribute("data-field-name") ?? "").trim();
    const type = field.getAttribute("data-field-type") ?? "string";
    const required =
      (field.getAttribute("data-required") ?? "false") === "true";
    const raw = field.value;

    if (!name) {
      continue;
    }

    if (raw.trim() === "") {
      field.classList.remove("border-accent-danger");
      if (required) {
        field.classList.add("border-accent-danger");
        throw new Error(`Field '${name}' is required`);
      }
      continue;
    }

    try {
      entries[name] = parseFieldValue(raw, type);
      field.classList.remove("border-accent-danger");
    } catch (error) {
      field.classList.add("border-accent-danger");
      throw error;
    }
  }

  return entries;
};

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const getWithin = <T extends Element>(root: ParentNode, selector: string) => {
  const found = root.querySelector(selector);
  return found instanceof Element ? (found as T) : null;
};

const setStatus = (
  node: HTMLElement | null,
  text: string,
  tone: "idle" | "busy" | "ok" | "error",
) => {
  if (!node) return;
  node.textContent = text;
  node.className = "text-[11px]";

  if (tone === "busy") {
    node.classList.add("text-accent-warning");
    return;
  }

  if (tone === "ok") {
    node.classList.add("text-accent-success");
    return;
  }

  if (tone === "error") {
    node.classList.add("text-accent-danger");
    return;
  }

  node.classList.add("text-text-dim");
};

const executeFromCard = async (button: HTMLButtonElement) => {
  const card = button.closest("details");
  if (!card) return;

  const urlInput = getWithin<HTMLInputElement>(card, "[data-endpoint-url]");
  const output = getWithin<HTMLElement>(card, "[data-output-json]");
  const status = getWithin<HTMLElement>(card, "[data-output-status]");

  const method = (button.getAttribute("data-method") ?? "GET").toUpperCase();
  const url = urlInput?.value.trim() ?? "";

  try {
    const body = buildBodyFromInputs(card);
    const vars = getEnvVars();
    button.disabled = true;
    setStatus(status, "Executing...", "busy");

    const response = await fetch("/docs/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ url, method, body, vars }),
    });

    const payload = (await response.json()) as ExecuteResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? `Request failed (${response.status})`);
    }

    if (output) {
      output.textContent = formatJson(payload.result);
    }
    setStatus(status, "Success", "ok");
  } catch (error) {
    if (output) {
      const message =
        error instanceof Error ? error.message : "Unexpected execution error";
      output.textContent = formatJson({ error: message });
    }
    setStatus(status, "Failed", "error");
  } finally {
    button.disabled = false;
  }
};

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest("[data-execute]");
  if (!(button instanceof HTMLButtonElement)) return;

  event.preventDefault();
  executeFromCard(button).catch(() => {
    // executeFromCard handles UI errors internally.
  });
});
