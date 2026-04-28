import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SavedSearches } from "@/components/saved-searches";
import { FollowedSellers } from "@/components/followed-sellers";
import { Pencil, Sparkles, Heart } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  STYLE_OPTIONS,
  loadPreferences,
  type ClosetPreferences,
} from "@/lib/preferences";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

function PreferencesCard({ prefs }: { prefs: ClosetPreferences }) {
  const styleLabels = STYLE_OPTIONS.filter((s) => prefs.styles.includes(s.value));
  const categoryLabels = CATEGORY_OPTIONS.filter((c) => prefs.favoriteCategories.includes(c.value));
  const totalSizes = prefs.sizes.tops.length + prefs.sizes.bottoms.length + prefs.sizes.shoes.length;
  const isEmpty =
    prefs.favoriteBrands.length === 0 &&
    styleLabels.length === 0 &&
    categoryLabels.length === 0 &&
    totalSizes === 0 &&
    !prefs.displayName;

  return (
    <Card className="border-border/70">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium">Your closet preferences</h2>
              <p className="text-sm text-muted-foreground">
                What we use to surface pieces and people you'll actually love.
              </p>
            </div>
          </div>
          <Link href="/welcome">
            <Button variant="outline" size="sm" className="rounded-full" data-testid="button-edit-preferences">
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
        </div>

        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              You haven't set up your closet yet.
            </p>
            <Link href="/welcome">
              <Button className="mt-3 rounded-full">Set up my closet</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {prefs.displayName && (
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  {prefs.profilePicture ? (
                    <img src={prefs.profilePicture} alt={prefs.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-serif text-lg text-muted-foreground">
                      {prefs.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Closet name</p>
                  <p className="font-medium" data-testid="text-display-name">{prefs.displayName}</p>
                </div>
              </div>
            )}

            {prefs.description && (
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Bio</p>
                <p className="text-sm text-foreground" data-testid="text-closet-bio">{prefs.description}</p>
              </div>
            )}

            {prefs.favoriteBrands.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Favorite brands · {prefs.favoriteBrands.length}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.favoriteBrands.map((b) => (
                    <Pill key={b}>{b}</Pill>
                  ))}
                </div>
              </div>
            )}

            {styleLabels.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {styleLabels.map((s) => (
                    <Pill key={s.value}>
                      <span className="mr-1">{s.emoji}</span>
                      {s.label}
                    </Pill>
                  ))}
                </div>
              </div>
            )}

            {categoryLabels.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Hunting for</p>
                <div className="flex flex-wrap gap-1.5">
                  {categoryLabels.map((c) => (
                    <Pill key={c.value}>{c.label}</Pill>
                  ))}
                </div>
              </div>
            )}

            {totalSizes > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {prefs.sizes.tops.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Top sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.sizes.tops.map((s) => <Pill key={`t-${s}`}>{s}</Pill>)}
                    </div>
                  </div>
                )}
                {prefs.sizes.bottoms.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Bottom sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.sizes.bottoms.map((s) => <Pill key={`b-${s}`}>{s}</Pill>)}
                    </div>
                  </div>
                )}
                {prefs.sizes.shoes.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Shoe sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prefs.sizes.shoes.map((s) => <Pill key={`s-${s}`}>{s}</Pill>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Account() {
  const [prefs, setPrefs] = useState<ClosetPreferences | null>(null);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Account</p>
          <h1 className="mt-2 text-3xl font-medium md:text-5xl">Your closet identity</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your preferences, saved searches, and the sellers you follow live here. Once you list items, your closet will show up too.
          </p>
        </div>

        {prefs && <PreferencesCard prefs={prefs} />}

        <Card className="border-border/70">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-medium">Favorites</h2>
                <p className="text-sm text-muted-foreground">
                  Pieces you've saved for later.
                </p>
              </div>
            </div>
            <Link href="/favorites">
              <Button variant="outline" size="sm" className="rounded-full" data-testid="link-favorites">
                View favorites
              </Button>
            </Link>
          </CardContent>
        </Card>

        <FollowedSellers />

        <SavedSearches />
      </div>
    </Layout>
  );
}
