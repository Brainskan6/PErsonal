import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Users, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">Financial Planning Report Generator</h1>
                <p className="text-sm text-muted-foreground">
                  Professional financial planning made simple
                </p>
              </div>
            </div>
            <Button onClick={handleLogin} data-testid="button-login">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Create Comprehensive Financial Plans
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate professional financial planning reports with structured client data, 
            expert strategies, and automated report compilation.
          </p>
          <Button size="lg" onClick={handleGetStarted} data-testid="button-get-started">
            Get Started
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive client data collection with support for individuals and couples
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Strategy Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Curated financial strategies with customizable parameters for each client
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Report Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated report compilation with professional formatting and export options
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your client data is protected with enterprise-grade security and privacy
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto">
                1
              </div>
              <h4 className="text-xl font-semibold">Input Client Data</h4>
              <p className="text-muted-foreground">
                Collect comprehensive financial information using our structured forms
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto">
                2
              </div>
              <h4 className="text-xl font-semibold">Select Strategies</h4>
              <p className="text-muted-foreground">
                Choose from our curated strategy bank and customize parameters
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto">
                3
              </div>
              <h4 className="text-xl font-semibold">Generate Report</h4>
              <p className="text-muted-foreground">
                Create professional reports ready for client presentation
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Join financial professionals who trust our platform for comprehensive planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={handleLogin} data-testid="button-start-planning">
                Start Planning Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Financial Planning Report Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}