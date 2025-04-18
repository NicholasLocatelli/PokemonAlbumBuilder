import { useDrop } from 'react-dnd';
import { useState, useEffect } from 'react';
import CardSlot from './CardSlot';
import CardSearchModal from './CardSearchModal';
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activePosition, setActivePosition] = useState<number | null>(null);
  
  // Local state for tracking cards - we'll initialize it from props
  const [localCards, setLocalCards] = useState<Array<{position: number; cardId: string} | null>>(
    Array(gridSize).fill(null)
  );
  
  // Initialize local cards from server data when props change
  useEffect(() => {
    // Create a blank array of the correct size
    const newCards = Array(gridSize).fill(null);
    
    // Fill in known cards from the server data
    if (cards && cards.length > 0) {
      cards.forEach(card => {
        if (card && typeof card.position === 'number' && card.position < gridSize) {
          newCards[card.position] = card;
        }
      });
    }
    
    setLocalCards(newCards);
    console.log('Cards initialized:', JSON.stringify(newCards));
  }, [cards, gridSize]);
  
  // Update cards on the server
  const updateCards = useMutation({
    mutationFn: async (updatedCards: Array<{position: number; cardId: string} | null>) => {
      // Filter out null values for the API request
      const filteredCards = updatedCards
        .map((card, index) => card ? { ...card, position: index } : null)
        .filter(card => card !== null);
      
      console.log('Sending cards update:', JSON.stringify(filteredCards));
      const res = await apiRequest("PATCH", `/api/pages/${pageId}/cards`, { 
        cards: filteredCards 
      });
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

  // Handle opening the search modal for a specific slot
  const handleAddClick = (position: number) => {
    setActivePosition(position);
    setSearchModalOpen(true);
  };

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
      const newCards = [...localCards];
      newCards[position] = { position, cardId: item.card.id };
      
      // Update local state first for a responsive UI
      setLocalCards(newCards);
      
      // Then update the server
      updateCards.mutate(newCards);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [localCards]);

  // Handle removing a card from a slot
  const handleCardRemove = (position: number) => {
    const newCards = [...localCards];
    newCards[position] = null;
    
    // Update local state first
    setLocalCards(newCards);
    
    // Then update the server
    updateCards.mutate(newCards);
  };

  const gridCols = gridSize === 4 ? 'grid-cols-2' :
                  gridSize === 9 ? 'grid-cols-3' :
                  'grid-cols-4';

  return (
    <>
      <div
        ref={drop}
        className={`grid ${gridCols} gap-6 bg-card p-8 rounded-lg shadow-lg min-h-[600px] border-2 ${isOver ? 'border-primary' : 'border-primary/20'} border-dashed transition-colors duration-200`}
      >
        {localCards.map((card, i) => (
          <CardSlot
            key={i}
            position={i}
            card={card}
            onRemove={() => handleCardRemove(i)}
            onAddClick={() => handleAddClick(i)}
          />
        ))}
      </div>
      
      {/* Card search modal */}
      <CardSearchModal 
        open={searchModalOpen} 
        onOpenChange={setSearchModalOpen} 
      />
    </>
  );
}