import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages } from "@/lib/constants";
import { LogOut, User, Mail, Phone, Globe } from "lucide-react";

export default function Profile() {
  const { isAuthenticated, user, logout, setLanguage, language } = useStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    language: user?.language || 'en'
  });

  // Fetch user properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<any[]>({
    queryKey: ['/api/properties'],
    enabled: isAuthenticated && (user?.role === 'landlord' || user?.role === 'agent'),
  });

  // Check authentication
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      
      await apiRequest("PATCH", "/api/users/profile", formData);
      
      // Update language in store if changed
      if (formData.language !== user?.language) {
        setLanguage(formData.language);
      }
      
      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold mb-6">
        {translate("profile", language)}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - User info */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "")}&background=E56B1F&color=fff&size=128`} 
                    alt={user?.fullName} 
                  />
                  <AvatarFallback className="text-2xl bg-primary text-white">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{user?.fullName}</CardTitle>
              <CardDescription>{formatRole(user?.role || "")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-neutral-500" />
                  <span>{user?.username}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                  <span>{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-neutral-500" />
                  <span>
                    {Languages.find(l => l.value === user?.language)?.label || "English"}
                  </span>
                </div>
              </div>
              {user?.bio && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600">{user.bio}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> {translate("logout", language)}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              {(user?.role === 'landlord' || user?.role === 'agent') && (
                <TabsTrigger value="properties">My Properties</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input 
                          id="avatar"
                          name="avatar"
                          value={formData.avatar}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select 
                          value={formData.language} 
                          onValueChange={(value) => handleSelectChange('language', value)}
                        >
                          <SelectTrigger id="language" className="mt-1">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {Languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Full Name</Label>
                        <p className="text-neutral-700 mt-1">{user?.fullName}</p>
                      </div>
                      
                      <div>
                        <Label>Phone Number</Label>
                        <p className="text-neutral-700 mt-1">{user?.phone || "Not provided"}</p>
                      </div>
                      
                      <div>
                        <Label>Email</Label>
                        <p className="text-neutral-700 mt-1">{user?.email}</p>
                      </div>
                      
                      <div>
                        <Label>Language</Label>
                        <p className="text-neutral-700 mt-1">
                          {Languages.find(l => l.value === user?.language)?.label || "English"}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Bio</Label>
                        <p className="text-neutral-700 mt-1 whitespace-pre-line">{user?.bio || "No bio provided"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => {
                      setFormData({
                        fullName: user?.fullName || '',
                        phone: user?.phone || '',
                        bio: user?.bio || '',
                        avatar: user?.avatar || '',
                        language: user?.language || 'en'
                      });
                      setIsEditing(true);
                    }}>
                      Edit Profile
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            {(user?.role === 'landlord' || user?.role === 'agent') && (
              <TabsContent value="properties" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>My Properties</CardTitle>
                      <Button size="sm" onClick={() => navigate('/add-property')}>
                        Add Property
                      </Button>
                    </div>
                    <CardDescription>
                      Manage your listed properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingProperties ? (
                      <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex items-start space-x-4">
                            <Skeleton className="h-20 w-24 rounded" />
                            <div className="flex-1">
                              <Skeleton className="h-5 w-2/3 mb-2" />
                              <Skeleton className="h-4 w-1/3 mb-2" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !properties || properties.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-neutral-500 mb-4">You haven't listed any properties yet</p>
                        <Button size="sm" onClick={() => navigate('/add-property')}>
                          Add Your First Property
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-200">
                        {properties.map((property: any) => (
                          <div key={property.id} className="p-4 hover:bg-neutral-50 flex">
                            <img 
                              src={property.images[0]} 
                              alt={property.title} 
                              className="h-20 w-24 object-cover rounded mr-4"
                            />
                            <div className="flex-1">
                              <h3 className="font-medium">{property.title}</h3>
                              <p className="text-sm text-neutral-500">{property.location}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-primary font-semibold">
                                  {property.listingType === 'rent' 
                                    ? `KSh ${new Intl.NumberFormat('en-KE').format(property.price)}/month` 
                                    : `KSh ${new Intl.NumberFormat('en-KE').format(property.price)}`}
                                </span>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => navigate(`/property/${property.id}`)}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => navigate(`/edit-property/${property.id}`)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
