import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function RefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await router.invalidate();
      toast.success("Records refreshed successfully");
    } catch (e) {
      toast.error("Failed to refresh records");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleRefresh}
      disabled={refreshing}
      aria-label="Refresh records"
      title="Refresh records"
      className="glass-surface h-10 w-10 shrink-0 rounded-2xl border-white/60 shadow-sm hover:bg-card dark:hover:bg-card/10"
    >
      <RefreshCw
        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
    </Button>
  );
}

