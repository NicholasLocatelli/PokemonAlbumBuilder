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
  coverColor?: string; // Optional prop for the album cover color
}

export default function AlbumGrid({ gridSize, cards, pageId, coverColor = '#2563eb' }: AlbumGridProps) {
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
  }, [cards, gridSize]);
  
  // Update cards on the server
  const updateCards = useMutation({
    mutationFn: async (updatedCards: Array<{position: number; cardId: string} | null>) => {
      // Filter out null values for the API request
      const filteredCards = updatedCards
        .map((card, index) => card ? { ...card, position: index } : null)
        .filter(card => card !== null);
      
      // Send cards update to the server
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
  
  // Handle card selection from search modal
  const handleCardSelect = (card: PokemonCard) => {
    if (activePosition === null) return;
    
    // Create a new cards array with the selected card in the correct position
    const newCards = [...localCards];
    newCards[activePosition] = { 
      position: activePosition, 
      cardId: card.id 
    };
    
    // Update local state first for a responsive UI
    setLocalCards(newCards);
    
    // Then update the server
    updateCards.mutate(newCards);
    
    // Reset active position
    setActivePosition(null);
  };

  // Still keep the drop functionality for backwards compatibility
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

  // Handle card repositioning through drag and drop
  const handleCardMove = (fromPosition: number, toPosition: number) => {
    // Handle repositioning cards between different slots
    
    // Only proceed if positions are different and valid
    if (fromPosition === toPosition || 
        fromPosition < 0 || fromPosition >= localCards.length || 
        toPosition < 0 || toPosition >= localCards.length) {
      return;
    }
    
    // Get the card being moved
    const cardToMove = localCards[fromPosition];
    if (!cardToMove) return; // Can't move empty slot
    
    // Create a new array to avoid mutating state directly
    const newCards = [...localCards];
    
    const targetCard = newCards[toPosition];
    
    // Simple swap logic
    if (targetCard === null) {
      // Moving to an empty slot - just move the card and clear original position
      newCards[toPosition] = { 
        ...cardToMove, 
        position: toPosition 
      };
      newCards[fromPosition] = null;
    } else {
      // Swapping with another card - update both positions
      newCards[toPosition] = { 
        ...cardToMove, 
        position: toPosition 
      };
      
      newCards[fromPosition] = {
        ...targetCard,
        position: fromPosition
      };
    }
    
    // Update local state first for a responsive UI
    setLocalCards(newCards);
    
    // Then update the server
    updateCards.mutate(newCards);
  };

  const gridCols = gridSize === 4 ? 'grid-cols-2' :
                  gridSize === 9 ? 'grid-cols-3' :
                  'grid-cols-4';

  // Create grid background style using the coverColor
  const gridStyle = {
    backgroundColor: `${coverColor}30`, // 30% opacity
    borderColor: isOver ? coverColor : `${coverColor}60`, // 60% opacity for the border
    boxShadow: `0 4px 30px ${coverColor}15, inset 0 1px 30px ${coverColor}10` // Add a subtle shadow with album color
  };

  return (
    <>
      <div
        ref={drop}
        className={`grid ${gridCols} gap-6 p-8 rounded-lg shadow-lg min-h-[600px] border-2 border-dashed transition-all duration-300 bg-background/80 backdrop-blur-sm`}
        style={gridStyle}
      >
        {localCards.map((card, i) => (
          <CardSlot
            key={i}
            position={i}
            card={card}
            onRemove={() => handleCardRemove(i)}
            onAddClick={() => handleAddClick(i)}
            onDrop={handleCardMove}
          />
        ))}
      </div>
      
      {/* Card search modal */}
      <CardSearchModal 
        open={searchModalOpen} 
        onOpenChange={setSearchModalOpen}
        onCardSelect={handleCardSelect}
        activePosition={activePosition}
      />
    </>
  );
}