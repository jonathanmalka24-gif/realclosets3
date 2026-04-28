import { FormEvent, useState } from "react";
import {
  getListSavedSearchesQueryKey,
  useCreateSavedSearch,
  useDeleteSavedSearch,
  useListSavedSearches,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export function SavedSearches() {
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { data: searches = [], isLoading } = useListSavedSearches();
  const createSavedSearch = useCreateSavedSearch();
  const deleteSavedSearch = useDeleteSavedSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const refreshSavedSearches = () => {
    queryClient.invalidateQueries({ queryKey: getListSavedSearchesQueryKey() });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    createSavedSearch.mutate(
      {
        data: {
          brand: brand.trim(),
          size: size.trim(),
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          alertsEnabled,
        },
      },
      {
        onSuccess: () => {
          setBrand("");
          setSize("");
          setMaxPrice("");
          setAlertsEnabled(true);
          refreshSavedSearches();
          toast({
            title: "Saved search created",
            description: "You will see matches for this brand and size here.",
          });
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteSavedSearch.mutate(
      { id },
      {
        onSuccess: () => {
          refreshSavedSearches();
          toast({
            title: "Saved search removed",
            description: "That alert is no longer active.",
          });
        },
      },
    );
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium">Saved searches</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track brands and sizes you want without encouraging bulk seller behavior.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_auto]">
          <Input
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder="Brand, e.g. Levi's"
            required
            className="h-11 rounded-full bg-background"
          />
          <Input
            value={size}
            onChange={(event) => setSize(event.target.value)}
            placeholder="Size"
            required
            className="h-11 rounded-full bg-background"
          />
          <Input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            type="number"
            min="1"
            placeholder="Max price"
            className="h-11 rounded-full bg-background"
          />
          <Button type="submit" className="h-11 rounded-full" disabled={createSavedSearch.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Save
          </Button>
        </form>

        <label className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
          <span className="font-medium">Enable alerts for this saved search</span>
          <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
        </label>

        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground">Loading saved searches...</div>
          ) : searches.length > 0 ? (
            searches.map((search) => (
              <div
                key={search.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{search.brand}</p>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Size {search.size}
                    </span>
                    {search.maxPrice ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        Under ${search.maxPrice}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Search className="h-3.5 w-3.5" />
                    {search.matchCount} current match{search.matchCount === 1 ? "" : "es"} ·{" "}
                    {search.alertsEnabled ? "alerts on" : "alerts off"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => handleDelete(search.id)}
                  disabled={deleteSavedSearch.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Save your first brand and size alert.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}