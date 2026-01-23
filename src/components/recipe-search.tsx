import { useState } from "react";

export interface RecipeSearchCardProps {
  recipeName: string;
  themeColor: string;
  status: "inProgress" | "executing" | "complete";
  respond?: (response: string) => void;
}

export function RecipeSearchCard({ recipeName, themeColor, status, respond }: RecipeSearchCardProps) {
  const [decision, setDecision] = useState<"approved" | "cancelled" | null>(null);

  const handleApprove = () => {
    setDecision("approved");
    respond?.("APPROVED");
  };

  const handleCancel = () => {
    setDecision("cancelled");
    respond?.("CANCELLED");
  };

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="rounded-2xl shadow-xl max-w-md w-full mt-6"
    >
      <div className="bg-white/20 backdrop-blur-md p-8 w-full rounded-2xl">
        {/* Show decision or prompt */}
        {decision === "approved" ? (
          <div className="text-center">
            <div className="text-7xl mb-4">👨‍🍳</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Generating Recipe
            </h2>
            <p className="text-white/90">
              Creating {recipeName} recipe for you!
            </p>
          </div>
        ) : decision === "cancelled" ? (
          <div className="text-center">
            <div className="text-7xl mb-4">✋</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Request Cancelled
            </h2>
            <p className="text-white/90">
              No problem! Feel free to share a URL instead.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">📖</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Recipe Request
              </h2>
              <p className="text-white/90 mb-2">
                Would you like me to provide a recipe for:
              </p>
              <p className="text-xl font-semibold text-white">
                {recipeName}
              </p>
            </div>
            
            {/* Action Buttons */}
            {status === "executing" && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 px-6 py-4 rounded-xl bg-white text-black font-bold 
                    shadow-lg hover:shadow-xl transition-all 
                    hover:scale-105 active:scale-95"
                >
                  👨‍🍳 Get Recipe
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-4 rounded-xl bg-black/20 text-white font-bold 
                    border-2 border-white/30 shadow-lg
                    transition-all hover:scale-105 active:scale-95
                    hover:bg-black/30"
                >
                  ✋ Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
