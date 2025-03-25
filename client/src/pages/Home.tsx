import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import SearchFilters from "@/components/SearchFilters";
import PropertyGrid from "@/components/PropertyGrid";
import NeighborhoodCard from "@/components/NeighborhoodCard";
import AffordabilityCalculator from "@/components/AffordabilityCalculator";

export default function Home() {
  const { searchFilters, setSearchFilters, language } = useStore();
  const [location, query] = useLocation();

  // Parse query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(query);
    
    // Extract filters from URL
    const filtersFromUrl: Record<string, any> = {};
    
    if (params.has('listingType')) {
      filtersFromUrl.listingType = params.get('listingType') || undefined;
    }
    
    if (params.has('location')) {
      filtersFromUrl.location = params.get('location') || undefined;
    }
    
    if (params.has('propertyType')) {
      filtersFromUrl.propertyType = params.get('propertyType') || undefined;
    }
    
    if (params.has('minPrice')) {
      filtersFromUrl.minPrice = parseInt(params.get('minPrice') || '0');
    }
    
    if (params.has('maxPrice')) {
      filtersFromUrl.maxPrice = parseInt(params.get('maxPrice') || '0');
    }
    
    if (params.has('minBedrooms')) {
      filtersFromUrl.minBedrooms = parseInt(params.get('minBedrooms') || '0');
    }
    
    if (params.has('features')) {
      filtersFromUrl.features = params.get('features')?.split(',') || undefined;
    }
    
    // Apply filters if any were found in URL
    if (Object.keys(filtersFromUrl).length > 0) {
      setSearchFilters(filtersFromUrl);
    }
  }, [query, setSearchFilters]);

  // Fetch neighborhoods
  const { data: neighborhoods, isLoading: isLoadingNeighborhoods } = useQuery({
    queryKey: ['/api/neighborhoods'],
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-secondary h-64 md:h-96 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80" 
            alt="Beautiful Kenyan houses" 
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/70 to-secondary/50"></div>
        </div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-2 md:mb-4">
            {translate("heroTitle", language)}
          </h2>
          <p className="text-white md:text-lg mb-6 max-w-xl">
            {translate("heroSubtitle", language)}
          </p>
          
          <div className="mt-4">
            <SearchFilters isHero={true} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <PropertyGrid />
      </main>

      {/* Features Section */}
      <section className="bg-neutral-100 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">
            {translate("whyChoose", language)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-map-marked-alt text-2xl text-primary"></i>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">
                {translate("localExpertise", language)}
              </h3>
              <p className="text-neutral-600">
                {translate("localExpertiseDesc", language)}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-shield-alt text-2xl text-secondary"></i>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">
                {translate("verifiedListings", language)}
              </h3>
              <p className="text-neutral-600">
                {translate("verifiedListingsDesc", language)}
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                <i className="fas fa-comments text-2xl text-accent"></i>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">
                {translate("directCommunication", language)}
              </h3>
              <p className="text-neutral-600">
                {translate("directCommunicationDesc", language)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhood Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            {translate("popularNeighborhoods", language)}
          </h2>
          <p className="text-neutral-600 mb-8">
            {translate("discoverProperties", language)}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoadingNeighborhoods ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden shadow-sm">
                  <div className="w-full h-40 bg-neutral-200 animate-pulse"></div>
                </div>
              ))
            ) : neighborhoods && neighborhoods.length > 0 ? (
              neighborhoods.map(neighborhood => (
                <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
              ))
            ) : (
              <div className="col-span-4 text-center py-4">
                <p>No neighborhoods available.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Affordability Calculator Section */}
      <section className="bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <AffordabilityCalculator />
        </div>
      </section>
      
      {/* Download App CTA */}
      <section className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">Download Our Mobile App</h2>
              <p className="text-white/80 mb-4 max-w-xl">Find your perfect home on the go. Our app works great on low-end devices and uses minimal data.</p>
              
              <div className="flex space-x-4">
                <a href="#" className="bg-black flex items-center px-4 py-2 rounded-lg hover:bg-neutral-800 transition">
                  <i className="fab fa-apple text-2xl mr-2"></i>
                  <div>
                    <div className="text-xs text-white/80">Download on the</div>
                    <div className="font-medium">App Store</div>
                  </div>
                </a>
                <a href="#" className="bg-black flex items-center px-4 py-2 rounded-lg hover:bg-neutral-800 transition">
                  <i className="fab fa-google-play text-2xl mr-2"></i>
                  <div>
                    <div className="text-xs text-white/80">GET IT ON</div>
                    <div className="font-medium">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            
            <div className="w-64 md:w-auto">
              <img 
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Nyumba mobile app" 
                className="max-h-72 rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
