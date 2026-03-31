import { PasswordSetupScreen } from "./PasswordSetupScreen";
import type { User } from "../../types";

interface PasswordSetupModalProps {
  user?: User | null;
  onSubmit: (currentPassword: string, password: string, confirmPassword: string) => Promise<void> | void;
  expectedCurrentPassword?: string | null;
}

export function PasswordSetupModal({ user, onSubmit, expectedCurrentPassword }: PasswordSetupModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-3xl">
        <PasswordSetupScreen
          badgeLabel="Password Reset Required"
          description={`${
            user?.name ? `${user.name}, ` : ""
          }you signed in with a temporary password. Create a new password now to continue into the application.`}
          expectedCurrentPassword={expectedCurrentPassword}
          layout="modal"
          onSubmit={onSubmit}
          submitLabel="Reset password and continue"
          title="Reset your temporary password"
          user={user}
        />
      </div>
    </div>
  );
}
