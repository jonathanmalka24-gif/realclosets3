import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, Check, X } from "lucide-react";

interface ReferralSignup {
  id: string;
  refererName: string;
  newUserName: string;
  code: string;
  status: "pending" | "granted" | "denied";
  creditsGranted: number;
  decidedAt: string | null;
  createdAt: string;
}

const TOKEN_KEY = "realclosets-admin-token";

async function adminFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const res = await fetch(`${base}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [signups, setSignups] = useState<ReferralSignup[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

  const load = async (t: string) => {
    setLoading(true);
    try {
      const data = await adminFetch<ReferralSignup[]>("/admin/referral-signups", t);
      setSignups(data);
      setAuthed(true);
      sessionStorage.setItem(TOKEN_KEY, t);
    } catch (e) {
      toast({
        title: "Couldn't authenticate",
        description: (e as Error).message || "Bad token.",
        variant: "destructive",
      });
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (
    id: string,
    action: "grant" | "deny",
    credits?: number,
  ) => {
    setBusy(id);
    try {
      await adminFetch(`/admin/referral-signups/${id}/decide`, token, {
        method: "POST",
        body: JSON.stringify({ action, credits }),
      });
      toast({
        title: action === "grant" ? "Credit granted" : "Signup denied",
      });
      await load(token);
    } catch (e) {
      toast({
        title: "Action failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  if (!authed) {
    return (
      <Layout>
        <div className="mx-auto max-w-md py-10">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h1 className="font-serif text-2xl font-medium">Admin</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the admin token to review referral signups.
              </p>
              <div>
                <Label htmlFor="token">Admin token</Label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  data-testid="input-admin-token"
                />
              </div>
              <Button
                disabled={!token || loading}
                onClick={() => load(token)}
                className="w-full"
                data-testid="button-admin-login"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const pending = signups.filter((s) => s.status === "pending");
  const decided = signups.filter((s) => s.status !== "pending");

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl font-medium">Referral signups</h1>
          <Button variant="outline" size="sm" onClick={() => load(token)}>
            Refresh
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Nothing waiting on you right now.
              </CardContent>
            </Card>
          ) : (
            pending.map((s) => (
              <SignupRow key={s.id} signup={s} busy={busy === s.id} onDecide={decide} />
            ))
          )}
        </section>

        {decided.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              History
            </h2>
            {decided.map((s) => (
              <Card key={s.id} className="border-border/60">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-medium">
                      {s.newUserName}{" "}
                      <span className="text-muted-foreground">via {s.refererName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code {s.code} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={s.status === "granted" ? "default" : "secondary"}
                    className={
                      s.status === "granted"
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {s.status === "granted" ? `Granted $${s.creditsGranted}` : "Denied"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
}

function SignupRow({
  signup,
  busy,
  onDecide,
}: {
  signup: ReferralSignup;
  busy: boolean;
  onDecide: (id: string, action: "grant" | "deny", credits?: number) => void;
}) {
  const [credits, setCredits] = useState("5");
  return (
    <Card data-testid={`signup-${signup.id}`}>
      <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">
            <span data-testid="signup-newuser">{signup.newUserName}</span>{" "}
            <span className="text-muted-foreground">referred by</span>{" "}
            <span data-testid="signup-referer">{signup.refererName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Code {signup.code} · {new Date(signup.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={500}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="w-20"
            data-testid="input-credits"
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onDecide(signup.id, "grant", Number(credits))}
            data-testid="button-grant"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Grant
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onDecide(signup.id, "deny")}
            data-testid="button-deny"
          >
            <X className="h-4 w-4" />
            Deny
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
