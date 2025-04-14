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
  // Debug the card prop to ensure we're getting proper data
  console.log(`CardSlot ${position} rendering with card:`, card);
  
  const cardQuery = useQuery({
    queryKey: ["/api/cards", card?.cardId],
    queryFn: async () => {
      if (!card?.cardId) return null;
      console.log(`Fetching card with ID: ${card.cardId}`);
      const res = await fetch(`/api/cards/${card.cardId}`);
      if (!res.ok) throw new Error("Failed to load card");
      const data = await res.json() as PokemonCard;
      console.log(`Loaded card data:`, data);
      return data;
    },
    enabled: !!card?.cardId // Only run query if we have a cardId
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
        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-primary/20 rounded-lg text-muted-foreground hover:border-primary/40 transition-colors">
          Drop card here
        </div>
      )}
    </Card>
  );
}