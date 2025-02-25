import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PokemonCard } from "@shared/schema";

interface CardSlotProps {
  position: number;
  card: { position: number; cardId: string; } | null;
  onRemove: () => void;
}

export default function CardSlot({ position, card, onRemove }: CardSlotProps) {
  const cardQuery = useQuery({
    queryKey: ["/api/cards", card?.cardId],
    queryFn: async () => {
      if (!card) return null;
      const res = await fetch(`/api/cards/${card.cardId}`);
      if (!res.ok) throw new Error("Failed to load card");
      return res.json() as Promise<PokemonCard>;
    },
    enabled: !!card
  });

  return (
    <Card
      data-position={position}
      className="aspect-[2.5/3.5] relative group"
    >
      {cardQuery.data ? (
        <>
          <img
            src={cardQuery.data.images.small}
            alt={cardQuery.data.name}
            className="w-full h-full object-contain"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          Empty Slot
        </div>
      )}
    </Card>
  );
}
