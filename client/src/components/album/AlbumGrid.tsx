import { useDrop } from 'react-dnd';
import CardSlot from './CardSlot';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { PokemonCard } from '@shared/schema';
import { useParams } from 'wouter';

interface AlbumGridProps {
  gridSize: number;
  cards: Array<{position: number; cardId: string; albumId?: string} | null>;
  pageId: number;
}

export default function AlbumGrid({ gridSize, cards, pageId }: AlbumGridProps) {
  // Get the album ID from the URL parameters
  const { id: albumId } = useParams();
  
  const updateCards = useMutation({
    mutationFn: async (newCards: typeof cards) => {
      console.log('Sending cards update:', JSON.stringify(newCards));
      const res = await apiRequest("PATCH", `/api/pages/${pageId}/cards`, {
        cards: newCards
      });
      const data = await res.json();
      console.log('Received response:', JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      // Log the successful update
      console.log('Cards updated successfully:', JSON.stringify(data));
      // Invalidate the specific page query to refresh with new data using the correct albumId
      queryClient.invalidateQueries({ 
        queryKey: [`/api/albums/${albumId}/pages`]
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

      // Create a deep copy of the current cards array to avoid mutation issues
      // Make sure the array has the right size for the current grid
      let newCards = Array(gridSize).fill(null);
      
      // Copy existing cards to their positions
      cards.forEach((card, index) => {
        if (card && index < gridSize) {
          newCards[index] = { ...card };
        }
      });

      // Update the specific position with the new card
      const positionIndex = parseInt(position);
      newCards[positionIndex] = {
        position: positionIndex,
        cardId: item.card.id
      };

      console.log('Updating cards:', JSON.stringify(newCards));
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
            // Create a deep copy of the current cards array
            const newCards = [...cards];
            // Set the removed position to null
            newCards[i] = null;
            updateCards.mutate(newCards);
          }}
        />
      ))}
    </div>
  );
}