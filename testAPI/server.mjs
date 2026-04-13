import { createServer } from "node:http";

const PORT = Number(process.env.TEST_API_PORT || 3001);
const BASE_PATH = "/testAPI"; // Standardizing for your specific pathing

let nextUserId = 3;
const users = [
  { id: 1, email: "zara@example.com", role: "admin", active: true },
  { id: 2, email: "noah@example.com", role: "viewer", active: true },
];

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(payload));
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  return raw ? JSON.parse(raw) : {};
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const method = req.method.toUpperCase();
    const { pathname } = url;

    // CORS Pre-flight
    if (method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      return res.end();
    }

    // 1. GLOBAL HEALTH (Maps to XML <api name="health check">)
    if (method === "GET" && pathname === "/health") {
      return sendJson(res, 200, { status: "ok", uptime: process.uptime(), version: "1.0.0" });
    }

    // 2. PUBLIC CONFIG (Maps to XML <api name="site config">)
    if (method === "GET" && pathname === "/config/public") {
      return sendJson(res, 200, { siteName: "Shopwave Test", supportEmail: "dev@localhost", currency: "USD" });
    }

    // 3. USER MANAGEMENT (Existing testAPI Logic)
    if (pathname.startsWith(`${BASE_PATH}/users`)) {
      const userMatch = pathname.match(/^\/testAPI\/users\/(\d+)$/);

      if (method === "GET" && !userMatch) {
        return sendJson(res, 200, { ok: true, count: users.length, items: users });
      }

      if (method === "POST" && !userMatch) {
        const body = await parseBody(req);
        const newUser = { id: nextUserId++, email: body.email, role: body.role || "viewer", active: true };
        users.push(newUser);
        return sendJson(res, 201, { ok: true, item: newUser });
      }

      if (userMatch) {
        const userId = Number(userMatch[1]);
        const index = users.findIndex(u => u.id === userId);
        if (index < 0) return sendJson(res, 404, { ok: false, error: "User not found" });

        if (method === "GET") return sendJson(res, 200, { ok: true, item: users[index] });
        if (method === "DELETE") return sendJson(res, 200, { ok: true, deleted: users.splice(index, 1)[0] });
      }
    }

    // 4. MOCK CATALOG (To support the XML Catalog group)
    if (method === "GET" && pathname === "/products") {
      return sendJson(res, 200, { items: [{ id: "p1", title: "Arch Linux Sticker", price: 5 }], total: 1 });
    }

    sendJson(res, 404, { ok: false, error: "Not found", path: pathname });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
});

server.listen(PORT, () => console.log(`🚀 Server syncing with XML collection at http://localhost:${PORT}`));
