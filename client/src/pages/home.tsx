import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Album } from "@shared/schema";

export default function Home() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [gridSize, setGridSize] = useState("9");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>();
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch all albums
  const albumsQuery = useQuery({
    queryKey: ["/api/albums/all"],
    queryFn: async () => {
      const res = await fetch("/api/albums/all");
      if (!res.ok) throw new Error("Failed to load albums");
      return res.json() as Promise<Album[]>;
    }
  });

  const createAlbum = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/albums", {
        name: albumName,
        gridSize: parseInt(gridSize)
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCreateDialogOpen(false);
      setLocation(`/album/${data.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/albums/all"] });
      toast({
        title: "Album created!",
        description: `Created album "${data.name}"`
      });
    }
  });

  const handleCreateAlbum = () => {
    if (!albumName.trim()) {
      toast({
        title: "Album name required",
        description: "Please enter a name for your album",
        variant: "destructive"
      });
      return;
    }
    createAlbum.mutate();
  };

  const handleOpenAlbum = () => {
    if (selectedAlbumId) {
      setSelectDialogOpen(false);
      setLocation(`/album/${selectedAlbumId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
    style={{
      backgroundImage: "url('/background-pokeball.png')",
      backgroundSize: "cover",
      backgroundRepeat: "repeat",
    }} >
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-yellow-400 bg-clip-text text-transparent mb-3">
          PokeBinder
        </h1>
        <p className="text-muted-foreground text-lg">
          Organize and display your Pokémon card collection
        </p>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <Button 
          className="w-full py-8 text-xl"
          onClick={() => setCreateDialogOpen(true)}
        >
          Create a new Album
        </Button>
        
        <Button 
          className="w-full py-8 text-xl"
          variant="outline"
          onClick={() => setSelectDialogOpen(true)}
        >
          Open Album...
        </Button>
      </div>
      
      {/* Create Album Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Give your new album a name and choose a layout size
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="album-name">Album Name</Label>
              <Input 
                id="album-name"
                placeholder="My Awesome Collection" 
                value={albumName} 
                onChange={(e) => setAlbumName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Grid Layout</Label>
              <RadioGroup 
                value={gridSize} 
                onValueChange={setGridSize}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="layout-small" />
                  <Label htmlFor="layout-small">2×2 (Small)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9" id="layout-medium" />
                  <Label htmlFor="layout-medium">3×3 (Medium)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12" id="layout-large" />
                  <Label htmlFor="layout-large">4×3 (Large)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleCreateAlbum}
              disabled={createAlbum.isPending}
            >
              {createAlbum.isPending ? "Creating..." : "Create Album"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Select Album Dialog */}
      <Dialog open={selectDialogOpen} onOpenChange={setSelectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open Album</DialogTitle>
            <DialogDescription>
              Select an album from your collection
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {albumsQuery.isLoading ? (
              <div className="text-center py-4">Loading albums...</div>
            ) : albumsQuery.isError ? (
              <div className="text-center py-4 text-destructive">Failed to load albums</div>
            ) : albumsQuery.data?.length === 0 ? (
              <div className="text-center py-4">No albums found. Create one first!</div>
            ) : (
              <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an album" />
                </SelectTrigger>
                <SelectContent>
                  {albumsQuery.data?.map(album => (
                    <SelectItem key={album.id} value={album.id.toString()}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleOpenAlbum}
              disabled={!selectedAlbumId}
            >
              Open Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
