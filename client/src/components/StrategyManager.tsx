
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, Search, Filter, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Strategy } from "@shared/schema";

interface StrategyManagerProps {
  onEditStrategy?: (strategy: Strategy) => void;
}

const categoryOptions = [
  "All Categories",
  "Savings",
  "Debt Management", 
  "Retirement",
  "Investing",
  "Tax Planning",
  "Protection",
  "Real Estate",
  "Education",
  "Estate Planning",
  "Insurance"
];

export default function StrategyManager({ onEditStrategy }: StrategyManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all strategies
  const { data: strategies = [], isLoading } = useQuery<Strategy[]>({
    queryKey: ['/api/strategies'],
    queryFn: async () => {
      const response = await apiRequest('/api/strategies', 'GET');
      return await response.json();
    },
  });

  // Delete strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (strategyId: string) => {
      const response = await apiRequest(`/api/strategies/${strategyId}`, 'DELETE');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({
        title: "Strategy Deleted",
        description: "The strategy has been permanently removed from your bank.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export strategies
  const handleExport = async () => {
    try {
      const response = await apiRequest('/api/strategies/export', 'GET');
      const customStrategies = await response.json();
      
      const dataStr = JSON.stringify(customStrategies, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `strategies-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Export Complete",
        description: `${customStrategies.length} custom strategies exported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export strategies. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Import strategies
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const strategies = JSON.parse(e.target?.result as string);
        
        const response = await apiRequest('/api/strategies/import', 'POST', { strategies });
        const importedStrategies = await response.json();
        
        queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
        
        toast({
          title: "Import Complete",
          description: `${importedStrategies.length} strategies imported successfully.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import strategies. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Filter strategies
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || strategy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group strategies by category
  const strategiesByCategory = filteredStrategies.reduce((acc, strategy) => {
    const category = strategy.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(strategy);
    return acc;
  }, {} as Record<string, Strategy[]>);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Strategy Bank Manager</CardTitle>
          <Badge variant="secondary">
            {strategies.length} total strategies
          </Badge>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading strategies...</p>
            </div>
          ) : Object.keys(strategiesByCategory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(strategiesByCategory).map(([category, categoryStrategies]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    {category} ({categoryStrategies.length})
                  </h3>
                  <div className="grid gap-3 mb-4">
                    {categoryStrategies.map((strategy) => (
                      <Card key={strategy.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{strategy.title}</h4>
                              {strategy.isCustom && (
                                <Badge variant="outline" className="text-xs">Custom</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {strategy.description}
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {strategy.section?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Badge>
                              {strategy.inputFields && strategy.inputFields.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {strategy.inputFields.length} input{strategy.inputFields.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            {onEditStrategy && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditStrategy(strategy)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {strategy.isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteStrategyMutation.mutate(strategy.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No strategies found matching your criteria.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
