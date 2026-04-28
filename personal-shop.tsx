import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGetSellerProfile, getGetSellerProfileQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { CreateListingDialog } from "@/components/create-listing-dialog";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Star, Users, ShieldCheck, Camera, Pencil, Loader2, Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { loadPreferences, type ClosetPreferences } from "@/lib/preferences";

function ReferralCodePill({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };
  return (
    <div className="flex items-center gap-2 self-start">
      <code
        className="rounded-full border border-amber-300/60 bg-background px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-foreground"
        data-testid="referral-code"
      >
        {code}
      </code>
      <Button size="sm" variant="outline" className="rounded-full" onClick={onCopy} data-testid="button-copy-referral">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-2" data-testid="shop-rating">
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < full;
          const half = i === full && hasHalf;
          return (
            <Star
              key={i}
              className={`h-4 w-4 ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : half
                    ? "fill-amber-400/50 text-amber-400"
                    : "text-muted-foreground/40"
              }`}
            />
          );
        })}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">
        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
      </span>
    </div>
  );
}

export default function PersonalShop() {
  const [prefs, setPrefs] = useState<ClosetPreferences | null>(null);
  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const me = prefs?.displayName.trim() ?? "";
  const { data: profile, isLoading } = useGetSellerProfile(me, {
    query: { enabled: me.length > 0, queryKey: getGetSellerProfileQueryKey(me) },
  });

  if (!prefs) return null;

  const avatar = prefs.profilePicture;
  const shopName = me;
  const bio = prefs.description || profile?.bio || "";

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden border-border/70">
          <CardContent className="space-y-5 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {avatar ? (
                  <img src={avatar} alt={shopName} className="h-full w-full object-cover" data-testid="shop-avatar" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <Camera className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="font-serif text-2xl font-medium md:text-3xl"
                    data-testid="shop-name"
                  >
                    {shopName || "Your shop"}
                  </h1>
                  {profile?.isVerifiedSeller && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2.5 py-0.5 text-xs font-medium text-emerald-900"
                      title="Completed 50+ verified sales"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified Seller
                    </span>
                  )}
                </div>

                <StarRating
                  rating={profile?.rating ?? 5}
                  reviewCount={profile?.reviewCount ?? 0}
                />

                <div className="flex flex-wrap gap-3 text-sm">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-foreground"
                    data-testid="shop-followers"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <strong className="font-semibold">{profile?.followerCount ?? 0}</strong>
                    <span className="text-muted-foreground">followers</span>
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-foreground"
                    data-testid="shop-following"
                  >
                    <strong className="font-semibold">{profile?.followingCount ?? 0}</strong>
                    <span className="text-muted-foreground">following</span>
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                    <strong className="font-semibold">{profile?.listingCount ?? 0}</strong>{" "}
                    <span className="text-muted-foreground">listed</span>
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                    <strong className="font-semibold">{profile?.soldCount ?? 0}</strong>{" "}
                    <span className="text-muted-foreground">sold</span>
                  </span>
                </div>

                {bio && (
                  <p className="text-sm text-muted-foreground" data-testid="shop-bio">
                    {bio}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                <Link href="/welcome">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit shop
                  </Button>
                </Link>
                <CreateListingDialog>
                  <Button size="sm" className="rounded-full" data-testid="button-list-item">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    List an item
                  </Button>
                </CreateListingDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {profile?.referralCode && (
          <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/20 dark:to-rose-950/20">
            <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-700">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium">Your referral code</h3>
                  <p className="text-sm text-muted-foreground">
                    Share with friends. When they sign up & we approve it, you earn store credit.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Credit balance:{" "}
                    <strong className="font-semibold text-foreground" data-testid="credit-balance">
                      ${(profile.creditBalance ?? 0).toFixed(2)}
                    </strong>
                  </p>
                </div>
              </div>
              <ReferralCodePill code={profile.referralCode} />
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-medium">Your pieces</h2>
            {profile && profile.listings.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {profile.listings.length} item{profile.listings.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {isLoading && me ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your shop…
            </div>
          ) : !profile || profile.listings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <p className="font-serif text-lg">Your closet is empty</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  List your first piece — front, back, tag, and a short motion clip prove it's really yours.
                </p>
                <CreateListingDialog>
                  <Button className="mt-2 rounded-full">
                    <Plus className="mr-1.5 h-4 w-4" />
                    List your first item
                  </Button>
                </CreateListingDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {profile.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
