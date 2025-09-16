import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Shirt, 
  Sparkles, 
  Menu, 
  X,
  MapPin,
  Clock,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{
    location: string;
    time: string;
  } | null>(null);
  const location = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/wardrobe', label: 'Wardrobe', icon: Shirt },
    { path: '/suggestions', label: 'Suggestions', icon: Sparkles },
  ];

  const handleLocationTime = () => {
    const currentTime = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Using a reverse geocoding service (you might want to add an API key)
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            const locationStr = `${data.city || 'Unknown City'}, ${data.countryName || 'Unknown Country'}`;
            
            setLocationInfo({
              location: locationStr,
              time: currentTime
            });

            toast({
              title: "Location & Time Updated! 📍",
              description: `${locationStr} • ${currentTime}`,
            });
          } catch (error) {
            setLocationInfo({
              location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              time: currentTime
            });

            toast({
              title: "Location & Time Updated! 📍", 
              description: `Coordinates obtained • ${currentTime}`,
            });
          }
        },
        (error) => {
          setLocationInfo({
            location: 'Location access denied',
            time: currentTime
          });

          toast({
            title: "Time Updated! ⏰",
            description: `Location unavailable • ${currentTime}`,
            variant: "destructive"
          });
        }
      );
    } else {
      setLocationInfo({
        location: 'Geolocation not supported',
        time: currentTime
      });

      toast({
        title: "Time Updated! ⏰",
        description: currentTime,
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-hero rounded-xl group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              StyleSuite
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Location & Time Button */}
            <button
              onClick={handleLocationTime}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-warm text-white font-medium rounded-xl hover:scale-105 transition-transform shadow-fashion-soft"
            >
              <MapPin className="w-4 h-4" />
              <Clock className="w-4 h-4" />
              Get Location
            </button>
            
            {/* Auth Section */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 rounded-xl">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="fashion-button-primary">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Location & Time Display */}
        {locationInfo && (
          <div className="pb-3 pt-1">
            <div className="bg-gradient-soft rounded-xl p-3 border border-border">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{locationInfo.location}</span>
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{locationInfo.time}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            
            <button
              onClick={() => {
                handleLocationTime();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-warm text-white font-medium rounded-xl mt-4"
            >
              <MapPin className="w-4 h-4" />
              <Clock className="w-4 h-4" />
              Get Location & Time
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;