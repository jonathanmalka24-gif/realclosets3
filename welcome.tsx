import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight, Sparkles, Camera, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  BOTTOM_SIZES,
  CATEGORY_OPTIONS,
  DEFAULT_PREFERENCES,
  POPULAR_BRANDS,
  SHOE_SIZES,
  STYLE_OPTIONS,
  TOP_SIZES,
  loadPreferences,
  savePreferences,
  type Category,
  type ClosetPreferences,
  type ClosetSize,
  type ShoeSize,
  type StyleVibe,
} from "@/lib/preferences";

const STEPS = ["Open shop", "About you", "Brands", "Style", "Sizes", "Hunting for"] as const;

const MAX_AVATAR_BYTES = 1_500_000;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`chip-${typeof children === "string" ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<ClosetPreferences>(DEFAULT_PREFERENCES);
  const [referralCode, setReferralCode] = useState("");
  const isEditing = useMemo(() => Boolean(loadPreferences().completedAt), []);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const update = <K extends keyof ClosetPreferences>(key: K, value: ClosetPreferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const updateSize = (group: "tops" | "bottoms" | "shoes", value: ClosetSize | ShoeSize) => {
    setPrefs((p) => ({
      ...p,
      sizes: { ...p.sizes, [group]: toggle(p.sizes[group] as (ClosetSize | ShoeSize)[], value) } as ClosetPreferences["sizes"],
    }));
  };

  const canAdvance = useMemo(() => {
    if (step === 0) {
      return (
        prefs.displayName.trim().length >= 2 &&
        prefs.profilePicture.startsWith("data:image/") &&
        prefs.age !== null &&
        prefs.age >= 13 &&
        prefs.age <= 120
      );
    }
    if (step === 1) return prefs.description.trim().length >= 10;
    return true;
  }, [step, prefs.displayName, prefs.description, prefs.profilePicture, prefs.age]);

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast({
        title: "Image too large",
        description: "Please choose a profile picture under 1.5 MB.",
        variant: "destructive",
      });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      update("profilePicture", dataUrl);
    } catch {
      toast({ title: "Could not load image", variant: "destructive" });
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const finalPrefs: ClosetPreferences = {
        ...prefs,
        displayName: prefs.displayName.trim(),
        description: prefs.description.trim(),
        completedAt: new Date().toISOString(),
      };
      savePreferences(finalPrefs);
      toast({
        title: isEditing ? "Preferences updated" : "Welcome to Real Closets",
        description: isEditing
          ? "Your closet preferences have been saved."
          : "We'll use these to surface pieces and people you'll love.",
      });

      const code = referralCode.trim();
      if (!isEditing && code.length > 0) {
        const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
        void fetch(`${base}/api/referral-signups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, newUserName: finalPrefs.displayName }),
        })
          .then(async (r) => {
            if (r.ok) {
              toast({
                title: "Referral submitted",
                description: "We'll review and credit your friend if it's valid.",
              });
            } else {
              const data = await r.json().catch(() => ({}));
              toast({
                title: "Referral code not accepted",
                description: data.message || "We couldn't validate that code.",
                variant: "destructive",
              });
            }
          })
          .catch(() => {});
      }

      setLocation("/");
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {isEditing ? "Edit preferences" : "Welcome"} · Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <div className="mb-8 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="space-y-6 rounded-2xl border border-border/70 bg-card p-6 md:p-8 shadow-sm">
          {step === 0 && (
            <>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-medium md:text-3xl">Open your shop</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Name your closet, tell us your age, and add a profile picture so buyers know there's a real person behind the listings.
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Shop name
                </p>
                <Input
                  value={prefs.displayName}
                  onChange={(e) => update("displayName", e.target.value)}
                  placeholder="e.g. Sam from Brooklyn"
                  className="h-12 rounded-xl text-base"
                  data-testid="input-display-name"
                  autoFocus
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Age
                </p>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={13}
                  max={120}
                  value={prefs.age ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    update("age", v === "" ? null : Math.max(0, Math.min(150, Number(v))));
                  }}
                  placeholder="You must be 13 or older"
                  className="h-12 rounded-xl text-base"
                  data-testid="input-age"
                />
              </div>

              <div className="pt-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Profile picture <span className="text-rose-500">*</span>
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                    {prefs.profilePicture ? (
                      <img src={prefs.profilePicture} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <Camera className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" />
                      {prefs.profilePicture ? "Replace photo" : "Upload photo"}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-profile-picture"
                      onChange={(e) => void handleAvatarChange(e.target.files?.[0])}
                    />
                    {prefs.profilePicture && (
                      <button
                        type="button"
                        onClick={() => update("profilePicture", "")}
                        className="text-xs text-muted-foreground underline self-start"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h1 className="font-serif text-2xl font-medium md:text-3xl">Tell buyers about your closet</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  A short bio so people know who they're trading and buying from. At least a sentence or two.
                </p>
              </div>
              <Textarea
                value={prefs.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="I curate vintage workwear and 90s designer. Everything is washed, steamed, and ready to wear when it ships."
                rows={5}
                className="rounded-xl text-base"
                data-testid="textarea-closet-description"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {prefs.description.trim().length} characters · minimum 10
              </p>

              {!isEditing && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Got a referral code? (optional)
                  </p>
                  <Input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="RC-XXXX-####"
                    className="mt-2 h-11 rounded-xl font-mono"
                    data-testid="input-referral-code"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    We'll review and credit the seller who referred you.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h1 className="font-serif text-2xl font-medium md:text-3xl">Pick your favorite brands</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll prioritize closets and pieces from these labels in your feed. Pick as many as you like.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.map((brand) => (
                  <Chip
                    key={brand}
                    active={prefs.favoriteBrands.includes(brand)}
                    onClick={() => update("favoriteBrands", toggle(prefs.favoriteBrands, brand))}
                  >
                    {brand}
                  </Chip>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {prefs.favoriteBrands.length} selected
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h1 className="font-serif text-2xl font-medium md:text-3xl">What's your vibe?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the styles you actually wear (or want to wear more of).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={prefs.styles.includes(opt.value)}
                    onClick={() => update("styles", toggle(prefs.styles, opt.value) as StyleVibe[])}
                  >
                    <span className="mr-1">{opt.emoji}</span> {opt.label}
                  </Chip>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h1 className="font-serif text-2xl font-medium md:text-3xl">Save your sizes</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll filter your feed so you mostly see things that fit. Pick all the sizes you wear.
                </p>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tops</p>
                  <div className="flex flex-wrap gap-2">
                    {TOP_SIZES.map((s) => (
                      <Chip
                        key={`top-${s}`}
                        active={prefs.sizes.tops.includes(s)}
                        onClick={() => updateSize("tops", s)}
                      >
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bottoms</p>
                  <div className="flex flex-wrap gap-2">
                    {BOTTOM_SIZES.map((s) => (
                      <Chip
                        key={`bot-${s}`}
                        active={prefs.sizes.bottoms.includes(s)}
                        onClick={() => updateSize("bottoms", s)}
                      >
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Shoes (US)</p>
                  <div className="flex flex-wrap gap-2">
                    {SHOE_SIZES.map((s) => (
                      <Chip
                        key={`shoe-${s}`}
                        active={prefs.sizes.shoes.includes(s)}
                        onClick={() => updateSize("shoes", s)}
                      >
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <h1 className="font-serif text-2xl font-medium md:text-3xl">What are you hunting for?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the categories you browse most. We'll feature them first in your For You feed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={prefs.favoriteCategories.includes(opt.value)}
                    onClick={() =>
                      update("favoriteCategories", toggle(prefs.favoriteCategories, opt.value) as Category[])
                    }
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className="rounded-full"
              data-testid="button-onboarding-back"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              type="button"
              onClick={next}
              disabled={!canAdvance}
              className="rounded-full px-6"
              data-testid="button-onboarding-next"
            >
              {step === STEPS.length - 1 ? (isEditing ? "Save changes" : "Enter Real Closets") : "Continue"}
              {step < STEPS.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
