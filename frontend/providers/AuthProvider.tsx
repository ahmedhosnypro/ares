"use client";

import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { Component, type ReactNode } from "react";

class JwtErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (error.message.includes("decryption operation failed") || error.message.includes("JWEDecryptionFailed")) {
      void signOut({ redirect: false }).then(() => {
        // Clear the stale cookie and reload cleanly
        window.location.reload();
      });
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  return (
    <JwtErrorBoundary>
      <SessionProvider>{children}</SessionProvider>
    </JwtErrorBoundary>
  );
}
