import AlbumCover from "@/components/album/AlbumCover";
import { useParams } from "wouter";

export default function AlbumCoverPage() {
  const { id } = useParams();
  return <AlbumCover />;  // AlbumCover gets id from useParams itself
}
