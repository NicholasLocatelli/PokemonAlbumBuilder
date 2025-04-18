import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { PokemonCard } from "@shared/schema";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface CardSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardSelect?: (card: PokemonCard) => void;
  activePosition?: number | null;
}

export default function CardSearchModal({ 
  open, 
  onOpenChange, 
  onCardSelect,
  activePosition 
}: CardSearchModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input when the modal opens and reset search
  useEffect(() => {
    if (open) {
      setSearch("");
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

  const handleCardClick = (card: PokemonCard) => {
    if (onCardSelect) {
      onCardSelect(card);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden backdrop-blur-lg bg-background/80">
        {/* Hidden title for accessibility */}
        <VisuallyHidden asChild>
          <DialogTitle>
            {activePosition !== null && activePosition !== undefined 
              ? `Select a card for position ${activePosition + 1}` 
              : 'Search for Pokémon cards'}
          </DialogTitle>
        </VisuallyHidden>
        
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
                <Card
                  key={card.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  onClick={() => handleCardClick(card)}
                >
                  <img
                    src={card.images.small}
                    alt={card.name}
                    className="w-full h-auto rounded-sm"
                  />
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}