import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { PokemonCard } from "@shared/schema";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [selectedSet, setSelectedSet] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input when the modal opens and reset search
  useEffect(() => {
    if (open) {
      setSearch("");
      // Don't reset the set filter when reopening, so users can 
      // continue searching in the same set
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  // Fetch all available sets
  const setsQuery = useQuery({
    queryKey: ["/api/sets"],
    queryFn: async () => {
      const res = await fetch('/api/sets');
      if (!res.ok) throw new Error("Failed to fetch sets");
      return res.json() as Promise<Array<{id: string; name: string; series: string}>>;
    }
  });

  const searchQuery = useQuery({
    queryKey: ["/api/cards/search", search, selectedSet],
    queryFn: async () => {
      if (!search) return [];
      
      // Construct the query URL with optional setId
      let url = `/api/cards/search?query=${encodeURIComponent(search)}`;
      if (selectedSet) {
        url += `&setId=${encodeURIComponent(selectedSet)}`;
      }
      
      const res = await fetch(url);
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
        
        <div className="sticky top-0 z-10 p-4 bg-background/90 backdrop-blur-sm border-b space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder={selectedSet ? "Search by name or card number..." : "Search Pokémon cards by name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            {selectedSet && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                {/^\d+$/.test(search) ? "Searching by number" : "Searching by name"}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
            <Label htmlFor="set-select" className="whitespace-nowrap">Filter by Set:</Label>
            <Select 
              value={selectedSet} 
              onValueChange={(value) => setSelectedSet(value === "all" ? undefined : value)}
            >
              <SelectTrigger id="set-select" className="w-full">
                <SelectValue placeholder="All Sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sets</SelectItem>
                {setsQuery.data?.map((set) => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.name} ({set.series})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedSet && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
              <strong>Tip:</strong> With a set selected, you can search by card number (e.g., type "1" to find card #1 in this set)
            </div>
          )}
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
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-95 overflow-hidden"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="relative">
                    <img
                      src={card.images.small}
                      alt={card.name}
                      className="w-full h-auto rounded-sm"
                    />
                    {card.set?.images?.symbol && (
                      <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm p-1">
                        <img
                          src={card.set.images.symbol}
                          alt={card.set.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {card.rarity && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center backdrop-blur-sm truncate">
                        {card.number && <span className="mr-1">#{card.number}</span>}
                        {card.rarity}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}