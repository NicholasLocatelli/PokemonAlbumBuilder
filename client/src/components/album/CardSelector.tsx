import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDrag } from "react-dnd";
import type { PokemonCard } from "@shared/schema";

function DraggableCard({ card }: { card: PokemonCard }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'POKEMON_CARD',
    item: { card },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <Card
      ref={drag}
      className={`cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <img
        src={card.images.small}
        alt={card.name}
        className="w-full h-auto"
      />
    </Card>
  );
}

export default function CardSelector() {
  const [search, setSearch] = useState("");

  const searchQuery = useQuery({
    queryKey: ["/api/cards/search", search],
    queryFn: async () => {
      if (!search) return [];
      const res = await fetch(`/api/cards/search?query=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to search cards");
      return res.json() as Promise<PokemonCard[]>;
    }
  });

  return (
    <div className="bg-card rounded-lg p-4 space-y-4">
      <Input
        placeholder="Search Pokémon cards..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {searchQuery.data?.map((card) => (
            <DraggableCard key={card.id} card={card} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
