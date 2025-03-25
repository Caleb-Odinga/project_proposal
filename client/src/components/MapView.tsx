import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import L from "leaflet";

interface Property {
  id: number;
  title: string;
  price: number;
  listingType: string;
  location: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
}

interface MapViewProps {
  properties: Property[];
  isLoading: boolean;
}

export default function MapView({ properties, isLoading }: MapViewProps) {
  const { language } = useStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Initialize map with touch zoom and drag options optimized for mobile
    const map = L.map(mapRef.current, {
      center: DEFAULT_MAP_CENTER as L.LatLngTuple,
      zoom: DEFAULT_MAP_ZOOM,
      zoomControl: false, // We'll add it in a different position better for mobile
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: false, // Disable scroll wheel zoom on mobile
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: false, // Disable keyboard navigation on mobile
      bounceAtZoomLimits: true,
      maxBoundsViscosity: 1.0, // Prevents panning outside bounds
    });
    
    // Add zoom control to bottom right for better mobile UX
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);
    
    // Use a more mobile-friendly tile provider with better performance
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      minZoom: 3
    }).addTo(map);

    leafletMapRef.current = map;
    
    // Handle responsive updates
    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!leafletMapRef.current || isLoading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    if (properties.length > 0) {
      // Create bounds to fit all markers
      const bounds = L.latLngBounds([]);

      properties.forEach(property => {
        const { latitude, longitude } = property;
        
        // Skip properties without valid coordinates
        if (!latitude || !longitude) return;

        // Create marker
        const marker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="${property.listingType === 'rent' ? 'bg-primary' : 'bg-secondary'} text-white px-2 py-1 rounded-full shadow-md text-xs font-semibold">KSh ${new Intl.NumberFormat('en-KE').format(property.price)}</div>`,
            iconSize: [60, 30],
            iconAnchor: [30, 15]
          })
        }).addTo(leafletMapRef.current!);

        // Add click handler
        marker.on('click', () => {
          setSelectedProperty(property);
        });

        // Add to refs array for cleanup
        markersRef.current.push(marker);

        // Extend bounds to include this marker
        bounds.extend([latitude, longitude]);
      });

      // Fit map to bounds if we have any valid properties
      if (bounds.isValid()) {
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // If no properties, reset to default view
      leafletMapRef.current.setView(DEFAULT_MAP_CENTER as L.LatLngTuple, DEFAULT_MAP_ZOOM);
    }
  }, [properties, isLoading]);

  // Format price for display
  const formatPrice = (price: number, listingType: string) => {
    const formattedPrice = new Intl.NumberFormat('en-KE').format(price);
    return listingType === 'rent' ? `KSh ${formattedPrice}/month` : `KSh ${formattedPrice}`;
  };

  return (
    <div className="relative h-[70vh] md:h-[60vh] rounded-lg overflow-hidden mobile-optimize">
      {isLoading ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <div ref={mapRef} className="w-full h-full" />
      )}

      {/* Property Info Popup */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-0 right-0 mx-auto w-[90%] max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom safe-area-bottom">
          <button 
            className="absolute top-2 right-2 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md touch-feedback"
            onClick={() => setSelectedProperty(null)}
            aria-label="Close property details"
          >
            <i className="fas fa-times text-neutral-500"></i>
          </button>
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/3 h-40 sm:h-auto">
              <img 
                src={selectedProperty.images[0]} 
                alt={selectedProperty.title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="w-full sm:w-2/3 p-4">
              <h3 className="font-semibold text-base mb-1 line-clamp-1">{selectedProperty.title}</h3>
              <p className="text-primary font-semibold text-base mb-1">
                {formatPrice(selectedProperty.price, selectedProperty.listingType)}
              </p>
              <p className="text-sm text-neutral-500 mb-2">
                <i className="fas fa-map-marker-alt mr-1"></i> {selectedProperty.location}
              </p>
              <div className="flex items-center text-sm text-neutral-600 mb-3">
                <span className="mr-4"><i className="fas fa-bed mr-1"></i> {selectedProperty.bedrooms} {translate("beds", language)}</span>
                <span><i className="fas fa-bath mr-1"></i> {selectedProperty.bathrooms} {translate("baths", language)}</span>
              </div>
              <div className="flex">
                <a 
                  href={`/property/${selectedProperty.id}`} 
                  className="w-full block text-center font-medium bg-primary text-white py-2.5 px-4 rounded-md hover:bg-primary-dark transition-colors touch-feedback"
                >
                  {translate("View Details", language)}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Loading Indicator or Instructions */}
      {!isLoading && properties.length > 0 && (
        <div className="absolute bottom-20 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-md text-xs text-center">
          <p>{translate("Tap on markers to view details", language)}</p>
        </div>
      )}
    </div>
  );
}
