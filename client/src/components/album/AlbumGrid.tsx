import { useDrop } from 'react-dnd';
import { useState, useEffect } from 'react';
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

export default function AlbumGrid({ gridSize, cards: initialCards, pageId }: AlbumGridProps) {
  // Get the album ID from the URL parameters
  const { id: albumId } = useParams();
  // Maintain local state for the cards to avoid race conditions
  const [localCards, setLocalCards] = useState<Array<{position: number; cardId: string} | null>>([]);
  
  // Initialize or update local cards whenever the props change
  useEffect(() => {
    // Create a fixed-size array with the correct number of slots
    const formattedCards = Array(gridSize).fill(null);
    
    // Fill in the cards from the server data
    initialCards.forEach((card) => {
      if (card && typeof card.position === 'number' && card.position < gridSize) {
        formattedCards[card.position] = { 
          position: card.position,
          cardId: card.cardId
        };
      }
    });
    
    setLocalCards(formattedCards);
    console.log('Local cards initialized:', JSON.stringify(formattedCards));
  }, [initialCards, gridSize]);
  
  const updateCards = useMutation({
    mutationFn: async (newCards: typeof localCards) => {
      console.log('Sending cards update:', JSON.stringify(newCards));
      const res = await apiRequest("PATCH", `/api/pages/${pageId}/cards`, {
        cards: newCards.map(card => card) // Create a clean copy without any undefined values
      });
      const data = await res.json();
      console.log('Received response:', JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      console.log('Cards updated successfully:', JSON.stringify(data));
      // Update local state after a successful update
      if (data && data.cards) {
        const formattedCards = Array(gridSize).fill(null);
        data.cards.forEach((card: {position: number; cardId: string} | null) => {
          if (card && typeof card.position === 'number' && card.position < gridSize) {
            formattedCards[card.position] = card;
          }
        });
        setLocalCards(formattedCards);
      }
      
      // Invalidate the query to refresh data
      if (albumId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/albums/${albumId}/pages`, parseInt(albumId)]
        });
      }
    }
  });

  const addCardToSlot = (position: number, cardId: string) => {
    // Create a copy of the local cards array
    const newCards = [...localCards];
    // Update the specific position
    newCards[position] = {
      position,
      cardId
    };
    
    console.log(`Adding card ${cardId} to position ${position}`, JSON.stringify(newCards));
    // Update local state immediately for a responsive feel
    setLocalCards(newCards);
    // Send the update to the server
    updateCards.mutate(newCards);
  };

  const removeCardFromSlot = (position: number) => {
    // Create a copy of the local cards array
    const newCards = [...localCards];
    // Set the position to null
    newCards[position] = null;
    
    console.log(`Removing card from position ${position}`, JSON.stringify(newCards));
    // Update local state immediately
    setLocalCards(newCards);
    // Send the update to the server
    updateCards.mutate(newCards);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'POKEMON_CARD',
    drop: (item: { card: PokemonCard }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Find the slot element under the cursor
      const element = document.elementFromPoint(clientOffset.x, clientOffset.y);
      const positionAttr = element?.closest('[data-position]')?.getAttribute('data-position');
      if (!positionAttr) return;
      
      // Add the card to the selected slot
      addCardToSlot(parseInt(positionAttr), item.card.id);
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
      {localCards.map((card, i) => (
        <CardSlot
          key={i}
          position={i}
          card={card}
          onRemove={() => removeCardFromSlot(i)}
        />
      ))}
    </div>
  );
}