/** What counts as a press: buttons, links and the kit's button-like roles. */
const PRESSABLE =
  'button, a[href], [role="button"], [role="radio"], [role="tab"], [role="switch"], [role="menuitem"]';

/**
 * Mark an element (or a whole area) `data-juice-press="off"` when its press has its own juice,
 * e.g. a card play or an event answer, so it doesn't also tap.
 */
export const JUICE_PRESS_ATTRIBUTE = "data-juice-press";

const isElement = (target: EventTarget): target is Element => target instanceof Element;

/**
 * The control a click landed on, if it should play `ui.press` (game-juice D15): the first
 * pressable element on the click's path, enabled, with no `data-juice-press="off"` area on the
 * path. Reads the path (fixed when the click started), not the live DOM, so a control that
 * React removed on click still resolves. Pure, so the rule is testable.
 */
export function pressedControl(path: readonly EventTarget[]): Element | null {
  const elements = path.filter(isElement);
  if (elements.some((element) => element.getAttribute(JUICE_PRESS_ATTRIBUTE) === "off"))
    return null;
  const control = elements.find((element) => element.matches(PRESSABLE));
  if (!control) return null;
  const disabled = control.matches(":disabled") || control.getAttribute("aria-disabled") === "true";
  return disabled ? null : control;
}
