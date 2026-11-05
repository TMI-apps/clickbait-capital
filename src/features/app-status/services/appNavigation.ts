/** Full reload: retries a failed chunk and clears the error boundary. */
export const reloadPage = (): void => window.location.reload();

/** Hard navigation home, so a broken in-memory state cannot follow the player. */
export const goHome = (): void => window.location.assign("/");
