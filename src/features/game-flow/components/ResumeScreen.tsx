import { History } from "lucide-react";
import { Button } from "@/components/common/Button";
import { UI_COPY } from "@/features/game-content/api";
import { FlowScreen } from "./FlowScreen";

export interface ResumeScreenProps {
  onResume: () => void;
  onNewGame: () => void;
}

/**
 * Offer when `/spel` opens with a saved run (local-save D4): continue it or start over. The
 * focused heading is spoken with its kicker, like the other flow screens; the main action is
 * last in the DOM so FlowScreen shows it on top on phones.
 */
export const ResumeScreen = ({ onResume, onNewGame }: ResumeScreenProps) => (
  <FlowScreen
    kicker={UI_COPY.resume.kicker}
    title={UI_COPY.resume.title}
    icon={<History aria-hidden="true" className="size-8 text-primary" />}
    actions={
      <>
        <Button variant="outline" className="min-h-11" onClick={onNewGame}>
          {UI_COPY.start.newGameButton}
        </Button>
        <Button className="min-h-11" onClick={onResume}>
          {UI_COPY.start.continueButton}
        </Button>
      </>
    }
  >
    <p className="text-base">{UI_COPY.resume.body}</p>
  </FlowScreen>
);
