import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search, Edit, Check, X, Save, Pen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Strategy } from "@shared/schema";

// Placeholder for the custom hook
// In a real scenario, this hook would be defined in its own file (e.g., useFilteredStrategies.ts)
// For demonstration, it's included here.
const useFilteredStrategies = ({
  strategies,
  customStrategies,
  searchQuery,
  selectedSection
}: {
  strategies: Strategy[];
  customStrategies: CustomStrategy[];
  searchQuery: string;
  selectedSection: string;
}) => {
  const filteredBuiltIn = useMemo(() => {
    return strategies?.filter(strategy => {
      const matchesSearch = !searchQuery ||
        strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (strategy.description && strategy.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (strategy.content && strategy.content.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSection = selectedSection === 'all' || strategy.section === selectedSection;

      return matchesSearch && matchesSection;
    }) || [];
  }, [strategies, searchQuery, selectedSection]);

  const filteredCustom = useMemo(() => {
    return customStrategies?.filter(strategy => {
      const matchesSearch = !searchQuery ||
        strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (strategy.content && strategy.content.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSection = selectedSection === 'all' || strategy.section === selectedSection;

      return matchesSearch && matchesSection;
    }) || [];
  }, [customStrategies, searchQuery, selectedSection]);

  return { filteredBuiltInStrategies: filteredBuiltIn, filteredCustomStrategies: filteredCustom };
};


interface StrategyBankProps {
  strategies: Strategy[];
  customStrategies?: Strategy[];
  selectedStrategies: string[];
  onStrategyToggle: (strategyId: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onStrategyConfigChange?: (strategyId: string, config: Partial<Strategy>) => void;
  selectionMode?: 'multiple' | 'single'; // New prop for selection type
}

interface CustomStrategy {
  id: string;
  title: string;
  content: string;
  section?: string;
  isSelected: boolean;
}

const sectionOptions = [
  "buildNetWorth",
  "implementingTaxStrategies",
  "protectingWhatMatters",
  "leavingALegacy"
];

const getSectionDisplayName = (section: string) => {
  const displayNames: Record<string, string> = {
    buildNetWorth: "Build Net Worth",
    implementingTaxStrategies: "Implementing Tax Efficient Strategies",
    protectingWhatMatters: "Protecting What Matters",
    leavingALegacy: "Leaving a Legacy"
  };
  return displayNames[section] || section;
};

export default function StrategyBank({
  strategies = [],
  customStrategies: propCustomStrategies = [],
  selectedStrategies,
  onStrategyToggle,
  onSelectionChange,
  onStrategyConfigChange,
  selectionMode = 'multiple'
}: StrategyBankProps) {
  const [newStrategyTitle, setNewStrategyTitle] = useState("");
  const [newStrategyContent, setNewStrategyContent] = useState("");
  const [newStrategySection, setNewStrategySection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    content: string;
    section: string;
  }>({ title: '', content: '', section: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom strategies from backend (fallback to prop if query fails)
  const { data: fetchedCustomStrategies = [], isLoading, error } = useQuery<CustomStrategy[]>({
    queryKey: ['/api/custom-strategies'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/custom-strategies', 'GET');
        if (!response.ok) {
          console.warn('Failed to fetch custom strategies:', response.status);
          return [];
        }
        const data = await response.json();
        const result = Array.isArray(data) ? data : [];
        console.log('Fetched custom strategies:', result);
        return result;
      } catch (error) {
        console.error('Error fetching custom strategies:', error);
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Add/Edit strategy mutation (handles both built-in and custom)
  const addCustomStrategyMutation = useMutation({
    mutationFn: async (strategyData: { title: string; content: string; section: string; id?: string; isBuiltIn?: boolean }) => {
      if (strategyData.id && strategyData.isBuiltIn) {
        // Update built-in strategy
        const response = await apiRequest(`/api/strategies/${strategyData.id}`, 'PUT', {
          title: strategyData.title,
          content: strategyData.content,
          section: strategyData.section
        });
        if (!response.ok) {
          throw new Error(`Failed to update built-in strategy ${strategyData.id}`);
        }
        return await response.json();
      } else if (strategyData.id && customStrategies.some(s => s.id === strategyData.id)) {
        // Update existing custom strategy
        const response = await apiRequest(`/api/custom-strategies/${strategyData.id}`, 'PUT', {
          title: strategyData.title,
          content: strategyData.content,
          section: strategyData.section
        });
        if (!response.ok) {
          throw new Error(`Failed to update custom strategy ${strategyData.id}`);
        }
        return await response.json();
      } else {
        // Create new custom strategy
        const response = await apiRequest('/api/custom-strategies', 'POST', {
          title: strategyData.title,
          content: strategyData.content,
          section: strategyData.section
        });
        if (!response.ok) {
          throw new Error('Failed to create custom strategy');
        }
        return await response.json();
      }
    },
    onSuccess: (strategy, variables) => {
      // Invalidate appropriate queries based on strategy type
      if (variables.isBuiltIn) {
        queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/custom-strategies'] });
      }

      // Reset form states
      setNewStrategyTitle("");
      setNewStrategyContent("");
      setNewStrategySection("");
      setShowAddForm(false);

      // Always reset edit state when mutation succeeds
      setEditingStrategyId(null);
      setEditFormData({ title: '', content: '', section: '' });

      const isUpdate = variables.id && (customStrategies.some(s => s.id === variables.id) || variables.isBuiltIn);
      toast({
        title: isUpdate ? "Strategy Updated" : "Strategy Created",
        description: isUpdate ? "The strategy has been updated successfully." : "Your custom strategy has been created successfully."
      });
    },
    onError: (error) => {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: `Failed to save strategy. Please try again.`,
        variant: "destructive"
      });
    },
  });

  // Remove custom strategy mutation
  const removeCustomStrategyMutation = useMutation({
    mutationFn: async (strategyId: string) => {
      const response = await apiRequest(`/api/custom-strategies/${strategyId}`, 'DELETE');
      if (!response.ok) {
        throw new Error('Failed to delete custom strategy');
      }
      return await response.json();
    },
    onSuccess: (_, strategyId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-strategies'] });

      // Remove from selected if it was selected
      if (selectedStrategies.includes(strategyId)) {
        const updatedSelected = selectedStrategies.filter(id => id !== strategyId);
        onSelectionChange(updatedSelected);
      }

      toast({
        title: "Strategy Removed",
        description: "The custom strategy has been removed."
      });
    },
    onError: (error) => {
      console.error('Error removing custom strategy:', error);
      toast({
        title: "Error",
        description: "Failed to remove custom strategy. Please try again.",
        variant: "destructive"
      });
    },
  });

  const addCustomStrategy = () => {
    if (!newStrategyTitle.trim() || !newStrategyContent.trim() || !newStrategySection.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide title, content, and section for the strategy.",
        variant: "destructive",
      });
      return;
    }

    addCustomStrategyMutation.mutate({
      title: newStrategyTitle.trim(),
      content: newStrategyContent.trim(),
      section: newStrategySection.trim()
    });
  };

  const handleStrategyClick = (strategyId: string, isBuiltIn: boolean = false) => {
    if (selectionMode === 'single') {
      // For single selection, clear others and select this one
      onSelectionChange([strategyId]);
    } else {
      // For multiple selection, toggle
      onStrategyToggle(strategyId);
    }
  };

  const handleCheckboxChange = (strategyId: string, checked: boolean) => {
    if (selectionMode === 'single') {
      onSelectionChange(checked ? [strategyId] : []);
    } else {
      if (checked) {
        onSelectionChange([...selectedStrategies, strategyId]);
      } else {
        onSelectionChange(selectedStrategies.filter(id => id !== strategyId));
      }
    }
  };

  const handleEditClick = (strategy: Strategy | CustomStrategy, isBuiltIn: boolean = false, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStrategyId(strategy.id);
    setEditFormData({
      title: strategy.title,
      content: strategy.content || "", // Use empty string if content is undefined
      section: strategy.section || ""
    });
  };

  const saveEdit = (strategyId: string) => {
    if (!editFormData.title.trim() || !editFormData.content.trim() || !editFormData.section) {
      toast({
        title: "Missing Information",
        description: "Please provide title, content, and section for the strategy.",
        variant: "destructive",
      });
      return;
    }

    const isCustomStrategy = customStrategies.some(s => s.id === strategyId);
    const isBuiltInStrategy = strategies.some(s => s.id === strategyId);

    if (isCustomStrategy) {
      // Update existing custom strategy
      addCustomStrategyMutation.mutate({
        id: strategyId,
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        section: editFormData.section.trim(),
        isBuiltIn: false
      });
    } else if (isBuiltInStrategy) {
      // Update built-in strategy directly
      addCustomStrategyMutation.mutate({
        id: strategyId,
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        section: editFormData.section.trim(),
        isBuiltIn: true
      });
    }
  };

  const cancelEdit = () => {
    setEditingStrategyId(null);
    setEditFormData({ title: '', content: '', section: '' });
  };

  const removeCustomStrategy = (strategyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeCustomStrategyMutation.mutate(strategyId);
  };

  // Combine fetched custom strategies with prop custom strategies, avoiding duplicates
  const customStrategies = [
    ...fetchedCustomStrategies,
    ...propCustomStrategies.filter(propStrategy => 
      !fetchedCustomStrategies.some(fetchedStrategy => fetchedStrategy.id === propStrategy.id)
    )
  ];

  // Use custom hook for strategy filtering
  const { filteredBuiltInStrategies, filteredCustomStrategies } = useFilteredStrategies({
    strategies: strategies || [],
    customStrategies: customStrategies || [],
    searchQuery: searchTerm,
    selectedSection: 'all' // Assuming 'all' is the default or a placeholder for now. Needs to be managed if a section filter is implemented.
  });

  const clearAllStrategies = () => {
    onSelectionChange([]);
    toast({
      title: "Strategies Cleared",
      description: "All strategies have been deselected."
    });
  };

  const StrategyCard = ({ strategy, isBuiltIn = false }: { strategy: Strategy | CustomStrategy, isBuiltIn?: boolean }) => {
    const isSelected = selectedStrategies.includes(strategy.id);
    const isEditing = editingStrategyId === strategy.id;

    return (
      <div className="space-y-0">
        <Card
          className={`transition-all duration-300 ease-out group relative ${
            isSelected
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md'
              : 'hover:bg-gray-50 hover:shadow-sm'
          }`}
        >
          <div className="p-5">
            <div className="flex items-start gap-3">
              {/* Selection Control */}
              <div className="flex-shrink-0 mt-1">
                {selectionMode === 'single' ? (
                  <RadioGroupItem
                    value={strategy.id}
                    checked={isSelected}
                    onChange={() => handleCheckboxChange(strategy.id, !isSelected)}
                    className="cursor-pointer"
                  />
                ) : (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleCheckboxChange(strategy.id, !!checked)}
                    className="cursor-pointer"
                  />
                )}
              </div>

              {/* Strategy Content */}
              <div 
                className="flex-1 space-y-3 cursor-pointer"
                onClick={() => handleStrategyClick(strategy.id, isBuiltIn)}
              >
                {/* Display Section Tag */}
                {strategy.section && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-300">
                    {getSectionDisplayName(strategy.section)}
                  </Badge>
                )}
                <div className="flex items-center gap-3">
                  <h4 className={`font-semibold text-sm transition-colors ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {strategy.title}
                  </h4>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-medium">Selected</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {strategy.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-1">
                {/* Edit Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleEditClick(strategy, isBuiltIn, e)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  disabled={addCustomStrategyMutation.isPending}
                >
                  <Pen className="h-4 w-4" />
                </Button>

                {/* Delete Button (Custom Strategies Only) */}
                {!isBuiltIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeCustomStrategy(strategy.id, e)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    disabled={removeCustomStrategyMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        

        {/* Inline editing form that expands seamlessly */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          isEditing ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <Card className="mt-2 border-blue-200 bg-blue-50/50">
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-sm text-blue-900">Edit Strategy</h5>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => saveEdit(strategy.id)}
                    className="text-blue-700 hover:bg-blue-100"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Title editing */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-blue-900">Title</Label>
                <Input
                  placeholder="Strategy title"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Section selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-blue-900">Report Section</Label>
                <Select
                  value={editFormData.section || ""}
                  onValueChange={(value) => setEditFormData({ ...editFormData, section: value })}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue placeholder="Select report section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map(section => (
                      <SelectItem key={section} value={section}>
                        {getSectionDisplayName(section)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content editing */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-blue-900">Content</Label>
                <Textarea
                  placeholder="Edit strategy content"
                  value={editFormData.content || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  className="min-h-[100px] text-sm"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-destructive">Failed to load custom strategies. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Strategy Bank</CardTitle>
          <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-700 border-blue-300">
            {selectedStrategies.length} selected
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 px-4 text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={addCustomStrategyMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Strategy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllStrategies}
              disabled={selectedStrategies.length === 0}
              className="h-9 px-4"
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">

            {/* Add Strategy Form */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${
              showAddForm ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <Card className="border-green-200 bg-green-50/50">
                <div className="p-3 space-y-3">
                  <h4 className="font-medium text-green-900">Add New Strategy</h4>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="strategy-title" className="text-xs font-medium text-gray-700">Strategy Title</Label>
                      <Input
                        id="strategy-title"
                        placeholder="Enter strategy title..."
                        value={newStrategyTitle}
                        onChange={(e) => setNewStrategyTitle(e.target.value)}
                        className="mt-1 h-8 text-sm"
                        disabled={addCustomStrategyMutation.isPending}
                      />
                    </div>

                    <div>
                      <Label htmlFor="strategy-content" className="text-xs font-medium text-gray-700">Strategy Content</Label>
                      <Textarea
                        id="strategy-content"
                        placeholder="Enter strategy content..."
                        value={newStrategyContent}
                        onChange={(e) => setNewStrategyContent(e.target.value)}
                        rows={3}
                        className="mt-1 text-sm resize-none"
                        disabled={addCustomStrategyMutation.isPending}
                      />
                    </div>

                    <div>
                      <Label htmlFor="strategy-section" className="text-xs font-medium text-gray-700">Report Section</Label>
                      <Select
                        value={newStrategySection}
                        onValueChange={setNewStrategySection}
                        disabled={addCustomStrategyMutation.isPending}
                      >
                        <SelectTrigger className="mt-1 h-8 text-sm">
                          <SelectValue placeholder="Select report section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionOptions.map(section => (
                            <SelectItem key={section} value={section}>
                              {getSectionDisplayName(section)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={addCustomStrategy}
                      size="sm"
                      className="h-8 px-4 bg-green-600 hover:bg-green-700"
                      disabled={addCustomStrategyMutation.isPending}
                    >
                      {addCustomStrategyMutation.isPending ? "Saving..." : "Save Strategy"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      size="sm"
                      className="h-8 px-4"
                      disabled={addCustomStrategyMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Built-in Strategies */}
            {filteredBuiltInStrategies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gradient-to-r from-green-200 to-transparent flex-1" />
                  <h3 className="font-medium text-sm text-green-700 uppercase tracking-wide px-3 py-1 bg-green-100 rounded-full border border-green-200">
                    Built-in Strategies
                  </h3>
                  <div className="h-px bg-gradient-to-l from-green-200 to-transparent flex-1" />
                </div>

                <div className="space-y-2 group">
                  {filteredBuiltInStrategies.map((strategy) => (
                    <StrategyCard
                      key={strategy.id}
                      strategy={strategy}
                      isBuiltIn={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Strategies */}
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading custom strategies...</p>
              </div>
            ) : filteredCustomStrategies.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gradient-to-r from-blue-200 to-transparent flex-1" />
                  <h3 className="font-medium text-sm text-blue-700 uppercase tracking-wide px-3 py-1 bg-blue-100 rounded-full border border-blue-200">
                    Custom Strategies
                  </h3>
                  <div className="h-px bg-gradient-to-l from-blue-200 to-transparent flex-1" />
                </div>

                <div className="space-y-2 group">
                  {filteredCustomStrategies.map((strategy) => (
                    <StrategyCard
                      key={strategy.id}
                      strategy={strategy}
                      isBuiltIn={false}
                    />
                  ))}
                </div>
              </div>
            ) : filteredBuiltInStrategies.length === 0 && filteredCustomStrategies.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No strategies found.</p>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  disabled={addCustomStrategyMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Strategy
                </Button>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}