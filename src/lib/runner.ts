// return any but as generic
// take api url and request body as parameters
// return response from api call

const METHODS_VALUES = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type METHODS = (typeof METHODS_VALUES)[number];
export type ApiVariables = Record<string, string>;

type ApiCallOptions = {
  vars?: ApiVariables;
};

const substituteVarsInString = (value: string, vars: ApiVariables) => {
  return value.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (_full, varName: string) => {
      return vars[varName] ?? " ";
    },
  );
};

const substituteVarsDeep = (value: unknown, vars: ApiVariables): unknown => {
  if (typeof value === "string") {
    return substituteVarsInString(value, vars);
  }

  if (Array.isArray(value)) {
    return value.map((item) => substituteVarsDeep(item, vars));
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      out[key] = substituteVarsDeep(nested, vars);
    }
    return out;
  }

  return value;
};

export const apiCall = async <T>(
  url: string,
  method: METHODS,
  body: any,
  options: ApiCallOptions = {},
): Promise<T> => {
  const normalizedMethod = method.toUpperCase() as METHODS;
  const shouldSendBody = normalizedMethod !== "GET";
  const vars = options.vars ?? {};
  const resolvedUrl = substituteVarsInString(url, vars);
  const resolvedBody = substituteVarsDeep(body ?? {}, vars);

  const response = await fetch(resolvedUrl, {
    method: normalizedMethod,
    headers: {
      "Content-Type": "application/json",
    },
    body: shouldSendBody ? JSON.stringify(resolvedBody) : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `API call failed with status ${response.status}: ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
};
