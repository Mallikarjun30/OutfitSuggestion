import { Link } from 'react-router-dom';
import { Shirt, Sparkles, Upload, Zap } from 'lucide-react';
import fashionHero from '@/assets/fashion-hero.jpg';

const Home = () => {
  const features = [
    {
      icon: Shirt,
      title: 'Smart Wardrobe',
      description: 'Upload and organize your clothing items with AI-powered categorization',
      link: '/wardrobe',
      gradient: 'bg-gradient-fashion'
    },
    {
      icon: Sparkles, 
      title: 'AI Suggestions',
      description: 'Get personalized outfit recommendations based on weather and style',
      link: '/suggestions',
      gradient: 'bg-gradient-success'
    },
    {
      icon: Upload,
      title: 'Quick Upload',
      description: 'Easily add new items to your wardrobe with our smart upload system',
      link: '/wardrobe?upload=true',
      gradient: 'bg-gradient-warm'
    },
    {
      icon: Zap,
      title: 'Instant Style',
      description: 'Real-time style analysis and outfit coordination powered by AI',
      link: '/suggestions',
      gradient: 'bg-gradient-hero'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
                    Your Personal{' '}
                    <span className="bg-gradient-hero bg-clip-text text-transparent">
                      AI Stylist
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                    Transform your wardrobe with intelligent style suggestions. 
                    Upload your clothes, get weather-aware recommendations, and discover 
                    your perfect look with AI-powered fashion assistance.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/wardrobe"
                    className="fashion-button-primary text-center inline-flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Start Building Wardrobe
                  </Link>
                  <Link
                    to="/suggestions"
                    className="fashion-button-success text-center inline-flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Get AI Suggestions
                  </Link>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    AI-Powered
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse"></div>
                    Weather-Aware
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-accent-rose rounded-full animate-pulse"></div>
                    Style Learning
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-hero rounded-3xl opacity-20 animate-pulse"></div>
                <img
                  src={fashionHero}
                  alt="AI Fashion Stylist Hero"
                  className="w-full h-auto rounded-3xl shadow-fashion-medium relative z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-soft">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Everything You Need for{' '}
                <span className="bg-gradient-fashion bg-clip-text text-transparent">
                  Perfect Style
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover how AI can revolutionize your daily outfit choices with smart, 
                personalized recommendations that adapt to your lifestyle.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={index}
                    to={feature.link}
                    className="fashion-card group cursor-pointer hover:scale-105"
                  >
                    <div className="text-center space-y-4">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform",
                        feature.gradient
                      )}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="fashion-card bg-gradient-hero text-white">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Transform Your Style?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Join thousands of users who've discovered their perfect style with AI assistance.
                Start your fashion journey today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/wardrobe"
                  className="bg-white text-primary px-8 py-4 rounded-2xl font-semibold hover:bg-white/90 transition-colors"
                >
                  Upload First Items
                </Link>
                <Link
                  to="/suggestions"
                  className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Explore AI Suggestions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default Home;