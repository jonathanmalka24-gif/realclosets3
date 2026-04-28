import { useListListings } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: listings, isLoading } = useListListings();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-medium leading-tight text-foreground md:text-3xl">
          RealClosets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          From their closet to yours.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[3/4] rounded-2xl bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Loading closets...</p>
        </div>
      )}
    </Layout>
  );
}
