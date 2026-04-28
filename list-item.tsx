import { Layout } from "@/components/layout";
import { CreateListingDialog } from "@/components/create-listing-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Camera, Plus, ShieldCheck, Sparkles, Video } from "lucide-react";

const pillars = [
  {
    icon: Camera,
    title: "Proof of ownership",
    copy: "Front, back, tag, and in-app motion capture make stolen photos and recycled listings much harder.",
  },
  {
    icon: BadgeCheck,
    title: "Dynamic verification code",
    copy: "Each listing can require a random code shown in-frame so the item is proven to be in-hand right now.",
  },
  {
    icon: ShieldCheck,
    title: "Closet realism checks",
    copy: "The app looks for repeated sizes, duplicate tags, and inventory-like patterns instead of personal style.",
  },
];

const philosophy = [
  "Only true secondhand items. No dropshipping. No bulk reseller energy.",
  "Add friction where it hurts resellers, not normal people cleaning out their closet.",
  "Human details like why you're selling and how often you wore it make buyers trust the person behind the piece.",
];

export default function ListItem() {
  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,#f4efe6_0%,#fff9f2_45%,#f2ede3_100%)] p-8 shadow-sm md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-primary">List an item</p>
              <h1 className="font-serif text-4xl font-medium leading-tight text-foreground md:text-6xl">
                Real closets, not stores.
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                This listing flow is built around the file you shared: ownership proof, human seller context,
                and anti-reseller mechanics that keep the marketplace personal.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="rounded-full border border-foreground/10 bg-background/80 px-4 py-2 text-sm text-foreground">
                  Only true secondhand
                </div>
                <div className="rounded-full border border-foreground/10 bg-background/80 px-4 py-2 text-sm text-foreground">
                  In-app camera capture
                </div>
                <div className="rounded-full border border-foreground/10 bg-background/80 px-4 py-2 text-sm text-foreground">
                  Trust-based listing limits
                </div>
              </div>
            </div>

            <Card className="rounded-[1.75rem] border-border/70 bg-background/85 shadow-sm backdrop-blur">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Seller promise
                    </p>
                    <h2 className="font-serif text-2xl text-foreground">From someone&apos;s actual closet</h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Buyers should feel like they are meeting a real person, not scrolling warehouse inventory.
                </p>
                <CreateListingDialog>
                  <Button size="lg" className="w-full rounded-full font-semibold shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Start listing
                  </Button>
                </CreateListingDialog>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/80 shadow-sm">
          <CardContent className="space-y-6 p-6 md:p-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">How the system works</p>
              <h2 className="font-serif text-3xl text-foreground">Friction where resellers feel it</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {pillars.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="rounded-2xl bg-muted/60 p-4">
                  <Icon className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl border-border/70">
            <CardContent className="space-y-5 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-2xl text-foreground">What makes this feel different</h2>
              </div>
              <div className="space-y-3">
                {philosophy.map((item) => (
                  <p key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/70 bg-foreground text-background">
            <CardContent className="space-y-4 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-background/70">Positioning</p>
              <h2 className="font-serif text-3xl">No resellers. No stores. Just real people.</h2>
              <p className="text-sm leading-relaxed text-background/80">
                More personal than a generic marketplace, with enough systems behind the scenes to reward real
                closets and slow down fake supply.
              </p>
              <CreateListingDialog>
                <Button size="lg" variant="secondary" className="rounded-full font-semibold">
                  <Plus className="mr-2 h-4 w-4" />
                  Open the seller flow
                </Button>
              </CreateListingDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
