import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PropertyCard from "@/components/PropertyCard";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import MapView from "@/components/MapView";
import { Property } from "@shared/schema";

interface PropertyGridProps {
  location?: string;
  showToggle?: boolean;
}

export default function PropertyGrid({ location, showToggle = true }: PropertyGridProps) {
  const { searchFilters, showMap, toggleMapView, language } = useStore();
  const [sortBy, setSortBy] = useState("recommended");

  // Build the query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (searchFilters.search) params.append("search", searchFilters.search);
    if (searchFilters.location || location) params.append("location", searchFilters.location || location || "");
    if (searchFilters.propertyType) params.append("propertyType", searchFilters.propertyType);
    if (searchFilters.listingType) params.append("listingType", searchFilters.listingType);
    if (searchFilters.minPrice) params.append("minPrice", searchFilters.minPrice.toString());
    if (searchFilters.maxPrice) params.append("maxPrice", searchFilters.maxPrice.toString());
    if (searchFilters.minBedrooms) params.append("minBedrooms", searchFilters.minBedrooms.toString());
    if (searchFilters.features && searchFilters.features.length > 0) {
      params.append("features", searchFilters.features.join(","));
    }
    
    return params.toString();
  };

  // Fetch properties
  // Define the API response type
  type PropertyResponse = {
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
    features: string[] | null;
    images: string[] | null;
    ownerId: number;
    verified: boolean | null;
    createdAt: string | null;
  };

  const { data: properties, isLoading, error } = useQuery<PropertyResponse[]>({
    queryKey: [`/api/properties?${buildQueryString()}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties?${buildQueryString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
  });

  // Sort properties
  const sortedProperties = Array.isArray(properties) ? [...properties].map(p => ({
    ...p,
    features: p.features || [],
    images: p.images || [],
    createdAt: p.createdAt || new Date().toISOString(),
    verified: p.verified ?? false,
    isFavorite: false // This will be updated by the PropertyCard component if needed
  })) : [];

  if (sortedProperties.length > 0) {
    switch (sortBy) {
      case "price-low":
        sortedProperties.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sortedProperties.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        sortedProperties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        // Recommended sorting is default
        break;
    }
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">Error loading properties. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      {showToggle && (
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-heading font-semibold mb-1">
              {isLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                `${sortedProperties.length} ${translate("propertiesIn", language)} ${location || "Kenya"}`
              )}
            </h2>
            <p className="text-sm text-neutral-500">
              {translate("showingProperties", language)} {searchFilters.listingType === "rent" ? translate("forRent", language).toLowerCase() : translate("forSale", language).toLowerCase()}
            </p>
          </div>
          <div className="flex mt-2 sm:mt-0 space-x-2">
            <div className="flex bg-neutral-100 rounded-lg overflow-hidden">
              <button 
                className={`px-4 py-2 text-sm ${!showMap ? 'bg-white text-primary border border-primary' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-t border-b border-neutral-200'} rounded-l-lg`}
                onClick={() => showMap && toggleMapView()}
              >
                <i className="fas fa-list mr-2"></i>{translate("list", language)}
              </button>
              <button 
                className={`px-4 py-2 text-sm ${showMap ? 'bg-white text-primary border border-primary' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-t border-b border-neutral-200'} rounded-r-lg`}
                onClick={() => !showMap && toggleMapView()}
              >
                <i className="fas fa-map-marker-alt mr-2"></i>{translate("map", language)}
              </button>
            </div>
            <select 
              className="text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">{translate("recommended", language)}</option>
              <option value="price-low">{translate("priceLowToHigh", language)}</option>
              <option value="price-high">{translate("priceHighToLow", language)}</option>
              <option value="newest">{translate("newestFirst", language)}</option>
            </select>
          </div>
        </div>
      )}

      {showMap ? (
        <MapView properties={sortedProperties} isLoading={isLoading} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
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
            ))
          ) : sortedProperties.length > 0 ? (
            sortedProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))
          ) : (
            <div className="col-span-3 py-8 text-center">
              <p>No properties found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {Array.isArray(properties) && properties.length > 0 && !showMap && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center">
            <button onClick={() => {}} className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-l-lg text-neutral-700">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button onClick={() => {}} className="px-4 py-2 bg-primary text-white">1</button>
            <button onClick={() => {}} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700">2</button>
            <button onClick={() => {}} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700">3</button>
            <span className="px-4 py-2 bg-neutral-100 text-neutral-700">...</span>
            <button onClick={() => {}} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700">12</button>
            <button onClick={() => {}} className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-r-lg text-neutral-700">
              <i className="fas fa-chevron-right"></i>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
