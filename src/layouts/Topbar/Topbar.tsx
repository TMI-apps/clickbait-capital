import { Link } from "react-router-dom";
import { ProfileMenu } from "@/layouts/ProfileMenu";
import { useAuthContext } from "@/shared/context/AuthContext";

/**
 * Topbar component that is always visible.
 * The account menu shows only for a signed-in user: players have no accounts, and sign-in
 * lives on the unlinked `/login` page until accounts are needed.
 */
export const Topbar = () => {
  const { user } = useAuthContext();

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-card text-foreground elevation-md">
      <div className="flex h-toolbar items-center px-4 sm:px-6">
        <div className="flex-1 font-heading text-xl font-bold">
          <Link to="/" className="text-primary no-underline">
            Clickbait Capital
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <ProfileMenu />
          </div>
        )}
      </div>
    </header>
  );
};
