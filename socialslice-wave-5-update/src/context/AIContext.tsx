"use client";

import { ReactNode, useContext, createContext } from "react";

// Define the types for our actions
export interface AIActions {
  sendMessage: (input: string, chatHistory: [string, string][]) => Promise<void>;
  generateContract: (input: string) => Promise<string>;
}

// Create the context with proper typing
const ActionsContext = createContext<AIActions | null>(null);

/**
 * Provider component that exposes AI actions to the React component tree
 */
export const AIProvider = ({
  actions,
  children,
}: {
  actions: AIActions;
  children: ReactNode;
}) => {
  return (
    <ActionsContext.Provider value={actions}>
      {children}
    </ActionsContext.Provider>
  );
};

/**
 * Hook to access AI actions from any component
 * This is needed because of Next.js limitations with server/client components
 * See: https://github.com/vercel/next.js/pull/59615
 */
export function useAIActions() {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error("useAIActions must be used within an AIProvider");
  }
  return context;
} 