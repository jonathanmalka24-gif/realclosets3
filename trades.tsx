import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTrades,
  useUpdateTrade,
  getListTradesQueryKey,
} from "@workspace/api-client-react";
import type { Trade } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { loadPreferences } from "@/lib/preferences";
import {
  ArrowLeftRight,
  Check,
  CreditCard,
  Loader2,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";

const statusLabel: Record<Trade["status"], string> = {
  pending: "Pending",
  accepted: "Accepted — pay shipping",
  declined: "Declined",
  cancelled: "Cancelled",
  shipped: "In transit",
  completed: "Completed",
};

const statusVariant: Record<Trade["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  declined: "destructive",
  cancelled: "outline",
  shipped: "default",
  completed: "default",
};

function ListingPreview({ title, brand, size, price, photo }: {
  title?: string;
  brand?: string;
  size?: string;
  price?: number;
  photo?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {photo && <img src={photo} alt={title ?? ""} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title ?? "Listing removed"}</p>
        <p className="text-xs text-muted-foreground">
          {brand ?? "—"} · {size ?? "—"} · {price != null ? `$${price}` : "—"}
        </p>
      </div>
    </div>
  );
}

export default function TradesPage() {
  const [me, setMe] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateTrade = useUpdateTrade();

  useEffect(() => {
    setMe(loadPreferences().displayName.trim());
  }, []);

  const { data: trades, isLoading } = useListTrades(
    { user: me },
    {
      query: {
        enabled: me.length > 0,
        queryKey: getListTradesQueryKey({ user: me }),
      },
    },
  );

  const inbox = useMemo(() => (trades ?? []).filter((t) => t.toUser === me), [trades, me]);
  const outbox = useMemo(() => (trades ?? []).filter((t) => t.fromUser === me), [trades, me]);

  const act = (trade: Trade, action: "accept" | "decline" | "cancel" | "pay_shipping" | "mark_shipped") => {
    updateTrade.mutate(
      { id: trade.id, data: { actorName: me, action } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey({ user: me }) });
          const messages: Record<typeof action, string> = {
            accept: "Trade accepted. Both parties can now pay shipping.",
            decline: "Trade declined.",
            cancel: "Trade cancelled.",
            pay_shipping: "Shipping paid. Mark as shipped once you've sent the item.",
            mark_shipped: "Marked as shipped.",
          };
          toast({ title: "Trade updated", description: messages[action] });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? "Action failed.";
          toast({ title: "Could not update", description: msg, variant: "destructive" });
        },
      },
    );
  };

  const renderTrade = (trade: Trade, side: "inbox" | "outbox") => {
    const isInbox = side === "inbox";
    const myShippingPaid = isInbox ? trade.toShippingPaid : trade.fromShippingPaid;
    const otherShippingPaid = isInbox ? trade.fromShippingPaid : trade.toShippingPaid;
    const myShipped = isInbox ? trade.toShipped : trade.fromShipped;
    const otherShipped = isInbox ? trade.fromShipped : trade.toShipped;
    const counterparty = isInbox ? trade.fromUser : trade.toUser;
    const myItem = isInbox ? trade.requestedListing : trade.offeredListing;
    const theirItem = isInbox ? trade.offeredListing : trade.requestedListing;

    return (
      <Card key={trade.id} className="border-border/70">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {isInbox ? `${counterparty} wants to trade` : `You proposed to ${counterparty}`}
              </span>
            </div>
            <Badge variant={statusVariant[trade.status]} className="rounded-full">
              {statusLabel[trade.status]}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {isInbox ? "They send" : "You send"}
              </p>
              <ListingPreview
                title={theirItem?.title}
                brand={theirItem?.brand}
                size={theirItem?.size}
                price={theirItem?.price}
                photo={isInbox ? theirItem?.proof?.frontPhoto : myItem?.proof?.frontPhoto}
              />
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {isInbox ? "You send" : "They send"}
              </p>
              <ListingPreview
                title={myItem?.title}
                brand={myItem?.brand}
                size={myItem?.size}
                price={myItem?.price}
                photo={isInbox ? myItem?.proof?.frontPhoto : theirItem?.proof?.frontPhoto}
              />
            </div>
          </div>

          {trade.message && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">
              "{trade.message}"
            </p>
          )}

          {(trade.status === "accepted" || trade.status === "shipped") && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`rounded-lg border p-2 ${myShippingPaid ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <p className="font-semibold">You</p>
                <p className="text-muted-foreground">
                  {myShippingPaid ? "Shipping paid · $8" : "Shipping unpaid"}
                </p>
                <p className="text-muted-foreground">{myShipped ? "Shipped" : "Not shipped yet"}</p>
              </div>
              <div className={`rounded-lg border p-2 ${otherShippingPaid ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <p className="font-semibold">{counterparty}</p>
                <p className="text-muted-foreground">
                  {otherShippingPaid ? "Shipping paid · $8" : "Shipping unpaid"}
                </p>
                <p className="text-muted-foreground">{otherShipped ? "Shipped" : "Not shipped yet"}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {trade.status === "pending" && isInbox && (
              <>
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => act(trade, "accept")}
                  disabled={updateTrade.isPending}
                  data-testid={`button-accept-trade-${trade.id}`}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => act(trade, "decline")}
                  disabled={updateTrade.isPending}
                  data-testid={`button-decline-trade-${trade.id}`}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Decline
                </Button>
              </>
            )}
            {trade.status === "pending" && !isInbox && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => act(trade, "cancel")}
                disabled={updateTrade.isPending}
              >
                Cancel request
              </Button>
            )}
            {(trade.status === "accepted" || trade.status === "shipped") && !myShippingPaid && (
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => act(trade, "pay_shipping")}
                disabled={updateTrade.isPending}
                data-testid={`button-pay-shipping-${trade.id}`}
              >
                <CreditCard className="mr-1 h-3.5 w-3.5" /> Pay $8 shipping
              </Button>
            )}
            {(trade.status === "accepted" || trade.status === "shipped") && myShippingPaid && !myShipped && (
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => act(trade, "mark_shipped")}
                disabled={updateTrade.isPending}
                data-testid={`button-mark-shipped-${trade.id}`}
              >
                <Truck className="mr-1 h-3.5 w-3.5" /> Mark as shipped
              </Button>
            )}
            {trade.status === "completed" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <PackageCheck className="h-3.5 w-3.5" /> Both items shipped
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trades</p>
          <h1 className="mt-2 text-3xl font-medium md:text-5xl">Closet swaps</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trade pieces with other closets. Both parties only pay $8 shipping — no item price.
          </p>
        </div>

        {!me ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Set up your closet first.{" "}
              <Link href="/welcome" className="text-foreground underline">Set up now</Link>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading trades...
          </div>
        ) : (trades ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No trades yet. Propose a trade from any listing's detail page.
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="font-serif text-xl font-medium">Inbox · {inbox.length}</h2>
              {inbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incoming trade requests.</p>
              ) : (
                inbox.map((t) => renderTrade(t, "inbox"))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl font-medium">Sent · {outbox.length}</h2>
              {outbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outgoing trade requests.</p>
              ) : (
                outbox.map((t) => renderTrade(t, "outbox"))
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
