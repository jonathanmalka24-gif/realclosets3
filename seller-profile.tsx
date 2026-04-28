import { Link, useParams } from "wouter";
import { useGetSellerProfile } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { FollowButton } from "@/components/follow-button";
import { ArrowLeft, Loader2, Users, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function SellerProfile() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name ?? "");
  const { data: profile, isLoading, isError } = useGetSellerProfile(name);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading {name}'s closet...
        </div>
      </Layout>
    );
  }

  if (isError || !profile) {
    return (
      <Layout>
        <div className="py-20 text-center text-muted-foreground">
          <p>We couldn't find {name}'s closet.</p>
          <Link href="/" className="mt-3 inline-block text-foreground underline">
            Back to browsing
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to browsing
        </Link>
      </div>

      <Card className="mb-6 overflow-hidden border-border/70">
        <CardContent className="space-y-5 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-secondary/40 to-primary/20 font-serif text-2xl text-foreground border border-border shadow-sm">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-medium text-foreground">{profile.name}</h1>
                {profile.isVerifiedSeller && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200"
                    title="Completed 50+ verified sales"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Seller
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                On RealClosets since {formatDistanceToNow(new Date(profile.joinedAt))} ago
              </p>
            </div>
            <FollowButton sellerName={profile.name} isFollowing={profile.isFollowing} size="default" />
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-foreground">
              <Users className="h-3.5 w-3.5" />
              {profile.followerCount} follower{profile.followerCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-foreground">{profile.listingCount} listed</span>
            <span className="rounded-full bg-muted px-3 py-1 text-foreground">{profile.soldCount} sold</span>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium">Their pieces</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {profile.listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </Layout>
  );
}
