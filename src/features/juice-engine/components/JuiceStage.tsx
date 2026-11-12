import { useJuiceStageRef } from "@/features/juice-engine/hooks/useJuiceAnchor";

/**
 * The one overlay that juice effects draw into (particles, floaters, callouts, flashes): fixed
 * over the viewport, click-through and hidden from screen readers (juice-core D8). Effects add
 * and remove their own nodes; React renders it once. Mount it once per page.
 */
export const JuiceStage = () => {
  const ref = useJuiceStageRef();
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-juice-stage=""
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    />
  );
};
