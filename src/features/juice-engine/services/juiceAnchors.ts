/**
 * Page registries for juice targets (juice-core D4): named anchors (`"meter:users"`) and the one
 * stage that holds overlay nodes. Unregistering only clears an entry that still holds the same
 * element, so a React StrictMode double mount or a re-render never wipes the newer registration.
 */

const anchors = new Map<string, Element>();
let stage: HTMLElement | null = null;

/** Registers `element` under `name` (the newest registration wins); returns the unregister. */
export function registerJuiceAnchor(name: string, element: Element): () => void {
  anchors.set(name, element);
  return () => {
    if (anchors.get(name) === element) anchors.delete(name);
  };
}

/** The anchor's element, or null when it is missing or no longer in the document. */
export function findJuiceAnchor(name: string): Element | null {
  const element = anchors.get(name);
  return element && element.isConnected ? element : null;
}

/** Registers the overlay stage; returns the unregister. */
export function registerJuiceStage(element: HTMLElement): () => void {
  stage = element;
  return () => {
    if (stage === element) stage = null;
  };
}

/** The mounted overlay stage, or null. */
export function getJuiceStage(): HTMLElement | null {
  return stage && stage.isConnected ? stage : null;
}
