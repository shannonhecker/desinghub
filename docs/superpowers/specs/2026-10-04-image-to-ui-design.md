# Generate the UI from an uploaded image (Task 16)

Date: 4 Oct 2026. Owner request. Status: design, before code.

## What "generate from an image" honestly means here

The user drops in a screenshot, mockup or photo of a sketch. The model looks at it and rebuilds the
screen with the builder's own registered blocks, in the active design system, using the existing
canvas tools (setZoneLayout, addBlock, applyTemplate, ...). The result follows the image's layout,
hierarchy and content (labels, numbers, nav items). It is not a pixel copy: colours, fonts and
spacing come from the design system, and anything the block set cannot express (custom
illustrations, unusual charts, bespoke widgets) is approximated and named in the reply.

## Comparables

- **v0**: attach or paste an image into the prompt box; a thumbnail sits above the text; the model
  writes code that follows it. Lesson: paste must work, the thumbnail must be removable, text is optional.
- **Galileo AI / Google Stitch**: upload a screenshot or wireframe and get an editable design back.
  Lesson: the output is in the tool's own component vocabulary, which is what we do with blocks.
- **Builder.io Visual Copilot**: design to code mapped onto the team's own components. Lesson: map to
  the system you have, and be clear about what did not map.
- **Figma Make**: attach frames or images to a prompt in a chat composer. Lesson: the attachment is a
  chip inside the composer, not a separate upload screen.

Shared pattern we copy: one composer, an attach control on the left of the toolbar, paste and drop
as shortcuts, a thumbnail chip with remove, send stays the same button.

## Flow

1. **Attach**: an image button (accessible name "Attach an image") at the left of the composer
   toolbar opens a file picker limited to PNG, JPEG, WebP and GIF. Shown only when AI is on.
2. **Paste**: pasting an image from the clipboard into the message box attaches it. Pasted text
   behaves as before.
3. **Drop**: dragging a file over the composer shows a drop state (a soft tinted fill over the
   composer, no ring, and the line "Drop an image to build from it"); dropping attaches it.
4. **Chip**: a thumbnail chip appears above the text with the file name, its size after
   preparation (e.g. "1568 x 980") and a remove button ("Remove image"). Attaching a second image
   replaces the first (one image per turn) and says so.
5. **Send**: text is optional. With no text the turn reads "Build this screen from the image."
   The image skips the local keyword shortcuts and goes to the model. The generating label reads
   "Reading your image..." until the first tokens arrive.
6. **Transcript**: the user bubble shows an "Image attached" marker. The image itself is not kept.
7. **Reply**: the model says in one line what it sees, builds with the canvas tools, then says
   plainly what it could not match.

Errors show as one polite line under the chip (`role="status"`), never as a modal:
"That file isn't an image we can read. Try a PNG, JPEG, WebP or GIF.",
"That image is too large, even after shrinking. Try a smaller crop or a screenshot.",
"Reading an image needs AI, which is off right now." Server rejects use one generic line.

## Decisions and reasons

| Decision | Why |
|---|---|
| One image per turn, latest user message only | Keeps the request small and the intent clear; the server rejects an image anywhere else. |
| Downscale to a long edge of 1568 px on the client | The route's model (claude-sonnet-4-6) reads images at up to 1568 px; larger costs upload time and latency for no gain. |
| Encoded cap 2 MB (decoded bytes), checked on client and server | base64 adds a third (about 2.7 MB); with the 40-message history cap the body stays under Vercel's 4.5 MB request limit. |
| Input file cap 20 MB before decoding | Stops the tab decoding a huge file just to reject it. |
| Media type by sniffed magic bytes, not name or `file.type` | A renamed file cannot pass; the server re-sniffs and must match the declared type. |
| Keep original bytes when already within caps, else re-encode (PNG, then JPEG 0.88, then 0.75) | Screenshots stay sharp; photos still fit. |
| Base64 only, no URL images | The server never fetches a user-supplied URL. |
| Server re-validates base64 shape, type, size and pixel dimensions | The client is not trusted. Rejects get a generic 400 and a log line with reason and byte count only, never image data. |
| Image guidance lives in the static system prompt | The cached prefix (tools, system) stays byte-stable; the image block sits after the breakpoint in the latest user turn. |
| Retry after a network or server failure resends the same image from memory | The user should not have to attach it again; it lives only in a ref until the next successful send. |

## Visual treatment

Owner rule (4 Oct): no harsh outlines. The attach button is a ghost icon button with a soft tonal
hover; the chip is a raised tonal tile with a low-contrast hairline; the drop state is a tinted fill;
the error is a tinted line, not a box. Only keyboard focus draws a ring. All measurements and
colours are `--bc-attach-*` tokens in chrome-tokens.css.

## Privacy

The image lives in component memory (composer state, then the request body). It is never written
to the builder store, so it cannot reach chat history, the local session, cloud save or share
state. The persisted user message carries only `attachment: "image"`. Tests assert the base64
string is absent from the store, `buildLocalSessionSnapshot`, `buildProjectSnapshot` and the share
payload after an image turn. Prior turns sent back to the model carry the marker as text, not the image.

## Interfaces (reused by the Figma link task)

- `src/lib/image/imageBytes.ts` (isomorphic, pure): `ALLOWED_IMAGE_TYPES`, `MAX_IMAGE_EDGE`,
  `MAX_IMAGE_BYTES`, `sniffImageType(bytes)`, `readImageSize(bytes, type)`, base64 helpers.
- `src/lib/image/prepareImageAttachment.ts` (browser): `prepareImageAttachment(file)` resolves
  `{ mediaType, base64, width, height, bytes }` or rejects with `ImageAttachmentError` (`code`, `message`).
- `src/lib/image/validateImagePayload.ts` (server): `validateImagePayload(unknown)` and
  `imageContentBlock(image)`.
- Request: the latest message may be `{ role: "user", content: string, image?: { mediaType, data } }`.
  The stream protocol is unchanged.

A Figma link can render a frame to PNG server-side and feed the same `validateImagePayload` and
`imageContentBlock` path.

## Not in scope

Multiple images, PDFs, URL images, keeping images in history, pixel-diff checks of the result.
