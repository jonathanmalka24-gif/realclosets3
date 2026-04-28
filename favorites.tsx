import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListListings } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { loadFavorites } from "@/lib/favorites";

export default function FavoritesPage() {
  const [ids, setIds] = useState<string[]>(() => loadFavorites());
  useEffect(() => {
    const onChange = () => setIds(loadFavorites());
    window.addEventListener("realclosets-favorites-changed", onChange);
    return () => window.removeEventListener("realclosets-favorites-changed", onChange);
  }, []);

  const { data: all = [], isLoading } = useListListings();
  const favorites = all.filter((l) => ids.includes(l.id));

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
          <h1 className="font-serif text-3xl font-medium">Favorites</h1>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-serif text-xl">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any listing to save it here.
            </p>
            <Link href="/">
              <Button className="mt-4">Browse listings</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favorites.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
