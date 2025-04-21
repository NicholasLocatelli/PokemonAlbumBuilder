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
  const [error, setError] = useState<string | null>(null); // State to manage error messages

  const validateInput = (input: string) => {  
    const isValid = /^[a-zA-Z0-9\s-]*$/.test(input); // Allow only alphanumeric characters and spaces
    if (!isValid) {
      setError("Invalid input. Only alphanumeric characters, spaces and '-' are allowed.");
    } else {
      setError(null); // Clear error if input is valid
    }
    return isValid;
  };

  const searchQuery = useQuery({
    queryKey: ["/api/cards/search", search],
    queryFn: async () => {
      try {
        if (!search) return [];
        const sanitizedQuery = encodeURIComponent(search);
        const res = await fetch(`/api/cards/search?query=${sanitizedQuery}`);
        if (!res.ok) throw new Error("Failed to search cards");
        return res.json() as Promise<PokemonCard[]>;
      } catch (error) {
        console.error("Error fetching cards:", error);
        setError("An error occurred while searching for cards.");
        return [];
      }
    },
    enabled: !error
  });

  return (
    <div className="bg-card rounded-lg p-4 space-y-4">
      <Input
        placeholder="Search Pokémon cards..."
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          if (validateInput(value)) {
            setSearch(value); // Update state only if input is valid
          }
        }}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>} {/* Show error message */}

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
