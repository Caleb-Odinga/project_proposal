import { useState, Dispatch, SetStateAction } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Share2, Calendar, MapPin, Home, Square, Share, CheckCircle } from "lucide-react";

export default function PropertyDetails() {
  const [, params] = useRoute('/property/:id');
  const [, navigate] = useLocation();
  const { isAuthenticated, user, language } = useStore();
  const { toast } = useToast();
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Fetch property details
  const { data: propertyData, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: propertyId > 0,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/properties/${propertyId}`);
      const data = await response.json();
      if (data.isFavorite) {
        setIsFavorite(data.isFavorite);
      }
      return data;
    }
  });

  const property = propertyData;
  
  // Handle image navigation
  const nextImage = () => {
    if (!property || !property.images) return;
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    if (!property || !property.images) return;
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  // Format price
  const formatPrice = (price?: number, listingType?: string) => {
    if (!price) return "";
    const formattedPrice = new Intl.NumberFormat('en-KE').format(price);
    return listingType === 'rent' ? `KSh ${formattedPrice}/month` : `KSh ${formattedPrice}`;
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to save this property to favorites",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${propertyId}`);
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "Property has been removed from your favorites"
        });
      } else {
        await apiRequest("POST", "/api/favorites", { propertyId });
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
          description: "Property has been added to your favorites"
        });
      }
      
      // Invalidate favorites query
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    }
  };

  // Send message to property owner
  const sendMessage = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to send a message",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSendingMessage(true);
      await apiRequest("POST", "/api/messages", {
        receiverId: property?.owner?.id,
        propertyId,
        content: message
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      });
      
      setMessage('');
      setIsMessageModalOpen(false);
      
      // Invalidate conversations query
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Share property
  const shareProperty = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: `Check out this property: ${property?.title}`,
        url: window.location.href
      }).catch(err => {
        toast({
          title: "Error",
          description: "Failed to share property",
          variant: "destructive"
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copied",
          description: "Property link copied to clipboard"
        });
      }).catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive"
        });
      });
    }
  };

  // Check if property is loading or doesn't exist
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-6" />
          
          <div className="relative mb-6">
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Skeleton className="h-16 w-full rounded" />
                <Skeleton className="h-16 w-full rounded" />
                <Skeleton className="h-16 w-full rounded" />
              </div>
              
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </div>
            
            <div>
              <div className="sticky top-20">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-heading font-bold mb-4">Property Not Found</h2>
        <p className="text-neutral-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Go back to homepage</Button>
      </div>
    );
  }

  // Property details content
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">{property.title}</h1>
        <p className="text-neutral-600 mb-6">
          <MapPin className="inline-block h-4 w-4 mr-1" /> {property.location}
        </p>
        
        {/* Property Images */}
        <div className="relative mb-6">
          <div className="relative h-80 rounded-lg overflow-hidden">
            <img 
              src={property.images[currentImageIndex]} 
              alt={property.title} 
              className="w-full h-full object-cover" 
            />
            
            <div className="absolute inset-0 flex items-center justify-between">
              <button 
                onClick={prevImage}
                className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2 ml-2"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={nextImage}
                className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2 mr-2"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
          
          {/* Thumbnail images */}
          <div className="flex mt-2 overflow-x-auto space-x-2">
            {/* Removed misplaced and invalid code */}

            {property.images.map((image: string, index: number) => (
              <button 
                key={index} 
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 h-16 w-16 rounded overflow-hidden ${
                  index === currentImageIndex ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img 
                  src={image} 
                  alt={`${property.title} - image ${index + 1}`} 
                  className="h-full w-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Property details */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-heading font-bold text-primary">
                {formatPrice(property.price, property.listingType)}
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleFavorite}
                  className={`p-2 rounded-full ${
                    isFavorite ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={shareProperty}
                  className="p-2 rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap mb-6">
              <Badge className={`mr-2 mb-2 ${property.listingType === 'rent' ? 'bg-primary' : 'bg-secondary'}`}>
                {property.listingType === 'rent' ? translate("forRent", language) : translate("forSale", language)}
              </Badge>
              <Badge variant="outline" className="mr-2 mb-2">
                {property.propertyType}
              </Badge>
              {property.verified && (
                <Badge variant="outline" className="mr-2 mb-2 bg-accent/10 text-accent border-0">
                  <CheckCircle className="h-3 w-3 mr-1" /> {translate("verified", language)}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-neutral-100 p-3 rounded text-center">
                <Home className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-sm font-medium">{property.bedrooms} {translate("beds", language)}</div>
              </div>
              <div className="bg-neutral-100 p-3 rounded text-center">
                <i className="fas fa-bath text-primary mb-1 block"></i>
                <div className="text-sm font-medium">{property.bathrooms} {translate("baths", language)}</div>
              </div>
              <div className="bg-neutral-100 p-3 rounded text-center">
                <Square className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-sm font-medium">{property.area} {translate("sqm", language)}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-heading font-semibold mb-2">Description</h3>
              <p className="text-neutral-700 whitespace-pre-line">{property.description}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-heading font-semibold mb-2">Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {property.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-accent" />
                  <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-heading font-semibold mb-2">Location</h3>
              <div className="h-64 bg-neutral-100 rounded-lg relative overflow-hidden">
                <iframe 
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01}%2C${property.latitude - 0.01}%2C${property.longitude + 0.01}%2C${property.latitude + 0.01}&marker=${property.latitude}%2C${property.longitude}`}
                  className="w-full h-full border-0"
                ></iframe>
              </div>
              <p className="text-sm text-neutral-600 mt-2">{property.address}</p>
            </div>
          </div>
          
          {/* Right column - Contact */}
          <div>
            <div className="sticky top-20">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage 
                        src={property.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(property.owner?.fullName || "")}`} 
                        alt={property.owner?.fullName} 
                      />
                      <AvatarFallback className="bg-primary text-white">
                        {property.owner?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{property.owner?.fullName}</h3>
                      <p className="text-xs text-neutral-500">{property.owner?.role}</p>
                    </div>
                  </div>
                  
                  <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full mb-3">
                        <MessageSquare className="h-4 w-4 mr-2" /> Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send a message about this property</DialogTitle>
                        <DialogDescription>
                          Your message will be sent to {property.owner?.fullName} regarding {property.title}
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Hi, I'm interested in this property. Is it still available?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                      />
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          onClick={sendMessage} 
                          disabled={isSendingMessage}
                        >
                          {isSendingMessage ? "Sending..." : "Send Message"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link copied",
                          description: "Property link copied to clipboard"
                        });
                      }
                    }}
                  >
                    <Share className="h-4 w-4 mr-2" /> Share
                  </Button>
                  
                  <div className="mt-6 text-sm text-neutral-500">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Listed on {new Date(property.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
