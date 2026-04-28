import { useState } from "react";
import { useCreateListingOffer, getListListingOffersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { HandCoins, Loader2 } from "lucide-react";

interface OfferDialogProps {
  listingId: string;
  askingPrice: number;
  sellerName: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function OfferDialog({ listingId, askingPrice, sellerName, disabled, children }: OfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [amount, setAmount] = useState(Math.round(askingPrice * 0.85).toString());
  const [message, setMessage] = useState("");
  const createOffer = useCreateListingOffer();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!buyerName.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "Add your name and a real offer amount.",
        variant: "destructive",
      });
      return;
    }

    createOffer.mutate(
      {
        id: listingId,
        data: {
          buyerName: buyerName.trim(),
          amount: numericAmount,
          message: message.trim(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListListingOffersQueryKey(listingId) });
          toast({
            title: `Offer sent to ${sellerName}`,
            description: `${sellerName} will see your $${numericAmount} offer in their messages.`,
          });
          setOpen(false);
          setMessage("");
        },
        onError: (error: unknown) => {
          const description = error instanceof Error ? error.message : "Could not send your offer.";
          toast({ title: "Offer not sent", description, variant: "destructive" });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="rounded-full" disabled={disabled}>
            <HandCoins className="mr-2 h-4 w-4" />
            Make Offer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send {sellerName} an offer</DialogTitle>
          <DialogDescription>
            People over products. Add a quick note so {sellerName} knows you are a real buyer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyer-name">Your name</Label>
            <Input
              id="buyer-name"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              placeholder="What should the seller call you?"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-amount">Offer amount (asking ${askingPrice})</Label>
            <Input
              id="offer-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-message">Note to {sellerName}</Label>
            <Textarea
              id="offer-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Why this piece, where you'd wear it, anything human."
              className="resize-none h-24"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={createOffer.isPending} className="rounded-full">
              {createOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
