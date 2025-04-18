import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PokemonCard } from "@shared/schema";

interface CardSlotProps {
  position: number;
  card: { position: number; cardId: string; } | null;
  onRemove: () => void;
  onAddClick: () => void;
}

export default function CardSlot({ position, card, onRemove, onAddClick }: CardSlotProps) {
  // Fetch card details when we have a cardId
  const cardQuery = useQuery({
    queryKey: ["/api/cards", card?.cardId],
    queryFn: async () => {
      if (!card?.cardId) return null;
      const res = await fetch(`/api/cards/${card.cardId}`);
      if (!res.ok) throw new Error("Failed to load card");
      return res.json() as Promise<PokemonCard>;
    },
    enabled: !!card?.cardId, // Only run query if we have a cardId
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes since Pokemon cards don't change
  });

  return (
    <Card
      data-position={position}
      className="aspect-[2.5/3.5] relative group transition-all duration-200 hover:shadow-lg"
    >
      {cardQuery.isLoading ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          Loading card...
        </div>
      ) : cardQuery.data ? (
        <>
          <img
            src={cardQuery.data.images.small}
            alt={cardQuery.data.name}
            className="w-full h-full object-contain rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              onRemove();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <button 
          className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-lg text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
          onClick={onAddClick}
        >
          <Plus className="h-10 w-10 mb-2 text-primary/40" />
          <span className="text-sm">Add card</span>
        </button>
      )}
    </Card>
  );
}