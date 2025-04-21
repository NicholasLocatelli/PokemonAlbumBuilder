import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, Move } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PokemonCard } from "@shared/schema";
import { useDrag, useDrop } from 'react-dnd';

interface CardSlotProps {
  position: number;
  card: { position: number; cardId: string; } | null;
  onRemove: () => void;
  onAddClick: () => void;
  onDrop?: (draggedCardPosition: number, dropPosition: number) => void;
}

export default function CardSlot({ position, card, onRemove, onAddClick, onDrop }: CardSlotProps) {
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
  
  // Set up drag source
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ALBUM_CARD',
    item: { position },
    canDrag: !!card, // Only allow dragging if we have a card
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [position, card]);
  
  // Set up drop target
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'ALBUM_CARD',
    drop: (item: { position: number }) => {
      if (onDrop) {
        onDrop(item.position, position);
      }
    },
    // Don't allow dropping on itself
    canDrop: (item: { position: number }) => item.position !== position,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [position, onDrop]);

  // Combine the refs for both drag source and drop target
  const dragDropRef = (element: HTMLDivElement) => {
    drag(element);
    drop(element);
  };

  // Calculate card appearance based on drag and drop state
  const getBorderStyle = () => {
    if (isDragging) return 'border-dashed border-2 border-yellow-500 opacity-50';
    if (isOver && canDrop) return 'border-dashed border-2 border-green-500';
    if (card) return 'border-none'; // Regular card with no border
    return 'border-dashed border-2 border-primary/20'; // Empty slot
  };

  return (
    <Card
      ref={dragDropRef}
      data-position={position}
      className={`aspect-[2.5/3.5] relative group transition-all duration-200 hover:shadow-lg ${getBorderStyle()}`}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: card ? 'grab' : 'default'
      }}
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
          <div className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between p-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-black/60 backdrop-blur-sm hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                // The div is already draggable by default
              }}
            >
              <Move className="h-4 w-4 text-white" />
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              className="bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                onRemove();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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