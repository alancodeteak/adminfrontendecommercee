/** Must match backend `src/infra/http/uploads.js` multer fileSize limit. */
export const MAX_SHOP_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_SHOP_IMAGE_LABEL = "8MB";
/** Align with backend `imageFileTooLargeMessage()` for client + API errors. */
export const SHOP_IMAGE_TOO_LARGE_MESSAGE = `Image file is too large. Maximum size is ${MAX_SHOP_IMAGE_LABEL}.`;
