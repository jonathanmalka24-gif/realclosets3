import { Layout } from "@/components/layout";
import { MessageCircle } from "lucide-react";

export default function Messages() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Messages</p>
          <h1 className="mt-2 text-3xl font-medium md:text-5xl">Buyer and seller chats</h1>
        </div>

        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-background text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          <p className="text-base font-medium text-foreground">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversations with buyers and sellers will appear here once you start chatting on a listing.
          </p>
        </div>
      </div>
    </Layout>
  );
}
