import { useDrop } from 'react-dnd';
import CardSlot from './CardSlot';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { PokemonCard } from '@shared/schema';

interface AlbumGridProps {
  gridSize: number;
  cards: Array<{position: number; cardId: string; albumId?: string} | null>;
  pageId: number;
}

export default function AlbumGrid({ gridSize, cards, pageId }: AlbumGridProps) {
  const updateCards = useMutation({
    mutationFn: async (newCards: typeof cards) => {
      const res = await apiRequest("PATCH", `/api/pages/${pageId}/cards`, {
        cards: newCards
      });
      return res.json();
    },
    onSuccess: () => {
      // Get the albumId from the current cards
      const albumId = cards[0]?.albumId || pageId;
      // Find the current page number from the first card's position
      const pageNumber = Math.floor((cards[0]?.position || 0) / gridSize) + 1;

      // Invalidate the specific page query
      queryClient.invalidateQueries({ 
        queryKey: [`/api/albums/${albumId}/pages/${pageNumber}`]
      });
    }
  });

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'POKEMON_CARD',
    drop: (item: { card: PokemonCard }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Find the slot element under the cursor
      const element = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const position = element?.closest('[data-position]')?.getAttribute('data-position');
      if (!position) return;

      // Create a copy of the current cards array
      const newCards = Array(gridSize).fill(null);

      // Copy all existing cards to maintain their positions
      cards.forEach((card, index) => {
        if (card) {
          newCards[index] = { ...card };
        }
      });

      // Update the specific position with the new card
      const positionIndex = parseInt(position);
      newCards[positionIndex] = {
        position: positionIndex,
        cardId: item.card.id,
        albumId: cards[0]?.albumId // added albumId
      };

      updateCards.mutate(newCards);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  const gridCols = gridSize === 4 ? 'grid-cols-2' :
                  gridSize === 9 ? 'grid-cols-3' :
                  'grid-cols-4';

  return (
    <div
      ref={drop}
      className={`grid ${gridCols} gap-6 bg-card p-8 rounded-lg shadow-lg min-h-[600px] border-2 ${isOver ? 'border-primary' : 'border-primary/20'} border-dashed transition-colors duration-200`}
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