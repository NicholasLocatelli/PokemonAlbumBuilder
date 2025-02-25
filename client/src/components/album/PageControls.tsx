import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageControlsProps {
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function PageControls({ currentPage, onPageChange }: PageControlsProps) {
  return (
    <div className="flex justify-center items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-lg font-medium">Page {currentPage}</span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
