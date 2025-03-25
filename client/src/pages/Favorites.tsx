import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { useLocation } from "wouter";

export default function Favorites() {
  const { isAuthenticated, language } = useStore();
  const [, navigate] = useLocation();

  // Fetch favorites
  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ['/api/favorites'],
    enabled: isAuthenticated,
  });

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-neutral-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">Login to View Your Favorites</h2>
          <p className="text-neutral-600 mb-6">
            You need to be logged in to save and view your favorite properties.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => navigate('/login')}>Login</Button>
            <Button variant="outline" onClick={() => navigate('/register')}>Register</Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md">
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-4 w-48 mb-3" />
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-bold mb-4">Error Loading Favorites</h2>
        <p className="text-neutral-600 mb-6">
          Something went wrong while trying to load your favorite properties. Please try again later.
        </p>
        <Button onClick={() => navigate('/')}>Go to Homepage</Button>
      </div>
    );
  }

  // Empty state
  if (!favorites || favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-neutral-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-4">No Favorites Yet</h2>
          <p className="text-neutral-600 mb-6">
            You haven't saved any properties to your favorites yet. Start exploring properties and click the heart icon to save them here.
          </p>
          <Button onClick={() => navigate('/')}>Browse Properties</Button>
        </div>
      </div>
    );
  }

  // Favorites found
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold mb-6">
        {translate("favorites", language)} ({favorites.length})
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map(property => (
          <PropertyCard 
            key={property.id} 
            property={{...property, isFavorite: true}} 
          />
        ))}
      </div>
    </div>
  );
}
