import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PokemonCard } from "@shared/schema";
import { useDrop } from 'react-dnd';

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

  const [{ isOver }, drop] = useDrop({
    accept: 'POKEMON_CARD',
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <Card
      ref={drop}
      data-position={position}
      className={`aspect-[2.5/3.5] relative group transition-all duration-200 hover:shadow-lg ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      {cardQuery.isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
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
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className={`w-full h-full flex items-center justify-center border-2 border-dashed ${isOver ? 'border-primary bg-primary/5' : 'border-primary/20'} rounded-lg text-muted-foreground hover:border-primary/40 transition-colors`}>
          Drop card here
        </div>
      )}
    </Card>
  );
}