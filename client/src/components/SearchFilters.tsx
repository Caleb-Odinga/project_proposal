import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { 
  PropertyTypes, 
  ListingTypes, 
  PriceRanges, 
  BedroomOptions,
  Features
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

interface SearchFiltersProps {
  isHero?: boolean;
}

export default function SearchFilters({ isHero = false }: SearchFiltersProps) {
  const { searchFilters, setSearchFilters, language } = useStore();
  const [, navigate] = useLocation();
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...searchFilters });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(searchFilters.features || []);

  // Update local filters when global filters change
  useEffect(() => {
    setLocalFilters({ ...searchFilters });
    setSelectedFeatures(searchFilters.features || []);
  }, [searchFilters]);

  const handleSearch = () => {
    const updatedFilters = {
      ...localFilters,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined
    };
    
    setSearchFilters(updatedFilters);
    navigate("/");
  };

  const handleFilterChange = (field: string, value: any) => {
    setLocalFilters({
      ...localFilters,
      [field]: value
    });
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const clearFilters = () => {
    setLocalFilters({ listingType: localFilters.listingType });
    setSelectedFeatures([]);
  };

  // Determine price range values from string (e.g., "20000-50000")
  const getPriceRangeValues = (priceRange: string) => {
    if (!priceRange) return { min: undefined, max: undefined };
    
    if (priceRange.endsWith("+")) {
      const min = parseInt(priceRange.replace("+", ""));
      return { min, max: undefined };
    }
    
    const [min, max] = priceRange.split("-").map(p => parseInt(p));
    return { min, max };
  };

  // Handle price range change
  const handlePriceRangeChange = (priceRange: string) => {
    const { min, max } = getPriceRangeValues(priceRange);
    setLocalFilters({
      ...localFilters,
      minPrice: min,
      maxPrice: max
    });
  };

  // Get bedroom count from string (e.g., "2+")
  const getBedroomCount = (bedrooms: string) => {
    if (!bedrooms) return undefined;
    return parseInt(bedrooms);
  };

  return (
    <div className={`${isHero ? 'bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-4xl' : 'bg-white rounded-lg shadow-sm p-4'}`}>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 mb-3 md:mb-0 md:mr-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-neutral-400"></i>
            </div>
            <Input 
              type="text" 
              placeholder={translate("searchPlaceholder", language)} 
              className="pl-10 h-12 md:h-10 touch-feedback"
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 md:mb-0">
          <Select 
            value={localFilters.propertyType || 'any'} 
            onValueChange={(value) => handleFilterChange('propertyType', value)}
          >
            <SelectTrigger className="h-12 md:h-10 touch-feedback">
              <SelectValue placeholder={translate(PropertyTypes[0].label, language)} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {PropertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value || 'any'} className="h-11 md:h-9">
                  {translate(type.label, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={
              localFilters.minPrice && localFilters.maxPrice
                ? `${localFilters.minPrice}-${localFilters.maxPrice}`
                : localFilters.minPrice
                ? `${localFilters.minPrice}+`
                : 'any_price'
            } 
            onValueChange={handlePriceRangeChange}
          >
            <SelectTrigger className="h-12 md:h-10 touch-feedback">
              <SelectValue placeholder={translate(PriceRanges[0].label, language)} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="any_price" className="h-11 md:h-9">
                {translate(PriceRanges[0].label, language)}
              </SelectItem>
              {PriceRanges.slice(1).map((range) => (
                <SelectItem key={range.value} value={range.value} className="h-11 md:h-9">
                  {translate(range.label, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            className="col-span-2 md:col-span-1 h-12 md:h-10 touch-feedback"
            onClick={handleSearch}
          >
            <i className="fas fa-search mr-2"></i>{translate("search", language)}
          </Button>
        </div>
      </div>
      
      {/* Additional filter badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-10 md:h-8 px-4 md:px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 border-0 touch-feedback"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
        >
          <Filter className="h-4 md:h-3.5 w-4 md:w-3.5 mr-1" />
          {translate("moreFilters", language)}
        </Button>
        
        {localFilters.minBedrooms && (
          <Badge variant="outline" className="h-10 md:h-8 px-4 md:px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 font-normal border-0">
            {localFilters.minBedrooms}+ {translate("beds", language)}
          </Badge>
        )}

        {selectedFeatures.map(feature => (
          <Badge 
            key={feature} 
            variant="outline" 
            className="h-10 md:h-8 flex items-center gap-1 px-4 md:px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 font-normal border-0"
          >
            {feature}
            <X 
              className="h-4 md:h-3 w-4 md:w-3 cursor-pointer touch-feedback" 
              onClick={() => handleFeatureToggle(feature)} 
            />
          </Badge>
        ))}

        {(localFilters.minBedrooms || selectedFeatures.length > 0 || localFilters.search) && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 md:h-8 px-4 md:px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 border-0 touch-feedback"
            onClick={clearFilters}
          >
            {translate("Clear", language)}
          </Button>
        )}
      </div>
      
      {/* More Filters Panel - Overlay on mobile */}
      {showMoreFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center md:static md:bg-transparent md:z-auto">
          <div className="bg-white w-full md:w-auto md:bg-neutral-50 max-h-[80vh] md:max-h-none overflow-y-auto rounded-t-lg md:rounded-lg p-5 md:p-4 md:border md:border-neutral-200 shadow-lg md:shadow-none md:mt-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h3 className="text-lg font-semibold">{translate("Filters", language)}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 rounded-full"
                onClick={() => setShowMoreFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">{translate("propertyType", language)}</Label>
                <Select 
                  value={localFilters.propertyType || 'any'} 
                  onValueChange={(value) => handleFilterChange('propertyType', value)}
                >
                  <SelectTrigger className="h-12 md:h-10 touch-feedback">
                    <SelectValue placeholder={translate(PropertyTypes[0].label, language)} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {PropertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value || 'any'} className="h-11 md:h-9">
                        {translate(type.label, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block text-sm font-medium">{translate("listingType", language)}</Label>
                <Select 
                  value={localFilters.listingType || 'any_listing'} 
                  onValueChange={(value) => handleFilterChange('listingType', value)}
                >
                  <SelectTrigger className="h-12 md:h-10 touch-feedback">
                    <SelectValue placeholder={translate("Select", language)} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="any_listing" className="h-11 md:h-9">{translate("Select", language)}</SelectItem>
                    {ListingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="h-11 md:h-9">
                        {translate(type.label, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="mb-2 block text-sm font-medium">{translate("beds", language)}</Label>
                <Select 
                  value={localFilters.minBedrooms?.toString() || 'any_beds'} 
                  onValueChange={(value) => handleFilterChange('minBedrooms', value === 'any_beds' ? undefined : getBedroomCount(value))}
                >
                  <SelectTrigger className="h-12 md:h-10 touch-feedback">
                    <SelectValue placeholder={translate(BedroomOptions[0].label, language)} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="any_beds" className="h-11 md:h-9">{translate(BedroomOptions[0].label, language)}</SelectItem>
                    {BedroomOptions.slice(1).map((option) => (
                      <SelectItem key={option.value} value={option.value} className="h-11 md:h-9">
                        {translate(option.label, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-5 md:mt-4">
              <Label className="mb-2 block text-sm font-medium">{translate("features", language)}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                {Features.map((feature) => (
                  <div key={feature.value} className="flex items-center space-x-2 py-2 md:py-0 touch-feedback">
                    <Checkbox 
                      id={feature.value}
                      checked={selectedFeatures.includes(feature.value)}
                      onCheckedChange={() => handleFeatureToggle(feature.value)}
                      className="h-5 w-5 md:h-4 md:w-4"
                    />
                    <Label htmlFor={feature.value} className="text-sm font-normal cursor-pointer">
                      {translate(feature.label, language)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 md:mt-4 flex justify-between md:justify-end space-x-3 safe-area-bottom pb-2">
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none h-12 md:h-10 touch-feedback"
                onClick={() => setShowMoreFilters(false)}
              >
                {translate("Cancel", language)}
              </Button>
              <Button 
                className="flex-1 md:flex-none h-12 md:h-10 touch-feedback"
                onClick={() => {
                  handleSearch();
                  setShowMoreFilters(false);
                }}
              >
                {translate("Apply Filters", language)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
