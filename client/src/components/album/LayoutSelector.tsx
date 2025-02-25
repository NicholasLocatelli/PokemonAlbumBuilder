import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LayoutSelectorProps {
  currentSize: number;
  onSelect: (size: number) => void;
}

export default function LayoutSelector({ currentSize, onSelect }: LayoutSelectorProps) {
  return (
    <Select
      value={currentSize.toString()}
      onValueChange={(value) => onSelect(parseInt(value))}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select layout" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="4">4 Cards (2×2)</SelectItem>
        <SelectItem value="9">9 Cards (3×3)</SelectItem>
        <SelectItem value="12">12 Cards (3×4)</SelectItem>
      </SelectContent>
    </Select>
  );
}
