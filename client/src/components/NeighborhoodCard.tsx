import { Link } from "wouter";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";

interface NeighborhoodCardProps {
  neighborhood: {
    id: number;
    name: string;
    city: string;
    description?: string;
    image?: string;
    propertyCount: number;
  };
}

export default function NeighborhoodCard({ neighborhood }: NeighborhoodCardProps) {
  const { setSearchFilters, language } = useStore();

  // Handle clicking on the neighborhood card
  const handleClick = () => {
    setSearchFilters({
      location: `${neighborhood.name}, ${neighborhood.city}`
    });
  };

  return (
    <Link href="/">
      <a onClick={handleClick} className="relative rounded-xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition">
        <img 
          src={neighborhood.image || `https://source.unsplash.com/featured/?neighborhood,kenya,${neighborhood.name}`} 
          alt={`${neighborhood.name}, ${neighborhood.city}`} 
          className="w-full h-40 object-cover transition group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white font-heading font-semibold">{neighborhood.name}</h3>
          <p className="text-white/80 text-sm">
            {neighborhood.propertyCount} {translate("properties", language)}
          </p>
        </div>
      </a>
    </Link>
  );
}
