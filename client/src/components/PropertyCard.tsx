import { useState } from "react";
import { Link } from "wouter";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

interface PropertyCardProps {
  property: {
    id: number;
    title: string;
    description: string;
    price: number;
    propertyType: string;
    listingType: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    location: string;
    address: string;
    latitude: number;
    longitude: number;
    features: string[];
    images: string[];
    ownerId: number;
    verified: boolean;
    createdAt: string;
    owner?: {
      id: number;
      fullName: string;
      avatar?: string;
    };
    isFavorite?: boolean;
  };
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { isAuthenticated, language } = useStore();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(property.isFavorite || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Format date
  const createdAt = new Date(property.createdAt);
  const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to log in to save properties to favorites",
        variant: "destructive",
      });
      return;
    }

    if (isTogglingFavorite) return;

    try {
      setIsTogglingFavorite(true);

      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${property.id}`);
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "Property has been removed from your favorites",
        });
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId: property.id });
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
          description: "Property has been added to your favorites",
        });
      }

      // Invalidate favorites query
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Format price for display
  const formatPrice = (price: number, listingType: string) => {
    const formattedPrice = new Intl.NumberFormat('en-KE').format(price);
    return listingType === 'rent' ? `KSh ${formattedPrice}/month` : `KSh ${formattedPrice}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition duration-300 relative property-card touch-feedback mobile-optimize touch-active">
      <div className="relative">
        <img 
          src={property.images[0]} 
          alt={property.title} 
          className="w-full h-48 md:h-56 object-cover"
          loading="lazy"
          width="400"
          height="300"
          decoding="async"
        />
        <button 
          className={`absolute top-3 right-3 bg-white p-2 rounded-full shadow-md z-10 touch-feedback touch-active btn-mobile ${isFavorite ? 'text-primary' : 'text-neutral-500 hover:text-primary'} transition`}
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <div className={`absolute bottom-0 left-0 ${property.listingType === 'rent' ? 'bg-primary' : 'bg-secondary'} text-white px-3 py-1 text-sm font-medium`}>
          {property.listingType === 'rent' ? translate("forRent", language) : translate("forSale", language)}
        </div>
      </div>
      <Link href={`/property/${property.id}`} className="android-scroll">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-heading font-semibold">{formatPrice(property.price, property.listingType)}</h3>
            {property.verified && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-0">
                <i className="fas fa-check-circle mr-1"></i> {translate("verified", language)}
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-neutral-800 mb-1 line-clamp-1">{property.title}</h4>
          <p className="text-sm text-neutral-500 mb-3">
            <i className="fas fa-map-marker-alt mr-1"></i> {property.location}
          </p>
          
          <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
            <div className="px-2 py-1"><i className="fas fa-bed mr-1"></i> {property.bedrooms} {translate("beds", language)}</div>
            <div className="px-2 py-1"><i className="fas fa-bath mr-1"></i> {property.bathrooms} {translate("baths", language)}</div>
            <div className="px-2 py-1"><i className="fas fa-vector-square mr-1"></i> {property.area} {translate("sqm", language)}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={property.owner?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(property.owner?.fullName || 'User')} 
                alt={property.owner?.fullName} 
                className="w-8 h-8 rounded-full mr-2 object-cover" 
                loading="lazy"
                width="32"
                height="32"
                decoding="async"
              />
              <span className="text-xs text-neutral-600">{property.owner?.fullName}</span>
            </div>
            <div className="text-xs text-neutral-500">{daysAgo} {translate("daysAgo", language)}</div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
