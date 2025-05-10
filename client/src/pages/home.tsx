import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookOpen, Pencil } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
// Select components removed since we're using a grid layout instead
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Album } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import UserMenu from "@/components/auth/UserMenu";


export default function Home() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [gridSize, setGridSize] = useState("9");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>();
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Fetch albums for the current user or all albums if not logged in
  const albumsQuery = useQuery({
    queryKey: user ? ["/api/user/albums"] : ["/api/albums/all"],
    queryFn: async () => {
      const endpoint = user ? "/api/user/albums" : "/api/albums/all";
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to load albums");
      return res.json() as Promise<Album[]>;
    },
    enabled: !isAuthLoading // Only run query after auth state is determined
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
      
      // Invalidate both album query endpoints
      queryClient.invalidateQueries({ queryKey: ["/api/albums/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/albums"] });
      
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
    
    // Check if user is logged in before creating an album
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to create an album",
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
    <div className="min-h-screen bg-background flex flex-col p-6"
    style={{
      backgroundImage: "url('/background-pokeball.png')",
      backgroundSize: "cover",
      backgroundRepeat: "repeat",
    }} >
      {/* Header with user menu */}
      <div className="w-full flex justify-end mb-8">
        <UserMenu />
      </div>
      
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-yellow-400 bg-clip-text text-transparent mb-3">
            PokeBinder
          </h1>
          <p className="text-muted-foreground text-lg">
            Organize and display your Pokémon card collection
          </p>
        </div>
        
        <div className="w-full max-w-md space-y-4">
          {user ? (
            <>
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
            </>
          ) : (
            <>
              <Button 
                className="w-full py-8 text-xl"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create a new Album
              </Button>
              
              <Button 
                  className="w-full py-8 text-xl"
                  variant="outline"
                  onClick={() => setLocation('/auth')}
                >
                  Login to Access Albums
                </Button>
            </>
          )}
        </div>
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
        <DialogContent className="sm:max-w-3xl">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-1">
                {albumsQuery.data?.map(album => (
                  <div 
                    key={album.id} 
                    className={`p-3 border rounded-lg cursor-pointer hover:border-primary transition-all hover:shadow-md ${selectedAlbumId === album.id.toString() ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border'}`}
                    onClick={() => setSelectedAlbumId(album.id.toString())}
                  >
                    <div 
                      className="w-full aspect-[2/3] mb-2 rounded flex items-center justify-center shadow-sm" 
                      style={{ backgroundColor: album.coverColor || '#2563eb' }}
                    >
                      <span className="text-white font-medium text-sm text-center px-2 drop-shadow-sm">{album.name}</span>
                    </div>
                    <p className="text-center text-sm truncate font-medium">{album.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              onClick={handleOpenAlbum}
              disabled={!selectedAlbumId}
              className="flex-1"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Open Album
            </Button>
            <Button 
              variant="outline"
              disabled={!selectedAlbumId}
              className="flex-1"
              onClick={() => {
                if (selectedAlbumId) {
                  setSelectDialogOpen(false);
                  setLocation(`/album-cover/${selectedAlbumId}`);
                }
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Cover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
