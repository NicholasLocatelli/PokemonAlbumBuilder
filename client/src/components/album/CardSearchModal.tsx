import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useDrag } from "react-dnd";
import type { PokemonCard } from "@shared/schema";

function DraggableCard({ card, onCardSelected }: { 
  card: PokemonCard; 
  onCardSelected?: () => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'POKEMON_CARD',
    item: { card },
    end: (item, monitor) => {
      if (monitor.didDrop() && onCardSelected) {
        onCardSelected();
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <Card
      ref={drag}
      className={`cursor-move transition-all hover:shadow-lg ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      <img
        src={card.images.small}
        alt={card.name}
        className="w-full h-auto rounded-sm"
      />
    </Card>
  );
}

interface CardSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardSearchModal({ open, onOpenChange }: CardSearchModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input when the modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const searchQuery = useQuery({
    queryKey: ["/api/cards/search", search],
    queryFn: async () => {
      if (!search) return [];
      const res = await fetch(`/api/cards/search?query=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to search cards");
      return res.json() as Promise<PokemonCard[]>;
    }
  });

  const handleCardSelected = () => {
    // Close the modal when a card is successfully dropped
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden backdrop-blur-lg bg-background/80">
        <div className="sticky top-0 z-10 p-4 bg-background/90 backdrop-blur-sm border-b">
          <Input
            ref={inputRef}
            placeholder="Search Pokémon cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <ScrollArea className="h-[70vh] px-4 pb-4">
          {searchQuery.isLoading ? (
            <div className="flex items-center justify-center h-32">
              Searching...
            </div>
          ) : searchQuery.data?.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {search ? "No cards found" : "Type to search for cards"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {searchQuery.data?.map((card) => (
                <DraggableCard 
                  key={card.id} 
                  card={card} 
                  onCardSelected={handleCardSelected}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}