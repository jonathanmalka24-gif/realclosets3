import {
  useFollowSeller,
  useUnfollowSeller,
  getGetSellerProfileQueryKey,
  getListFollowedSellersQueryKey,
} from "@workspace/api-client-react";
import type { SellerProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  sellerName: string;
  isFollowing: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline";
}

export function FollowButton({ sellerName, isFollowing, size = "sm", variant = "outline" }: FollowButtonProps) {
  const followMutation = useFollowSeller();
  const unfollowMutation = useUnfollowSeller();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    const action = isFollowing ? unfollowMutation : followMutation;
    action.mutate(
      { name: sellerName },
      {
        onSuccess: (data: SellerProfile) => {
          queryClient.setQueryData(getGetSellerProfileQueryKey(sellerName), data);
          queryClient.invalidateQueries({ queryKey: getListFollowedSellersQueryKey() });
          toast({
            title: data.isFollowing ? `Following ${sellerName}` : `Unfollowed ${sellerName}`,
          });
        },
      },
    );
  };

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "secondary" : variant}
      className="rounded-full"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`mr-2 h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
