import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, FileText, Plus, User, Target, FileBarChart, LogOut, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useAIIntegration } from "@/hooks/useAIIntegration";
import ClientDataForm from "./ClientDataForm";
import StrategyBank from "./StrategyBank";
import ReportPreview from "./ReportPreview";
import StrategyAdmin from "./StrategyAdmin";
import type { ClientData, Strategy, ClientStrategyConfig } from "@shared/schema";
import AuthForm from "./AuthForm";

type ActiveTab = 'client' | 'strategies' | 'report';

export default function FinancialPlanningLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('client');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedCustomStrategies, setSelectedCustomStrategies] = useState<string[]>([]);
  const [strategyConfigurations, setStrategyConfigurations] = useState<ClientStrategyConfig[]>([]);
  const [reportText, setReportText] = useState("");
  const [showStrategyAdmin, setShowStrategyAdmin] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);

  const { toast } = useToast();
  const { customizeReport, generateInsights, isProcessing: aiProcessing } = useAIIntegration();
  const queryClient = useQueryClient();
  const { user, isLoading, logout } = useAuth();

  // State to manage the report generation process
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);


  // Fetch strategies (available to everyone)
  const { data: strategies = [], isLoading: strategiesLoading, error: strategiesError } = useQuery<Strategy[]>({
    queryKey: ['/api/strategies'],
    queryFn: async () => {
      const response = await fetch('/api/strategies');
      if (!response.ok) {
        throw new Error('Failed to fetch strategies');
      }
      return await response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch custom strategies (only if authenticated)
  const { data: customStrategies = [], isLoading: customStrategiesLoading } = useQuery<Strategy[]>({
    queryKey: ['/api/custom-strategies'],
    queryFn: async () => {
      if (!user) return []; // No custom strategies for guests
      try {
        const response = await apiRequest('/api/custom-strategies', 'GET');
        if (!response.ok) {
          return [];
        }
        return await response.json();
      } catch (error) {
        console.warn('Failed to fetch custom strategies:', error);
        return [];
      }
    },
    enabled: !!user, // Only run if user is authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch client data (only if authenticated)
  const { data: clientData, isLoading: clientDataLoading, refetch: refetchClientData } = useQuery<ClientData | null>({
    queryKey: ['/api/client-data/current'],
    queryFn: async () => {
      if (!user) return null; // No saved data for guests
      try {
        const response = await apiRequest('/api/client-data/current', 'GET');
        if (!response.ok) {
          if (response.status === 404) {
            return null; // No client data found, this is okay
          }
          throw new Error('Failed to fetch client data');
        }
        return await response.json();
      } catch (error) {
        console.warn('Failed to fetch client data:', error);
        return null;
      }
    },
    enabled: !!user, // Only run if user is authenticated
    retry: false, // Don't retry if no data exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Save client data mutation (only if authenticated)
  const saveClientDataMutation = useMutation({
    mutationFn: async (data: ClientData) => {
      if (!user) {
        // For guests, just store locally (no server save)
        return data;
      }
      const response = await apiRequest('/api/client-data', 'POST', data);
      if (!response.ok) {
        throw new Error('Failed to save client data');
      }
      return await response.json();
    },
    onSuccess: (savedData) => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/client-data/current'] });
        toast({
          title: "Client data saved",
          description: "Client information has been saved to your account.",
        });
      } else {
        toast({
          title: "Data ready",
          description: "Client information is ready for report generation. Sign in to save permanently.",
        });
      }
    },
    onError: (error) => {
      console.error('Save client data error:', error);
      toast({
        title: user ? "Error saving data" : "Data ready",
        description: user ? "Failed to save client information. Please try again." : "Client information is ready for report generation.",
        variant: user ? "destructive" : "default",
      });
    },
  });

  // Generate report mutation (works for everyone)
  const generateReportMutation = useMutation({
    mutationFn: async ({ clientData, strategyConfigurations, selectedCustomStrategyIds }: { 
      clientData: ClientData; 
      strategyConfigurations: ClientStrategyConfig[];
      selectedCustomStrategyIds?: string[];
    }) => {
      // Use regular fetch for guest users, apiRequest for authenticated users
      const requestFn = user ? 
        () => apiRequest('/api/reports/generate', 'POST', { clientData, strategyConfigurations, selectedCustomStrategyIds }) :
        () => fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientData, strategyConfigurations, selectedCustomStrategyIds })
        });

      const response = await requestFn();
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      setReportText(data.report);
      toast({
        title: "Report generated",
        description: "Financial planning report has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Generate report error:', error);
      toast({
        title: "Error generating report",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const selectedStrategyObjects = Array.isArray(strategies) ? strategies.filter((s: Strategy) => selectedStrategies.includes(s.id)) : [];
  const selectedCustomStrategyObjects = Array.isArray(customStrategies) ? customStrategies.filter((s: Strategy) => selectedCustomStrategies.includes(s.id)) : [];


  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    console.log('Dark mode toggled:', !isDarkMode);
  };

  const handleClientDataSubmit = (data: ClientData) => {
    console.log('Client data submitted:', data);
    saveClientDataMutation.mutate(data, {
      onSuccess: (savedData) => {
        console.log('Client data saved successfully:', savedData);
        // The data should persist in the form since initialData will be updated
      },
      onError: (error) => {
        console.error('Error saving client data:', error);
      }
    });
  };

  const handleStrategyToggle = (strategyId: string) => {
    // Check if this is a custom strategy
    const isCustomStrategy = customStrategies.some(strategy => strategy.id === strategyId);

    if (isCustomStrategy) {
      // Handle custom strategy selection
      setSelectedCustomStrategies(prev => {
        const isCurrentlySelected = prev.includes(strategyId);

        if (isCurrentlySelected) {
          return prev.filter(id => id !== strategyId);
        } else {
          return [...prev, strategyId];
        }
      });
    } else {
      // Handle built-in strategy selection
      setSelectedStrategies(prev => {
        const isCurrentlySelected = prev.includes(strategyId);

        if (isCurrentlySelected) {
          return prev.filter(id => id !== strategyId);
        } else {
          return [...prev, strategyId];
        }
      });
    }
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedStrategies(selectedIds);
  };

  const handleStrategyConfigChange = (strategyId: string, config: Partial<Strategy>) => {
    // You can implement this to update strategy configurations
    // For now, we'll just log the change
    console.log('Strategy configuration changed:', strategyId, config);

    // TODO: Implement strategy configuration persistence if needed
    // This could involve updating a local state or making an API call
  };

  const generateReport = async () => {
    if (!clientData) {
      toast({
        title: "Client data required",
        description: "Please fill out client data before generating a report.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Create strategy configurations for all selected strategies (built-in + custom)
      const allSelectedStrategies = [...selectedStrategies, ...selectedCustomStrategies];
      const enabledConfigs = allSelectedStrategies.map(strategyId => ({
        strategyId,
        isEnabled: true,
        inputValues: strategyConfigurations.find(config => config.strategyId === strategyId)?.inputValues || {}
      }));

      console.log('Generating report with:', {
        selectedStrategies,
        selectedCustomStrategies,
        allConfigs: enabledConfigs
      });

      await generateReportMutation.mutateAsync({ 
        clientData, 
        strategyConfigurations: enabledConfigs, // Pass the fetched configurations
        selectedCustomStrategyIds: selectedCustomStrategies
      });

    } catch (error) {
      console.error('Error in generateReport function:', error);
      toast({
        title: "Error",
        description: "Failed to initiate report generation. Please check client data and strategy selections.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportReport = () => {
    if (!reportText) {
      toast({
        title: "No report to export",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-planning-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "The report has been downloaded as a text file.",
    });
    console.log('Report exported successfully');
  };

  const completionStatus = {
    clientData: !!clientData && !clientDataLoading,
    strategies: selectedStrategies.length > 0 || selectedCustomStrategies.length > 0,
    report: !!clientData && (selectedStrategies.length > 0 || selectedCustomStrategies.length > 0) && !!reportText
  };

  const isLoadingData = clientDataLoading || saveClientDataMutation.isPending || generateReportMutation.isPending || isGeneratingReport || strategiesLoading || customStrategiesLoading;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'client':
        return (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">
              Client Information
              {saveClientDataMutation.isPending && (
                <span className="text-sm font-normal text-muted-foreground ml-2">Saving...</span>
              )}
            </h2>
            <ClientDataForm
              onSubmit={handleClientDataSubmit}
              initialData={clientData ?? undefined}
            />
          </Card>
        );
      case 'strategies':
        return isLoadingData ? (
          <Card className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading strategies...</p>
          </Card>
        ) : (
          <StrategyBank
              strategies={strategies}
              customStrategies={customStrategies} // Ensure customStrategies is passed
              selectedStrategies={[...selectedStrategies, ...selectedCustomStrategies]}
              onStrategyToggle={handleStrategyToggle}
              onSelectionChange={handleSelectionChange}
              onStrategyConfigChange={handleStrategyConfigChange}
            />
        );
      case 'report':
        return (
          <ReportPreview
              clientData={clientData}
              selectedStrategies={[
                ...strategies.filter(s => selectedStrategies.includes(s.id)),
                ...customStrategies.filter(s => selectedCustomStrategies.includes(s.id))
              ]}
              reportText={reportText}
              onGenerateReport={generateReport}
              onExportReport={exportReport}
              isGenerating={isGeneratingReport}
            />
        );
      default:
        return null;
    }
  };

  const tabButtons = [
    {
      key: 'client' as const,
      label: 'Client Information',
      icon: User,
      status: completionStatus.clientData,
      description: 'Personal and financial details'
    },
    {
      key: 'strategies' as const,
      label: 'Strategy Bank',
      icon: Target,
      status: completionStatus.strategies,
      description: 'Select financial strategies'
    },
    {
      key: 'report' as const,
      label: 'Report',
      icon: FileBarChart,
      status: completionStatus.report,
      description: 'Generate and export report'
    }
  ];

  // Show loading indicator only if strategies are loading
  if (strategiesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  // Render the main layout for authenticated users
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-background`}>
      {/* Modern Header with Tab Navigation */}
      <header className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-500 rounded-md shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800" data-testid="text-app-title">
                  Financial Planning Report Generator
                </h1>
                <p className="text-xs text-slate-600">
                  Create comprehensive financial plans with structured data and expert strategies
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="bg-white/50 hover:bg-white border-slate-300 h-8 w-8 p-0"
                data-testid="button-theme-toggle"
              >
                {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              </Button>
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="h-8 px-3 border-red-200 hover:bg-red-50 text-red-600"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthForm(true)}
                  className="h-8 px-3 border-blue-200 hover:bg-blue-50 text-blue-600"
                  data-testid="button-login"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1">
            {tabButtons.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 
                    ${isActive 
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-100' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }
                  `}
                  data-testid={`tab-${tab.key}`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                  {tab.status && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  )}
                  {activeTab === tab.key && tab.key === 'strategies' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStrategyAdmin(true);
                      }}
                      className="ml-1 h-6 px-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700"
                      data-testid="button-strategy-admin"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Strategy
                    </Button>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 py-3">
        {showStrategyAdmin ? (
          <StrategyAdmin onBack={() => setShowStrategyAdmin(false)} />
        ) : (
          <div className="min-h-[400px]">
            {renderTabContent()}
          </div>
        )}
      </main>

      {/* Auth Form Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Account Access</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthForm(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Sign in to save your data and custom strategies permanently.
              </p>
              <AuthForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}