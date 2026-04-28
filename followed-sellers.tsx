import { Link } from "wouter";
import { useListFollowedSellers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/follow-button";
import { Heart, Loader2, Users } from "lucide-react";

export function FollowedSellers() {
  const { data: sellers, isLoading } = useListFollowedSellers();

  return (
    <Card className="overflow-hidden border-border/70">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary/20 text-secondary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium">People you follow</h2>
            <p className="text-sm text-muted-foreground">
              Closets you trust. New listings show up first.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : sellers && sellers.length > 0 ? (
          <ul className="space-y-3">
            {sellers.map((seller) => (
              <li
                key={seller.name}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
              >
                <Link
                  href={`/sellers/${encodeURIComponent(seller.name)}`}
                  className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-secondary/40 to-primary/20 font-serif text-base text-foreground border border-border"
                >
                  {seller.name.charAt(0)}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/sellers/${encodeURIComponent(seller.name)}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {seller.name}
                  </Link>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {seller.followerCount} follower{seller.followerCount === 1 ? "" : "s"} · {seller.listingCount} listed
                  </p>
                </div>
                <FollowButton sellerName={seller.name} isFollowing={seller.isFollowing} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven't followed anyone yet. Tap a seller's name on any listing to follow their closet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
