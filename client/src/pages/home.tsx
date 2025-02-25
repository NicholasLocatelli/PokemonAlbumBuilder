import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createAlbum = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/albums", {
        name,
        gridSize: 9 // Default grid size
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLocation(`/album/${data.id}`);
      toast({
        title: "Album created!",
        description: `Created album "${data.name}"`
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    createAlbum.mutate(nameInput.value);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
            Pokémon Card Album
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Album Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Awesome Collection"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createAlbum.isPending}
            >
              Create Album
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
