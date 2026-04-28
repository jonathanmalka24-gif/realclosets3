import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListListings,
  useCreateTrade,
  getListTradesQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { loadPreferences } from "@/lib/preferences";

interface TradeDialogProps {
  requestedListingId: string;
  requestedListingTitle: string;
  sellerName: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function TradeDialog({
  requestedListingId,
  requestedListingTitle,
  sellerName,
  disabled,
  children,
}: TradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const me = loadPreferences().displayName.trim();

  const { data: allListings, isLoading } = useListListings({
    query: { enabled: open && me.length > 0, queryKey: ["listings", "for-trade"] },
  });
  const createTrade = useCreateTrade();

  const myActiveListings = useMemo(() => {
    if (!allListings || !me) return [];
    return allListings.filter(
      (l) => l.sellerName.trim() === me && l.status === "active" && l.id !== requestedListingId,
    );
  }, [allListings, me, requestedListingId]);

  const handleSubmit = () => {
    if (!selectedListingId) {
      toast({ title: "Pick an item", description: "Choose one of your listings to offer." });
      return;
    }
    createTrade.mutate(
      {
        data: {
          fromUser: me,
          offeredListingId: selectedListingId,
          requestedListingId,
          message: message.trim(),
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Trade proposed",
            description: `${sellerName} will be notified to review your trade.`,
          });
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey({ user: me }) });
          setOpen(false);
          setSelectedListingId(null);
          setMessage("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? err?.message ?? "Could not propose trade.";
          toast({ title: "Trade failed", description: msg, variant: "destructive" });
        },
      },
    );
  };

  const sameSeller = sellerName.trim() === me;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className={disabled || sameSeller ? "pointer-events-none opacity-50" : ""}>
          {children}
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Propose a trade
          </DialogTitle>
          <DialogDescription>
            Offer one of your listings to swap for <span className="font-medium">{requestedListingTitle}</span>. If {sellerName} accepts, both of you only pay shipping.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Choose an item from your closet
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your closet...
              </div>
            ) : myActiveListings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                You have no active listings to trade. List an item first to propose a trade.
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {myActiveListings.map((listing) => {
                  const checked = selectedListingId === listing.id;
                  return (
                    <button
                      key={listing.id}
                      type="button"
                      onClick={() => setSelectedListingId(listing.id)}
                      data-testid={`select-trade-listing-${listing.id}`}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {listing.proof?.frontPhoto && (
                          <img
                            src={listing.proof.frontPhoto}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {listing.brand} · {listing.size} · ${listing.price}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Add a note (optional)
            </p>
            <Textarea
              placeholder="Why this trade makes sense..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl"
              rows={3}
              data-testid="textarea-trade-message"
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            Both parties pay $8 shipping after accepting. Items only ship once both shipping fees are paid.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedListingId || createTrade.isPending}
              className="rounded-full"
              data-testid="button-submit-trade"
            >
              {createTrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send trade request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
