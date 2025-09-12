import { useState } from 'react';
import { User, Settings, Palette, Bell, Shield, HelpCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const [preferences, setPreferences] = useState({
    notifications: true,
    weatherUpdates: true,
    styleAlerts: false,
    darkMode: false,
  });

  const { toast } = useToast();

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Preference updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const profileSections = [
    {
      icon: User,
      title: 'Personal Info',
      description: 'Manage your account details and preferences',
      action: () => toast({ title: "Coming Soon!", description: "Profile editing will be available soon" })
    },
    {
      icon: Palette,
      title: 'Style Preferences',
      description: 'Set your favorite colors, styles, and brands',
      action: () => toast({ title: "Coming Soon!", description: "Style customization will be available soon" })
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Control your notification preferences',
      action: () => {}
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Manage your privacy settings and security options',
      action: () => toast({ title: "Coming Soon!", description: "Security settings will be available soon" })
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-warm rounded-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-warm bg-clip-text text-transparent">
                Profile & Settings
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Customize your AI stylist experience and manage your account preferences.
            </p>
          </div>

          {/* Profile Overview */}
          <div className="fashion-card bg-gradient-hero text-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
                <p className="text-white/80 mb-4">
                  You're making great progress with your style journey. Keep exploring new looks!
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-white/70">Outfits Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-white/70">Items Uploaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-white/70">AI Suggestions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {profileSections.map((section, index) => {
              const Icon = section.icon;
              
              return (
                <div key={index} className="fashion-card hover:scale-105 transition-transform">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-fashion rounded-xl">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                      <p className="text-muted-foreground mb-4">{section.description}</p>
                      
                      {section.title === 'Notifications' ? (
                        <div className="space-y-3">
                          {Object.entries(preferences).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <label className="text-sm font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </label>
                              <button
                                onClick={() => handlePreferenceChange(key, !value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  value ? 'bg-primary' : 'bg-muted'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    value ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={section.action}
                          className="text-primary hover:text-primary/80 font-medium text-sm"
                        >
                          Configure →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help & Support */}
          <div className="fashion-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-success rounded-xl">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Help & Support</h3>
                <p className="text-muted-foreground">Get help and share feedback about your experience</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => toast({ 
                  title: "Help Center", 
                  description: "Help documentation will be available soon" 
                })}
                className="fashion-input text-left hover:border-primary transition-colors"
              >
                <div className="font-medium">Help Center</div>
                <div className="text-sm text-muted-foreground">Find answers to common questions</div>
              </button>
              
              <button
                onClick={() => toast({ 
                  title: "Feedback", 
                  description: "Thank you for your interest in providing feedback!" 
                })}
                className="fashion-input text-left hover:border-primary transition-colors"
              >
                <div className="font-medium">Send Feedback</div>
                <div className="text-sm text-muted-foreground">Help us improve your experience</div>
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="fashion-card bg-gradient-soft text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">StyleSuite AI</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Your intelligent fashion companion, powered by cutting-edge AI technology.
            </p>
            <div className="text-sm text-muted-foreground">
              Version 1.0.0 • Made with ❤️ for fashion enthusiasts
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;