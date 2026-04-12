// return any but as generic
// take api url and request body as parameters
// return response from api call

const METHODS_VALUES = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
type METHODS = (typeof METHODS_VALUES)[number];

export const apiCall = async <T>(
  url: string,
  method: METHODS,
  body: any,
): Promise<T> => {
  const normalizedMethod = method.toUpperCase() as METHODS;
  const shouldSendBody = normalizedMethod !== "GET";

  const response = await fetch(url, {
    method: normalizedMethod,
    headers: {
      "Content-Type": "application/json",
    },
    body: shouldSendBody ? JSON.stringify(body ?? {}) : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `API call failed with status ${response.status}: ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
};
