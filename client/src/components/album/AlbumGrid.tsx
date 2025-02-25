import { useDrop } from 'react-dnd';
import CardSlot from './CardSlot';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { PokemonCard } from '@shared/schema';

interface AlbumGridProps {
  gridSize: number;
  cards: Array<{position: number; cardId: string} | null>;
  pageId: number;
}

export default function AlbumGrid({ gridSize, cards, pageId }: AlbumGridProps) {
  const queryClient = useQueryClient();

  const updateCards = useMutation({
    mutationFn: async (newCards: typeof cards) => {
      const res = await apiRequest("PATCH", `/api/pages/${pageId}/cards`, {
        cards: newCards
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
    }
  });

  const [, drop] = useDrop(() => ({
    accept: 'POKEMON_CARD',
    drop: (item: { card: PokemonCard }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const element = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const position = element?.getAttribute('data-position');
      if (!position) return;

      const newCards = [...cards];
      newCards[parseInt(position)] = {
        position: parseInt(position),
        cardId: item.card.id
      };
      updateCards.mutate(newCards);
    }
  }));

  const gridCols = gridSize === 4 ? 'grid-cols-2' :
                  gridSize === 9 ? 'grid-cols-3' :
                  'grid-cols-4';

  return (
    <div
      ref={drop}
      className={`grid ${gridCols} gap-6 bg-card p-8 rounded-lg shadow-lg min-h-[600px] border-2 border-dashed border-primary/20`}
    >
      {Array.from({ length: gridSize }).map((_, i) => (
        <CardSlot
          key={i}
          position={i}
          card={cards[i]}
          onRemove={() => {
            const newCards = [...cards];
            newCards[i] = null;
            updateCards.mutate(newCards);
          }}
        />
      ))}
    </div>
  );
}