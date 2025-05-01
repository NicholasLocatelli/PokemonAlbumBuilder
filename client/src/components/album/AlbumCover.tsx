import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit2, BookOpen, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Album } from '@shared/schema';

export default function AlbumCover() {
  const { id } = useParams();
  const albumId = parseInt(id || '0');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [coverColor, setCoverColor] = useState('#2563eb');

  const albumQuery = useQuery<Album>({
    queryKey: [`/api/albums/${albumId}`],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${albumId}`);
      if (!res.ok) throw new Error('Failed to load album');
      return res.json() as Promise<Album>;
    }
  });
  
  // Set the cover color when album data is loaded
  React.useEffect(() => {
    if (albumQuery.data?.coverColor) {
      setCoverColor(albumQuery.data.coverColor);
    }
  }, [albumQuery.data]);

  const updateCoverColor = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', `/api/albums/${albumId}/cover-color`, {
        coverColor
      });
      return res.json() as Promise<Album>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/albums/${albumId}`] });
      setIsEditing(false);
      setColorPickerOpen(false);
      toast({
        title: 'Cover updated',
        description: 'Album cover color has been updated'
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update album cover color',
        variant: 'destructive'
      });
    }
  });

  if (albumQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading album...
      </div>
    );
  }

  if (!albumQuery.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Album not found
      </div>
    );
  }

  const album = albumQuery.data;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-2"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="relative">
          {/* Album Cover */}
          <div 
            className="rounded-lg shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl" 
            style={{ backgroundColor: coverColor }}
            onClick={() => !isEditing && setLocation(`/album/${albumId}`)}
          >
            <div className="p-2 pb-0 flex justify-end">
              {isEditing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full p-0 bg-white/20 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCoverColor.mutate();
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-full p-0 bg-white/20 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div 
              className="aspect-[2/3] flex flex-col items-center justify-center p-6"
              style={{ minHeight: '500px' }}
            >
              <h1 
                className="text-center font-bold mb-4 text-white drop-shadow-md" 
                style={{ fontSize: Math.min(5, 24 + (1 / Math.max(1, album.name.length / 10)) * 20) + 'px' }}
              >
                {album.name}
              </h1>

              {!isEditing && (
                <Button
                  variant="outline"
                  className="mt-6 bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/album/${albumId}`);
                  }}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Open Album
                </Button>
              )}
            </div>
          </div>

          {/* Color Picker */}
          {isEditing && (
            <Card className="p-4 absolute right-0 left-0 mx-auto mt-4 w-full max-w-xs">
              <div className="space-y-4">
                <HexColorPicker color={coverColor} onChange={setCoverColor} className="w-full" />
                <div className="flex gap-2">
                  <Input 
                    value={coverColor} 
                    onChange={(e) => setCoverColor(e.target.value)}
                    className="font-mono"
                  />
                  <Button 
                    size="sm"
                    onClick={() => {
                      updateCoverColor.mutate();
                    }}
                    disabled={updateCoverColor.isPending}
                  >
                    {updateCoverColor.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground mt-4">
          {album.gridSize === 4 ? '2×2 Grid Layout' : 
           album.gridSize === 9 ? '3×3 Grid Layout' : 
           album.gridSize === 12 ? '4×3 Grid Layout' : 
           `${album.gridSize} Cards Layout`}
        </div>
      </div>
    </div>
  );
}
