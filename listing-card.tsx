import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@workspace/api-client-react";
import { ShieldCheck, Rocket, Heart } from "lucide-react";
import { isFavorited, toggleFavorite } from "@/lib/favorites";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.proof?.frontPhoto || `https://api.dicebear.com/7.x/shapes/svg?seed=${listing.id}&backgroundColor=E5E0D8`;
  const isBoosted = Boolean(listing.boostedUntil && new Date(listing.boostedUntil) > new Date());
  const discount = listing.discountPercent ?? 0;
  const finalPrice = discount > 0
    ? Math.round((listing.price * (100 - discount)) / 100 * 100) / 100
    : listing.price;

  const [favorited, setFavorited] = useState(false);
  useEffect(() => {
    setFavorited(isFavorited(listing.id));
    const onChange = () => setFavorited(isFavorited(listing.id));
    window.addEventListener("realclosets-favorites-changed", onChange);
    return () => window.removeEventListener("realclosets-favorites-changed", onChange);
  }, [listing.id]);

  const onHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <Link href={`/listings/${listing.id}`} className="block">
          <Card className="overflow-hidden border-0 bg-transparent shadow-none">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/50 bg-muted">
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {listing.status === "sold" && (
                <Badge className="absolute left-3 top-3 border-0 bg-foreground text-background shadow-sm">SOLD</Badge>
              )}
              {discount > 0 && listing.status !== "sold" && (
                <Badge className="absolute left-3 top-3 border-0 bg-rose-500 text-white shadow-sm">
                  -{discount}%
                </Badge>
              )}
              {listing.verificationStatus === "verified" && (
                <Badge className="absolute right-3 bottom-3 gap-1 border-0 bg-background/90 text-foreground shadow-sm">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  Verified
                </Badge>
              )}
              {isBoosted && (
                <Badge className="absolute left-3 bottom-3 gap-1 border-0 bg-secondary text-secondary-foreground shadow-sm">
                  <Rocket className="h-3 w-3" />
                  Boosted
                </Badge>
              )}
            </div>
            <CardContent className="px-0 pt-3">
              <p className="text-sm font-medium text-foreground line-clamp-1">{listing.title}</p>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground line-clamp-1">
                {listing.brand} · Size {listing.size}
              </p>
              <p className="mt-2 flex items-baseline gap-2 font-serif text-base font-semibold text-foreground">
                <span data-testid={`price-${listing.id}`}>${finalPrice}</span>
                {discount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground line-through">
                    ${listing.price}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </Link>
        <button
          type="button"
          onClick={onHeart}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorited}
          data-favorited={favorited ? "true" : "false"}
          data-testid={`button-favorite-${listing.id}`}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-sm transition hover:scale-105"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              favorited ? "fill-rose-500 text-rose-500" : "text-foreground"
            }`}
          />
        </button>
      </div>
      <Link
        href={`/sellers/${encodeURIComponent(listing.sellerName)}`}
        className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary/30 font-serif text-[11px] font-semibold text-foreground">
          {listing.sellerName.charAt(0)}
        </span>
        <span className="font-medium text-foreground">{listing.sellerName}</span>
        <span>·</span>
        <span className="line-clamp-1">{listing.wornCount}</span>
      </Link>
    </div>
  );
}
