import { useParams, Link } from "wouter";
import {
  useGetListing,
  useUpdateListing,
  useGetSellerProfile,
  useListListingOffers,
  useBoostListing,
  getGetListingQueryKey,
  getListListingsQueryKey,
} from "@workspace/api-client-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OfferDialog } from "@/components/offer-dialog";
import { TradeDialog } from "@/components/trade-dialog";
import { FollowButton } from "@/components/follow-button";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, ShieldCheck, ShieldAlert, Clock, Info, Check, X,
  ShoppingBag, Sparkles, MapPin, Tag, Box, Camera, Video, Rocket, Loader2, ArrowLeftRight, Percent
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { loadPreferences } from "@/lib/preferences";

function DiscountEditor({
  currentDiscount,
  onSave,
}: {
  currentDiscount: number;
  onSave: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(currentDiscount));
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(String(currentDiscount));
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mb-6 rounded-full"
          data-testid="button-edit-discount"
        >
          <Percent className="mr-1.5 h-3.5 w-3.5" />
          {currentDiscount > 0 ? `Discount: ${currentDiscount}%` : "Set discount"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set a discount</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="discount">Discount percent (0–90)</Label>
          <Input
            id="discount"
            type="number"
            min={0}
            max={90}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="input-discount"
          />
          <p className="text-xs text-muted-foreground">
            Set to 0 to remove the discount.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            data-testid="button-save-discount"
            onClick={() => {
              const n = Math.max(0, Math.min(90, Math.round(Number(value) || 0)));
              onSave(n);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, isError } = useGetListing(id || "");
  const updateListing = useUpdateListing();
  const boostListing = useBoostListing();
  const { data: offers } = useListListingOffers(id || "");
  const { data: sellerProfile } = useGetSellerProfile(listing?.sellerName ?? "");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const me = useMemo(() => loadPreferences().displayName.trim(), []);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
            <div className="flex gap-4">
              <Skeleton className="w-24 h-24 rounded-xl" />
              <Skeleton className="w-24 h-24 rounded-xl" />
              <Skeleton className="w-24 h-24 rounded-xl" />
            </div>
          </div>
          <div className="space-y-8 py-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !listing) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif font-medium mb-2">Listing not found</h2>
          <p className="text-muted-foreground mb-6">This item might have been removed or sold.</p>
          <Link href="/">
            <Button className="rounded-full">Back to Marketplace</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleUpdateStatus = (status: "active" | "flagged" | "sold") => {
    updateListing.mutate({
      id: listing.id,
      data: { status, actorName: me }
    }, {
      onSuccess: (data) => {
        // Optimistic cache update
        queryClient.setQueryData(getGetListingQueryKey(listing.id), data);
        toast({
          title: "Listing updated",
          description: `Status changed to ${status}.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not update listing status.",
          variant: "destructive",
        });
      }
    });
  };

  const handleBoost = () => {
    if (!listing) return;
    boostListing.mutate(
      { id: listing.id, data: { sellerName: listing.sellerName } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetListingQueryKey(listing.id), data);
          queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
          toast({
            title: "Listing boosted",
            description: `Your item is now featured for 7 days. Charged $${(Math.round(listing.price * 0.10 * 100) / 100).toFixed(2)}.`,
          });
        },
        onError: () => {
          toast({
            title: "Boost failed",
            description: "Could not boost this listing. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleVerify = (verificationStatus: "verified" | "flagged") => {
    updateListing.mutate({
      id: listing.id,
      data: { verificationStatus, actorName: me }
    }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetListingQueryKey(listing.id), data);
        toast({
          title: "Verification updated",
          description: `Listing marked as ${verificationStatus}.`,
        });
      },
    });
  };

  const imageUrl = listing.proof?.frontPhoto || `https://api.dicebear.com/7.x/shapes/svg?seed=${listing.id}&backgroundColor=E5E0D8`;
  const boostCost = Math.round(listing.price * 0.10 * 100) / 100;
  const isBoosted = Boolean(listing.boostedUntil && new Date(listing.boostedUntil) > new Date());
  const isOwner = me.length > 0 && me === listing.sellerName;
  const discount = listing.discountPercent ?? 0;
  const finalPrice = discount > 0
    ? Math.round((listing.price * (100 - discount)) / 100 * 100) / 100
    : listing.price;

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to browsing
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
        {/* Left Column: Media */}
        <div className="space-y-6">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted border border-border shadow-sm">
            <img 
              src={imageUrl} 
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            
            {/* Status Overlays */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {listing.verificationStatus === "verified" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Badge className="cursor-pointer bg-primary text-primary-foreground border-0 shadow-sm gap-1.5 pl-2 py-1 text-sm font-medium">
                        <ShieldCheck className="w-4 h-4" />
                        Verified Authentic
                        <Info className="ml-1 h-3 w-3 opacity-80" />
                      </Badge>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm" side="bottom" align="start">
                    <p className="font-semibold mb-2">How camera proof works</p>
                    <p className="text-muted-foreground mb-3">
                      Every seller films their item live with four required captures so buyers know it actually exists in their closet.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span><span className="font-medium">Front + code</span> &mdash; the item beside a handwritten verification phrase.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span><span className="font-medium">Back</span> &mdash; reverse view to show real wear.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span><span className="font-medium">Tag</span> &mdash; brand and size label up close.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Video className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span><span className="font-medium">Motion</span> &mdash; a short video of the item moving in their hands.</span>
                      </li>
                    </ul>
                  </PopoverContent>
                </Popover>
              )}
              {listing.verificationStatus === "needs_review" && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground border-0 shadow-sm gap-1.5 pl-2 py-1 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Pending Review
                </Badge>
              )}
              {listing.verificationStatus === "flagged" && (
                <Badge variant="destructive" className="shadow-sm gap-1.5 pl-2 py-1 text-sm font-medium">
                  <ShieldAlert className="w-4 h-4" />
                  Flagged
                </Badge>
              )}
              {listing.status === "sold" && (
                <Badge className="bg-foreground text-background border-0 shadow-sm py-1 px-3 text-sm tracking-wider">
                  SOLD
                </Badge>
              )}
            </div>

            {/* Proof Code Display */}
            {listing.verificationCode && (
              <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border shadow-sm text-xs font-medium text-foreground flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-muted-foreground" />
                Code: <span className="font-mono bg-muted px-1 rounded">{listing.verificationCode}</span>
              </div>
            )}
          </div>

          {/* Mock Gallery */}
          <div className="grid grid-cols-4 gap-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border border-primary">
              <img src={imageUrl} alt="Front" className="w-full h-full object-cover opacity-80" />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium">Back</span>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium">Tags</span>
            </div>
            {listing.proof?.motionVideo && (
              <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border flex flex-col items-center justify-center gap-1">
                <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm">
                  <div className="w-2 h-2 rounded-sm bg-foreground ml-0.5" style={{clipPath: "polygon(0 0, 0 100%, 100% 50%)"}} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Video</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col py-4">
          <div className="mb-8">
            <h2 className="text-lg font-medium text-muted-foreground mb-1 uppercase tracking-wider">{listing.brand}</h2>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4 leading-tight">
              {listing.title}
            </h1>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-serif font-semibold text-foreground" data-testid="detail-price">
                ${finalPrice}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through">${listing.price}</span>
                  <Badge className="border-0 bg-rose-500 text-white" data-testid="discount-badge">
                    -{discount}%
                  </Badge>
                </>
              )}
            </div>
            {isOwner && listing.status === "active" && (
              <DiscountEditor
                currentDiscount={discount}
                onSave={(value) =>
                  updateListing.mutate(
                    { id: listing.id, data: { discountPercent: value, actorName: me } },
                    {
                      onSuccess: (data) => {
                        queryClient.setQueryData(getGetListingQueryKey(listing.id), data);
                        queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
                        toast({
                          title: value > 0 ? "Discount applied" : "Discount removed",
                          description:
                            value > 0
                              ? `${value}% off until you remove it.`
                              : "Listing back to full price.",
                        });
                      },
                      onError: () =>
                        toast({
                          title: "Couldn't update discount",
                          variant: "destructive",
                        }),
                    },
                  )
                }
              />
            )}

            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="rounded-full px-3 font-medium bg-background">
                Size: {listing.size}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 font-medium bg-background">
                {listing.condition}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 font-medium bg-background text-muted-foreground">
                {listing.category}
              </Badge>
            </div>
          </div>

          <div className="h-px w-full bg-border mb-8"></div>

          {/* Seller Context - The "Real Closets" difference */}
          <div className="bg-secondary/5 rounded-3xl p-6 md:p-8 border border-secondary/10 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-24 h-24 text-secondary" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <Link
                  href={`/sellers/${encodeURIComponent(listing.sellerName)}`}
                  className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-secondary/40 to-primary/20 font-serif text-xl text-foreground border border-border shadow-sm"
                >
                  {listing.sellerName.charAt(0)}
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/sellers/${encodeURIComponent(listing.sellerName)}`}
                    className="font-serif text-xl font-medium text-foreground hover:underline"
                  >
                    {listing.sellerName}
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {sellerProfile
                      ? `${sellerProfile.followerCount} follower${sellerProfile.followerCount === 1 ? "" : "s"} · ${sellerProfile.listingCount} listed`
                      : "True secondhand seller"}
                  </p>
                </div>
                {sellerProfile && (
                  <FollowButton sellerName={listing.sellerName} isFollowing={sellerProfile.isFollowing} />
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">The Story</h4>
                  <p className="text-foreground leading-relaxed">"{listing.whySelling}"</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">History</h4>
                  <div className="flex items-center gap-2 text-sm text-foreground bg-background/50 px-4 py-2.5 rounded-xl border border-border/50 inline-flex">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{listing.wornCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Authenticity Section */}
          <div className="mb-10 space-y-4">
            <h3 className="font-serif font-medium text-lg border-b border-border pb-2">Authenticity Checks</h3>
            
            {listing.trustSignals && listing.trustSignals.length > 0 ? (
              <ul className="space-y-3">
                {listing.trustSignals.map((signal, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <span className="mt-0.5">{signal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No specific trust signals gathered yet.</p>
            )}

            {listing.riskFlags && listing.riskFlags.length > 0 && (
              <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  Risk Flags Detected
                </div>
                <ul className="space-y-1">
                  {listing.riskFlags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-destructive/80 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-destructive/50 mt-2 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="mt-auto space-y-6">
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 rounded-full text-base shadow-sm"
                disabled={listing.status !== "active" || listing.verificationStatus === "flagged"}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {listing.status === "sold" ? "Already Sold" : "Buy Now"}
              </Button>
              <OfferDialog
                listingId={listing.id}
                askingPrice={listing.price}
                sellerName={listing.sellerName}
                disabled={listing.status !== "active"}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base"
                  disabled={listing.status !== "active"}
                >
                  Make Offer
                </Button>
              </OfferDialog>
              <TradeDialog
                requestedListingId={listing.id}
                requestedListingTitle={listing.title}
                sellerName={listing.sellerName}
                disabled={listing.status !== "active"}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base"
                  disabled={listing.status !== "active"}
                  data-testid="button-open-trade-dialog"
                >
                  <ArrowLeftRight className="w-5 h-5 mr-2" />
                  Trade
                </Button>
              </TradeDialog>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary-foreground">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isBoosted ? "Boosted listing" : "Boost this listing"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isBoosted
                        ? `Featured for ${formatDistanceToNow(new Date(listing.boostedUntil!))} more`
                        : `Featured at the top of the home feed for 7 days. Cost: $${boostCost.toFixed(2)} (10% of price).`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isBoosted ? "outline" : "secondary"}
                  className="rounded-full whitespace-nowrap"
                  onClick={handleBoost}
                  disabled={boostListing.isPending || isBoosted || listing.status !== "active"}
                >
                  {boostListing.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  {isBoosted ? "Active" : `Boost · $${boostCost.toFixed(2)}`}
                </Button>
              </div>
            </div>

            {offers && offers.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent offers
                </p>
                <ul className="space-y-2 text-sm">
                  {offers.slice(0, 3).map((offer) => (
                    <li key={offer.id} className="flex items-center justify-between">
                      <span className="text-foreground">
                        <span className="font-medium">{offer.buyerName}</span> offered ${offer.amount}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{offer.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Listed {formatDistanceToNow(new Date(listing.createdAt))} ago
            </p>

            {/* Moderation Controls (would normally be hidden behind admin role) */}
            <div className="pt-8 border-t border-border mt-8">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Community Moderation Tools
              </h4>
              
              <div className="space-y-4">
                {listing.verificationStatus === "needs_review" && (
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleVerify("verified")}
                      className="text-primary border-primary/20 hover:bg-primary/5 hover:text-primary rounded-full"
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleVerify("flagged")}
                      className="text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive rounded-full"
                    >
                      <X className="w-4 h-4 mr-1" /> Flag as Fake
                    </Button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {listing.status === "active" ? (
                    <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus("sold")} className="rounded-full">
                      Mark as Sold
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus("active")} className="rounded-full">
                      Reactivate Listing
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
