/** Read bytes before parsing so missing/false Content-Length cannot bypass limits. */
export class RequestBodyError extends Error {
  constructor(public readonly status: 400 | 413, message: string) { super(message); }
}
export async function readBoundedText(req: Request, maxBytes: number): Promise<string> {
  const declared = Number(req.headers.get("content-length"));
  if (declared > maxBytes) throw new RequestBodyError(413, "Request body too large");
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError(413, "Request body too large");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(data);
}
export async function readJsonObject(req: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const text = await readBoundedText(req, maxBytes);
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected object");
    return body;
  } catch { throw new RequestBodyError(400, "Invalid JSON body"); }
}
