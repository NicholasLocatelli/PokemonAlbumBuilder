import { useDrop } from 'react-dnd';
import CardSlot from './CardSlot';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { PokemonCard } from '@shared/schema';
import { useParams } from 'wouter';

interface AlbumGridProps {
  gridSize: number;
  cards: Array<{position: number; cardId: string} | null>;
  pageId: number;
}

export default function AlbumGrid({ gridSize, cards, pageId }: AlbumGridProps) {
  const { id: albumId } = useParams();
  
  // Create a fixed-length array, filling with nulls for any missing positions
  const normalizedCards = Array(gridSize).fill(null).map((_, index) => {
    return cards.find(card => card && card.position === index) || null;
  });
  
  console.log('Normalized cards:', JSON.stringify(normalizedCards));
  
  // Update cards on the server
  const updateCards = useMutation({
    mutationFn: async (updatedCards: Array<{position: number; cardId: string} | null>) => {
      console.log('Sending cards update:', JSON.stringify(updatedCards));
      const res = await apiRequest("PATCH", `/api/pages/${pageId}/cards`, { cards: updatedCards });
      return res.json();
    },
    onSuccess: () => {
      if (albumId) {
        // Invalidate both the album query and the page query
        queryClient.invalidateQueries({
          queryKey: [`/api/albums/${albumId}/pages`]
        });
      }
    }
  });

  // Handle dropping a card into a slot
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'POKEMON_CARD',
    drop: (item: { card: PokemonCard }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Find which slot the card was dropped on
      const element = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const positionAttr = element?.closest('[data-position]')?.getAttribute('data-position');
      if (!positionAttr) return;
      
      const position = parseInt(positionAttr);
      
      // Create a new cards array with the dropped card in the correct position
      const newCards = [...normalizedCards];
      newCards[position] = { position, cardId: item.card.id };
      
      // Update the server with the new array
      updateCards.mutate(newCards);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  // Handle removing a card from a slot
  const handleCardRemove = (position: number) => {
    const newCards = [...normalizedCards];
    newCards[position] = null;
    updateCards.mutate(newCards);
  };

  const gridCols = gridSize === 4 ? 'grid-cols-2' :
                  gridSize === 9 ? 'grid-cols-3' :
                  'grid-cols-4';

  return (
    <div
      ref={drop}
      className={`grid ${gridCols} gap-6 bg-card p-8 rounded-lg shadow-lg min-h-[600px] border-2 ${isOver ? 'border-primary' : 'border-primary/20'} border-dashed transition-colors duration-200`}
    >
      {normalizedCards.map((card, i) => (
        <CardSlot
          key={i}
          position={i}
          card={card}
          onRemove={() => handleCardRemove(i)}
        />
      ))}
    </div>
  );
}