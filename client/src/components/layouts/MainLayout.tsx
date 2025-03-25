import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useStore } from "@/lib/store";
import { translate } from "@/lib/i18n";
import LanguageToggle from "@/components/ui/language-toggle";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Home, Search, Heart, MessageSquare, User } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, user, language } = useStore();
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Get unread message count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    enabled: isAuthenticated,
  });

  const unreadCount = unreadData?.count || 0;

  // Handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-700">
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white ${scrolled ? 'shadow-md' : 'shadow-sm'} transition-shadow duration-300`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-2xl font-heading font-bold text-primary">
                <i className="fas fa-home mr-2"></i>{translate("brand", language)}
              </a>
            </Link>
            <div className="hidden md:flex ml-6 space-x-1">
              <Button variant="ghost" asChild>
                <Link href={`/?listingType=rent`}><a>{translate("rent", language)}</a></Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href={`/?listingType=sale`}><a>{translate("buy", language)}</a></Link>
              </Button>
              <Button variant="ghost">
                {translate("sell", language)}
              </Button>
              <Button variant="ghost">
                {translate("resources", language)}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
            {isAuthenticated ? (
              <>
                {user?.role !== 'tenant' && (
                  <Button className="hidden md:flex text-sm" asChild>
                    <Link href="/add-property"><a>{translate("listProperty", language)}</a></Link>
                  </Button>
                )}
                <Button variant="ghost" className="hidden md:block relative" asChild>
                  <Link href="/favorites">
                    <a>
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">{translate("favorites", language)}</span>
                    </a>
                  </Link>
                </Button>
                <Button variant="ghost" className="hidden md:block relative" asChild>
                  <Link href="/messages">
                    <a>
                      <MessageSquare className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                          {unreadCount}
                        </span>
                      )}
                      <span className="sr-only">{translate("messages", language)}</span>
                    </a>
                  </Link>
                </Button>
                <Button variant="ghost" className="p-2" asChild>
                  <Link href="/profile">
                    <a>
                      <ProfileAvatar user={user} />
                    </a>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="hidden md:block" asChild>
                  <Link href="/login"><a>{translate("login", language)}</a></Link>
                </Button>
                <Button className="hidden md:block" asChild>
                  <Link href="/register"><a>{translate("register", language)}</a></Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-800 text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">{translate("brand", language)}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("aboutUs", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("careers", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("contactUs", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("mediaCentre", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("investorRelations", language)}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">{translate("forTenants", language)}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("browseProperties", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("howToRent", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("tenantGuide", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("affordabilityCalculator", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("areaGuides", language)}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">{translate("forLandlords", language)}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("listYourProperty", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("landlordGuide", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("propertyManagement", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("commercialProperties", language)}</a></li>
                <li><a href="#" className="text-neutral-300 hover:text-white text-sm">{translate("advertiseWithUs", language)}</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">{translate("connectWithUs", language)}</h3>
              <div className="flex space-x-3 mb-4">
                <a href="#" className="bg-neutral-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="bg-neutral-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="bg-neutral-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="bg-neutral-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary transition">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
              
              <h3 className="font-heading font-semibold text-lg mb-2">{translate("subscribeNewsletter", language)}</h3>
              <div className="flex">
                <input type="email" placeholder={translate("emailPlaceholder", language)} className="flex-1 px-3 py-2 rounded-l-md bg-neutral-700 border border-neutral-600 text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                <button className="bg-primary hover:bg-primary-dark px-3 py-2 rounded-r-md transition">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-neutral-700 flex flex-col md:flex-row justify-between items-center">
            <div className="text-neutral-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Nyumba. {translate("copyright", language)}
            </div>
            
            <div className="flex flex-wrap justify-center space-x-4 text-sm text-neutral-400">
              <a href="#" className="hover:text-white mb-2 md:mb-0">{translate("termsOfService", language)}</a>
              <a href="#" className="hover:text-white mb-2 md:mb-0">{translate("privacyPolicy", language)}</a>
              <a href="#" className="hover:text-white mb-2 md:mb-0">{translate("cookiePolicy", language)}</a>
              <a href="#" className="hover:text-white">{translate("sitemap", language)}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex justify-around">
          <Link href="/">
            <a className="flex flex-col items-center py-2 text-primary">
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">{translate("home", language)}</span>
            </a>
          </Link>
          <Link href="/search">
            <a className="flex flex-col items-center py-2 text-neutral-500">
              <Search className="h-5 w-5" />
              <span className="text-xs mt-1">{translate("search", language)}</span>
            </a>
          </Link>
          <Link href="/favorites">
            <a className="flex flex-col items-center py-2 text-neutral-500">
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">{translate("saved", language)}</span>
            </a>
          </Link>
          <Link href="/messages">
            <a className="flex flex-col items-center py-2 text-neutral-500 relative">
              <MessageSquare className="h-5 w-5" />
              {isAuthenticated && unreadCount > 0 && (
                <span className="absolute top-1 right-5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
              <span className="text-xs mt-1">{translate("messages", language)}</span>
            </a>
          </Link>
          <Link href={isAuthenticated ? "/profile" : "/login"}>
            <a className="flex flex-col items-center py-2 text-neutral-500">
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">{translate("profile", language)}</span>
            </a>
          </Link>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
