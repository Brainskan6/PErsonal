import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, User, Target, FileBarChart, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStorage, AuthenticationRequiredError } from '@/lib/storage';
import ClientDataForm from './ClientDataForm';
import StrategyBank from './StrategyBank';
import ReportPreview from './ReportPreview';

import { apiRequest } from "@/lib/queryClient";
import type { ClientData, Strategy, ClientStrategyConfig, User as UserType } from "@shared/schema";

export default function FinancialPlanningLayout() {
  const [activeTab, setActiveTab] = useState<'client' | 'strategies' | 'report' | 'admin'>('client');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedCustomStrategies, setSelectedCustomStrategies] = useState<string[]>([]);
  const [strategyConfigurations, setStrategyConfigurations] = useState<ClientStrategyConfig[]>([]);
  const [reportText, setReportText] = useState("");

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const storage = useStorage();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleAuthError = (error: AuthenticationRequiredError) => {
    toast({
      title: "Sign In Required",
      description: error.message,
      action: (
        <Button onClick={handleLogin} size="sm">
          Sign In
        </Button>
      ),
      duration: 6000,
    });
  };

  const getUserInitials = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.email) {
      return user.email;
    }
    return "User";
  };

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

  // Fetch custom strategies (no longer requires authentication)
  const { data: customStrategies = [], isLoading: customStrategiesLoading } = useQuery<Strategy[]>({
    queryKey: ['/api/custom-strategies'],
    queryFn: async () => {
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
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch client data (no longer requires authentication)
  const { data: fetchedClientData, isLoading: clientDataLoading, refetch: refetchClientData } = useQuery<ClientData | null>({
    queryKey: ['/api/client-data/current'],
    queryFn: async () => {
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
    retry: false, // Don't retry if no data exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize clientData state with fetched data
  useState(() => {
    if (fetchedClientData) {
      setClientData(fetchedClientData);
    }
  });

  // Save client data mutation (no longer requires authentication)
  const saveClientDataMutation = useMutation({
    mutationFn: async (data: ClientData) => {
      const response = await apiRequest('/api/client-data', 'POST', data);
      if (!response.ok) {
        throw new Error('Failed to save client data');
      }
      return await response.json();
    },
    onSuccess: () => {
      refetchClientData(); // Refetch to update the fetched data
    },
    onError: (error) => {
      console.error('Save client data error:', error);
    },
  });

  // Generate report mutation (works for everyone)
  const generateReportMutation = useMutation({
    mutationFn: async ({ clientData, strategyConfigurations, selectedCustomStrategyIds }: { 
      clientData: ClientData; 
      strategyConfigurations: ClientStrategyConfig[];
      selectedCustomStrategyIds?: string[];
    }) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData, strategyConfigurations, selectedCustomStrategyIds })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      setReportText(data.report);
    },
    onError: (error) => {
      console.error('Generate report error:', error);
    },
  });

  const selectedStrategyObjects = Array.isArray(strategies) ? strategies.filter((s: Strategy) => selectedStrategies.includes(s.id)) : [];
  const selectedCustomStrategyObjects = Array.isArray(customStrategies) ? customStrategies.filter((s: Strategy) => selectedCustomStrategies.includes(s.id)) : [];

  const handleClientDataSubmit = (data: ClientData) => {
    console.log('Client data submitted:', data);
    setClientData(data); // Update local state immediately
    saveClientDataMutation.mutate(data);
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
    console.log('Strategy configuration changed:', strategyId, config);
    // TODO: Implement strategy configuration persistence if needed
  };

  const generateReport = async () => {
    if (!clientData) {
      return;
    }

    setIsGeneratingReport(true);
    try {
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
        strategyConfigurations: enabledConfigs, 
        selectedCustomStrategyIds: selectedCustomStrategies
      });

    } catch (error) {
      console.error('Error in generateReport function:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const exportReport = () => {
    if (!reportText) {
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
              customStrategies={customStrategies} 
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
      description: 'Generate and view report'
    },

  ];

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

  return (
    <div className={`min-h-screen bg-background`}>
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
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} alt={getUserDisplayName(user)} style={{ objectFit: 'cover' }} />
                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserDisplayName(user)}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleLogin} data-testid="button-login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In with Replit
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {tabButtons.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                  }}
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

                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-3">
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}