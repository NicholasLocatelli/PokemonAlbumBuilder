import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import AlbumGrid from "@/components/album/AlbumGrid";
import PageControls from "@/components/album/PageControls";
import LayoutSelector from "@/components/album/LayoutSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Album, Page } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function AlbumPage() {
  const { id } = useParams();
  const albumId = parseInt(id || "0");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const albumQuery = useQuery({
    queryKey: [`/api/albums/${albumId}`],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${albumId}`);
      if (!res.ok) throw new Error("Failed to load album");
      return res.json() as Promise<Album>;
    }
  });

  const pageQuery = useQuery({
    queryKey: [`/api/albums/${albumId}/pages`, albumId],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${albumId}/pages/${currentPage}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load page");
      return res.json() as Promise<Page>;
    },
    staleTime: 0, // Don't use stale data
    refetchOnWindowFocus: true, // Re-fetch when window regains focus
    refetchInterval: 1000 // Refresh every second to ensure we always have the latest data
  });

  const createPage = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pages", {
        albumId,
        pageNumber: currentPage,
        cards: new Array(albumQuery.data?.gridSize || 9).fill(null)
      });
      return res.json() as Promise<Page>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/albums/${albumId}/pages`]
      });
      toast({
        title: "Page created",
        description: `Created page ${currentPage}`
      });
    }
  });

  const updateGridSize = useMutation({
    mutationFn: async (gridSize: number) => {
      const res = await apiRequest("PATCH", `/api/albums/${albumId}/grid-size`, {
        gridSize
      });
      return res.json() as Promise<Album>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/albums/${albumId}`] });
      toast({
        title: "Layout updated",
        description: "Album grid size has been updated"
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

  const page = pageQuery.data;
  const needsPageCreation = pageQuery.data === null;

  // Create a style object with the background color from the album's cover color
  const coverColor = albumQuery.data.coverColor || '#2563eb'; // Use blue as fallback if no color set
  const albumBackgroundStyle = {
    backgroundColor: `${coverColor}30`, // Increase opacity to 30%
    backgroundImage: `linear-gradient(to bottom, ${coverColor}20, ${coverColor}40)`, // More visible gradient
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={albumBackgroundStyle}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center gap-2 bg-background/70 backdrop-blur-sm hover:bg-background/80" 
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="flex justify-between items-center bg-background/70 backdrop-blur-sm p-4 rounded-lg">
          <h1 className="text-3xl font-bold">{albumQuery.data.name}</h1>
          <LayoutSelector
            currentSize={albumQuery.data.gridSize}
            onSelect={(size) => updateGridSize.mutate(size)}
          />
        </div>

        <div className="space-y-6">
          {needsPageCreation ? (
            <div className="bg-card/90 backdrop-blur-sm p-8 rounded-lg text-center shadow-lg border border-muted">
              <p className="text-lg mb-4">Page {currentPage} hasn't been created yet</p>
              <Button onClick={() => createPage.mutate()}>
                Create Page {currentPage}
              </Button>
            </div>
          ) : (
            <AlbumGrid
              gridSize={albumQuery.data.gridSize}
              cards={page?.cards || []}
              pageId={page?.id || 0}
              coverColor={coverColor} // Pass the cover color to AlbumGrid
            />
          )}
          <PageControls
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}