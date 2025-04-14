import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import AlbumGrid from "@/components/album/AlbumGrid";
import CardSelector from "@/components/album/CardSelector";
import PageControls from "@/components/album/PageControls";
import LayoutSelector from "@/components/album/LayoutSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Album, Page } from "@shared/schema";

export default function AlbumPage() {
  const { id } = useParams();
  const albumId = parseInt(id || "0");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const albumQuery = useQuery({
    queryKey: [`/api/albums/${albumId}`],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${albumId}`);
      if (!res.ok) throw new Error("Failed to load album");
      return res.json() as Promise<Album>;
    }
  });

  const pageQuery = useQuery({
    queryKey: [`/api/albums/${albumId}/pages`, albumId, currentPage],
    queryFn: async () => {
      const res = await fetch(`/api/albums/${albumId}/pages/${currentPage}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load page");
      return res.json() as Promise<Page>;
    },
    staleTime: 0, // Don't use stale data
    refetchOnWindowFocus: true // Re-fetch when window regains focus
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
        queryKey: [`/api/albums/${albumId}/pages`, albumId, currentPage]
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{albumQuery.data.name}</h1>
          <LayoutSelector
            currentSize={albumQuery.data.gridSize}
            onSelect={(size) => updateGridSize.mutate(size)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            {needsPageCreation ? (
              <div className="bg-card p-8 rounded-lg text-center">
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
              />
            )}
            <PageControls
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>

          <CardSelector />
        </div>
      </div>
    </div>
  );
}