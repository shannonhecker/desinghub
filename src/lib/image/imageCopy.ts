/* The route's one reply for any rejected image. Shared by the server
   (validateImagePayload) and the client (useChatAPI matches on it), so the
   two can never drift. */
export const IMAGE_REJECTED_ERROR = "That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB.";
