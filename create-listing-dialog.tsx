import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getGetSellerVerificationQueryKey,
  getListListingsQueryKey,
  useCreateListing,
  useGetSellerVerification,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Tag,
  Video,
} from "lucide-react";

const ACTIVE_LISTING_LIMIT = 12;

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  brand: z.string().min(1, "Brand is required"),
  size: z.string().min(1, "Size is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  condition: z.string().min(1, "Condition is required"),
  sellerName: z.string().min(1, "Your name is required"),
  whySelling: z.string().min(12, "Tell buyers a little more about why you're selling this"),
  wornCount: z.string().min(1, "Estimate how many times you've worn it"),
  closetContext: z.string().min(10, "Share how this item fit into your closet"),
  stylingNotes: z.string().min(8, "Add a quick note about how you wore it"),
  codeIncluded: z.boolean().default(false),
  capturedFront: z.boolean().default(false),
  capturedBack: z.boolean().default(false),
  capturedTag: z.boolean().default(false),
  capturedMotion: z.boolean().default(false),
  captureOnly: z.boolean().default(true),
  hasMirrorPhoto: z.boolean().default(false),
  agreesToLimit: z.boolean().refine(Boolean, "You need to confirm the closet-only rule"),
});

type FormValues = z.infer<typeof formSchema>;

const conditions = [
  "New with tags",
  "New without tags",
  "Excellent",
  "Good",
  "Fair - needs love",
];

const categories = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Vintage",
];

const wornCounts = [
  "Never worn",
  "Tried on once",
  "Worn 1-5 times",
  "Worn regularly",
  "A wardrobe staple",
];

const riskSignals = [
  "Same brand, style, and size repeated too often",
  "Too many active listings before trust is earned",
  "Reused tags, recycled photos, or tiny edited duplicates",
  "Closets that look like inventory instead of personal style",
];

function ProofTile({
  icon: Icon,
  label,
  description,
  active,
}: {
  icon: typeof Camera;
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border/60 bg-background"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function CreateListingDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createListing = useCreateListing();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      brand: "",
      size: "",
      category: "",
      price: 0,
      condition: "",
      sellerName: "",
      whySelling: "",
      wornCount: "",
      closetContext: "",
      stylingNotes: "",
      codeIncluded: false,
      capturedFront: false,
      capturedBack: false,
      capturedTag: false,
      capturedMotion: false,
      captureOnly: true,
      hasMirrorPhoto: false,
      agreesToLimit: false,
    },
  });

  const sellerName = form.watch("sellerName").trim();
  const [debouncedName, setDebouncedName] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(sellerName), 350);
    return () => clearTimeout(timer);
  }, [sellerName]);

  const { data: verification } = useGetSellerVerification(debouncedName, {
    query: {
      enabled: debouncedName.length > 0,
      queryKey: getGetSellerVerificationQueryKey(debouncedName),
    },
  });

  const isVerifiedSeller = Boolean(verification?.isVerifiedSeller);
  const verificationCode = verification?.verificationCode ?? "";
  const salesUntilVerified = verification?.salesUntilVerified ?? 50;
  const salesCount = verification?.salesCount ?? 0;

  useEffect(() => {
    if (isVerifiedSeller) {
      form.setValue("codeIncluded", true, { shouldValidate: false });
    }
  }, [form, isVerifiedSeller]);

  const proofChecklist = form.watch(["capturedFront", "capturedBack", "capturedTag", "capturedMotion"]);
  const [capturedFront, capturedBack, capturedTag, capturedMotion] = proofChecklist;
  const hasMirrorPhoto = form.watch("hasMirrorPhoto");
  const whySelling = form.watch("whySelling");
  const closetContext = form.watch("closetContext");
  const codeIncluded = form.watch("codeIncluded");
  const proofComplete = proofChecklist.every(Boolean);

  const trustPreview = useMemo(() => {
    let score = 35;
    if (proofComplete) score += 25;
    if (hasMirrorPhoto) score += 10;
    if (whySelling.trim().length >= 24) score += 10;
    if (closetContext.trim().length >= 24) score += 10;
    if (isVerifiedSeller) score += 10;
    if (!codeIncluded && !isVerifiedSeller) score -= 15;
    return Math.max(0, Math.min(100, score));
  }, [closetContext, codeIncluded, hasMirrorPhoto, isVerifiedSeller, proofComplete, whySelling]);

  const onSubmit = (data: FormValues) => {
    if (!proofComplete) {
      toast({
        title: "Finish the proof checklist",
        description: "Front, back, tag, and motion capture all need to be confirmed before listing.",
        variant: "destructive",
      });
      return;
    }

    if (!isVerifiedSeller && !data.codeIncluded) {
      toast({
        title: "Verification code missing",
        description: "Newer sellers need the listing code visible in the front photo.",
        variant: "destructive",
      });
      return;
    }

    createListing.mutate(
      {
        data: {
          title: data.title,
          brand: data.brand,
          size: data.size,
          category: data.category,
          price: data.price,
          condition: data.condition,
          sellerName: data.sellerName,
          whySelling: `${data.whySelling}\n\nCloset note: ${data.closetContext}\nStyling note: ${data.stylingNotes}`,
          wornCount: data.wornCount,
          proof: {
            frontPhoto: "captured-front-proof.jpg",
            backPhoto: "captured-back-proof.jpg",
            tagPhoto: "captured-tag-proof.jpg",
            motionVideo: "captured-motion-proof.mp4",
            codeIncluded: data.codeIncluded,
          },
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
          setOpen(false);
          form.reset();
          toast({
            title: "Listing sent for review",
            description: "Your closet proof and seller story are now part of the submission.",
          });
        },
        onError: (error) => {
          toast({
            title: "Listing failed",
            description: error.message || "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 bg-background/95 sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">List from a real closet</DialogTitle>
          <DialogDescription>
            This flow turns your brief into product friction where resellers feel it most: proof, context,
            and pattern checks before anything goes live.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-2">
            <section className="space-y-5 rounded-3xl border border-border/60 bg-muted/30 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Ownership proof</p>
                  <h3 className="mt-2 font-serif text-2xl text-foreground">
                    {isVerifiedSeller ? "Trusted seller flow" : "Proof of life required"}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {isVerifiedSeller
                      ? `You have ${salesCount} verified sales, so we lower friction while still checking for duplicate patterns.`
                      : "Newer sellers need in-the-moment capture, a motion clip, and a visible code to prove the item is really in hand."}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-background px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trust preview</p>
                  <p className="font-serif text-3xl text-foreground">{trustPreview}%</p>
                </div>
              </div>

              {!isVerifiedSeller && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <p className="font-medium">Dynamic listing code</p>
                  <p className="mt-1">
                    Show{" "}
                    <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs">
                      {verificationCode || "enter your name to reveal"}
                    </span>{" "}
                    in the front shot. Trusted seller status unlocks after roughly {salesUntilVerified} more
                    verified sales.
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ProofTile
                  icon={Camera}
                  label="Front photo"
                  description="Taken in-app with the code and item fully visible."
                  active={capturedFront}
                />
                <ProofTile
                  icon={Camera}
                  label="Back photo"
                  description="Same session, same lighting, enough to catch recycled imagery."
                  active={capturedBack}
                />
                <ProofTile
                  icon={Tag}
                  label="Tag photo"
                  description="Tag and care label are checked for reuse across listings."
                  active={capturedTag}
                />
                <ProofTile
                  icon={Video}
                  label="Motion proof"
                  description="A short 2-3 second flip or movement clip to confirm possession."
                  active={capturedMotion}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="captureOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>Use in-app capture only</FormLabel>
                        <FormDescription>
                          Camera roll uploads stay limited so reused marketplace photos are harder to submit.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasMirrorPhoto"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>Add an optional mirror / worn photo</FormLabel>
                        <FormDescription>
                          Great for pieces where buyers benefit from seeing how it actually lived in your closet.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="capturedFront"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>I captured the front shot in-app</FormLabel>
                        <FormDescription>The code and item are visible in the same frame.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capturedBack"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>I captured the back shot in-app</FormLabel>
                        <FormDescription>It was taken in the same proof session.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capturedTag"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>I captured the tag photo</FormLabel>
                        <FormDescription>Brand and sizing tags are visible for duplicate checks.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capturedMotion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>I recorded the motion clip</FormLabel>
                        <FormDescription>Short movement clips help stop stolen or static photos.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!isVerifiedSeller && (
                <FormField
                  control={form.control}
                  name="codeIncluded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>The code is visible in the front photo</FormLabel>
                        <FormDescription>
                          This is the anti-reuse step that makes copied images much harder to get through review.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sellerName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" placeholder="What should buyers call you?" />
                    </FormControl>
                    <FormDescription>
                      Buyers follow people here, not anonymous storefronts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Item title</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" placeholder="e.g. Broken-in vintage chore jacket" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" placeholder="Levi's" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" placeholder="Medium or 30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input {...field} type="number" className="bg-background pl-7" placeholder="0.00" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select the condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-6 rounded-3xl border border-secondary/20 bg-secondary/5 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">Humanize the listing</p>
                <h3 className="mt-2 flex items-center gap-2 font-serif text-2xl text-foreground">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  People &gt; products
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  These prompts come directly from your note: give buyers a sense that this piece came from an
                  actual person&apos;s closet.
                </p>
              </div>

              <FormField
                control={form.control}
                name="wornCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How often did you wear it?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Choose one" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wornCounts.map((count) => (
                          <SelectItem key={count} value={count}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whySelling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why are you selling it?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-24 resize-none bg-background"
                        placeholder="I love it, but it no longer fits the way I dress and I want it to go to someone who will actually wear it."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closetContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did it fit into your closet?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-24 resize-none bg-background"
                        placeholder="This was my weekend jacket and usually lived next to my denim and boots."
                      />
                    </FormControl>
                    <FormDescription>
                      This helps the app distinguish a personal wardrobe from random bulk inventory.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stylingNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Styling or wear notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-20 resize-none bg-background"
                        placeholder="Usually styled with black trousers, loafers, and a white tee."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-border/60 bg-card p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-serif text-xl text-foreground">Anti-reseller rules in this flow</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The product language here now mirrors your brief: make normal closet clean-outs easy and
                      bulk behavior annoying.
                    </p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {riskSignals.map((signal) => (
                    <li key={signal} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/30 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Closet limits</p>
                  <p className="mt-2 font-serif text-3xl text-foreground">{ACTIVE_LISTING_LIMIT} active max</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Limits are inventory-based, not per-day. Trust can unlock more later.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="agreesToLimit"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-border/60 bg-background p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel>I&apos;m listing from my real closet, not store inventory</FormLabel>
                        <FormDescription>
                          I understand active listings are capped around {ACTIVE_LISTING_LIMIT} until trust grows.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Real closets, not stores. No dropshipping. No bulk resale feel.
              </p>
              <Button
                type="submit"
                disabled={createListing.isPending}
                className="rounded-full px-6 font-semibold"
              >
                {createListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for review
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
