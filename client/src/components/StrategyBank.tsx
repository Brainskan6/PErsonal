
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Search, Edit, Check, X, Save, Pen, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Strategy } from "@shared/schema";

interface StrategyBankProps {
  strategies: Strategy[];
  customStrategies?: Strategy[];
  selectedStrategies: string[];
  onStrategyToggle: (strategyId: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onStrategyConfigChange?: (strategyId: string, config: Partial<Strategy>) => void;
  selectionMode?: 'multiple' | 'single';
}

interface CustomStrategy {
  id: string;
  title: string;
  content: string;
  section?: string;
  subsection?: string;
  isSelected: boolean;
}

const sectionOptions = [
  "recommendations",
  "buildNetWorth",
  "implementingTaxStrategies",
  "protectingWhatMatters",
  "leavingALegacy"
];

const getSectionDisplayName = (section: string) => {
  const displayNames: Record<string, string> = {
    recommendations: "Recommendations",
    buildNetWorth: "Building Net Worth",
    implementingTaxStrategies: "Implementing Tax-Efficient Strategies",
    protectingWhatMatters: "Protecting What Matters",
    leavingALegacy: "Leaving a Legacy"
  };
  return displayNames[section] || section;
};

const getSectionIcon = (section: string) => {
  const icons: Record<string, string> = {
    recommendations: "💡",
    buildNetWorth: "💰",
    implementingTaxStrategies: "📊",
    protectingWhatMatters: "🛡️",
    leavingALegacy: "🎯"
  };
  return icons[section] || "📋";
};

const getSectionColor = (section: string) => {
  const colors: Record<string, string> = {
    recommendations: "bg-yellow-50 border-yellow-200 text-yellow-800",
    buildNetWorth: "bg-green-50 border-green-200 text-green-800",
    implementingTaxStrategies: "bg-blue-50 border-blue-200 text-blue-800",
    protectingWhatMatters: "bg-purple-50 border-purple-200 text-purple-800",
    leavingALegacy: "bg-indigo-50 border-indigo-200 text-indigo-800"
  };
  return colors[section] || "bg-gray-50 border-gray-200 text-gray-800";
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
  const [newStrategySubsection, setNewStrategySubsection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    content: string;
    section: string;
    subsection?: string;
  }>({ title: '', content: '', section: '', subsection: '' });
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom strategies from backend
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

  // Add/Edit strategy mutation
  const addCustomStrategyMutation = useMutation({
    mutationFn: async (strategyData: { title: string; content: string; section: string; id?: string; isBuiltIn?: boolean }) => {
      if (strategyData.id && strategyData.isBuiltIn) {
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
      if (variables.isBuiltIn) {
        queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/custom-strategies'] });
      }

      setNewStrategyTitle("");
      setNewStrategyContent("");
      setNewStrategySection("");
      setShowAddForm(false);
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

  // Combine custom strategies avoiding duplicates
  const customStrategies = [
    ...fetchedCustomStrategies,
    ...propCustomStrategies.filter(propStrategy => 
      !fetchedCustomStrategies.some(fetchedStrategy => fetchedStrategy.id === propStrategy.id)
    )
  ];

  // Organize strategies by section and subsection
  const organizedStrategies = useMemo(() => {
    const allStrategies = [...strategies, ...customStrategies];
    
    // Filter by search term
    const filteredStrategies = allStrategies.filter(strategy => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return strategy.title.toLowerCase().includes(searchLower) ||
             (strategy.content && strategy.content.toLowerCase().includes(searchLower)) ||
             (strategy.description && strategy.description.toLowerCase().includes(searchLower)) ||
             (strategy.subsection && strategy.subsection.toLowerCase().includes(searchLower)) ||
             (strategy.category && strategy.category.toLowerCase().includes(searchLower));
    });

    // Group by section
    const sections: Record<string, {
      strategies: (Strategy | CustomStrategy)[];
      subsections: Record<string, (Strategy | CustomStrategy)[]>;
    }> = {};

    filteredStrategies.forEach(strategy => {
      const section = strategy.section || 'uncategorized';
      
      if (!sections[section]) {
        sections[section] = { strategies: [], subsections: {} };
      }

      // Use subsection or category as the grouping key
      const subsectionKey = strategy.subsection || strategy.category;
      
      if (subsectionKey) {
        if (!sections[section].subsections[subsectionKey]) {
          sections[section].subsections[subsectionKey] = [];
        }
        sections[section].subsections[subsectionKey].push(strategy);
      } else {
        sections[section].strategies.push(strategy);
      }
    });

    // Sort strategies within each section and subsection
    Object.keys(sections).forEach(sectionKey => {
      // Sort strategies within section
      sections[sectionKey].strategies.sort((a, b) => a.title.localeCompare(b.title));
      
      // Sort strategies within each subsection
      Object.keys(sections[sectionKey].subsections).forEach(subsectionKey => {
        sections[sectionKey].subsections[subsectionKey].sort((a, b) => a.title.localeCompare(b.title));
      });
    });

    return sections;
  }, [strategies, customStrategies, searchTerm]);

  // Auto-expand sections that have search matches, but only if no sections are manually expanded
  useEffect(() => {
    if (searchTerm) {
      const sectionsWithMatches = Object.keys(organizedStrategies).filter(section => {
        const sectionData = organizedStrategies[section];
        return sectionData.strategies.length > 0 || Object.keys(sectionData.subsections).length > 0;
      });
      // Only auto-expand if no sections are currently expanded
      if (expandedSections.length === 0) {
        setExpandedSections(sectionsWithMatches);
      }
    }
  }, [searchTerm, organizedStrategies]);

  const toggleAllSections = () => {
    const allSections = Object.keys(organizedStrategies);
    if (expandedSections.length === allSections.length) {
      // Collapse all
      setExpandedSections([]);
    } else {
      // Expand all
      setExpandedSections(allSections);
    }
  };

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
      section: newStrategySection.trim(),
      subsection: newStrategySubsection.trim() || undefined
    });
  };

  const handleStrategyClick = (strategyId: string) => {
    if (selectionMode === 'single') {
      onSelectionChange([strategyId]);
    } else {
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
      content: strategy.content || "",
      section: strategy.section || "",
      subsection: strategy.subsection || strategy.category || ""
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
      addCustomStrategyMutation.mutate({
        id: strategyId,
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        section: editFormData.section.trim(),
        subsection: editFormData.subsection?.trim() || undefined,
        isBuiltIn: false
      });
    } else if (isBuiltInStrategy) {
      addCustomStrategyMutation.mutate({
        id: strategyId,
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        section: editFormData.section.trim(),
        subsection: editFormData.subsection?.trim() || undefined,
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
        <div
          className={`transition-all duration-200 ease-out group relative border rounded-lg p-3 ${
            isSelected
              ? 'bg-blue-50 border-blue-200 shadow-sm'
              : 'hover:bg-gray-50 hover:shadow-sm border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Selection Control */}
            <div className="flex-shrink-0 mt-0.5">
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
              className="flex-1 space-y-2 cursor-pointer"
              onClick={() => handleStrategyClick(strategy.id)}
            >
              <div className="flex items-center gap-2">
                <h4 className={`font-medium text-sm transition-colors ${
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {strategy.title}
                </h4>
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </div>
              
              {(strategy.subsection || strategy.category) && (
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-300">
                  {strategy.subsection || strategy.category}
                </Badge>
              )}
              
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {strategy.content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleEditClick(strategy, isBuiltIn, e)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                disabled={addCustomStrategyMutation.isPending}
              >
                <Pen className="h-3 w-3" />
              </Button>

              {!isBuiltIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => removeCustomStrategy(strategy.id, e)}
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  disabled={removeCustomStrategyMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Inline editing form */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          isEditing ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          <div className="border border-blue-200 bg-blue-50/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-sm text-blue-900">Edit Strategy</h5>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveEdit(strategy.id)}
                  className="text-blue-700 hover:bg-blue-100 h-7 px-2"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 h-7 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-900">Title</Label>
              <Input
                placeholder="Strategy title"
                value={editFormData.title || ''}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label className="text-xs font-medium text-blue-900">Subsection (Optional)</Label>
                <Input
                  placeholder="e.g., RRSP, TFSA, Insurance..."
                  value={editFormData.subsection || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, subsection: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-blue-900">Content</Label>
              <Textarea
                placeholder="Edit strategy content"
                value={editFormData.content || ''}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
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

  const totalStrategies = Object.values(organizedStrategies).reduce((acc, section) => {
    return acc + section.strategies.length + Object.values(section.subsections).reduce((subAcc, subStrategies) => subAcc + subStrategies.length, 0);
  }, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Strategy Bank</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-700 border-blue-300">
              {selectedStrategies.length} selected
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {totalStrategies} total
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search strategies across all sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 px-4 text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={addCustomStrategyMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Strategy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllSections}
              className="h-9 px-4"
              disabled={Object.keys(organizedStrategies).length === 0}
            >
              {expandedSections.length === Object.keys(organizedStrategies).length ? 'Collapse All' : 'Expand All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllStrategies}
              disabled={selectedStrategies.length === 0}
              className="h-9 px-4"
            >
              Clear All ({selectedStrategies.length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {/* Add Strategy Form */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${
              showAddForm ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <Card className="border-green-200 bg-green-50/50">
                <div className="p-4 space-y-4">
                  <h4 className="font-medium text-green-900">Add New Custom Strategy</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="strategy-title" className="text-xs font-medium text-gray-700">Strategy Title</Label>
                      <Input
                        id="strategy-title"
                        placeholder="Enter strategy title..."
                        value={newStrategyTitle}
                        onChange={(e) => setNewStrategyTitle(e.target.value)}
                        className="mt-1 h-9 text-sm"
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
                        <SelectTrigger className="mt-1 h-9 text-sm">
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

                    <div>
                      <Label htmlFor="strategy-subsection" className="text-xs font-medium text-gray-700">Subsection (Optional)</Label>
                      <Input
                        id="strategy-subsection"
                        placeholder="e.g., RRSP, TFSA, Insurance..."
                        value={newStrategySubsection}
                        onChange={(e) => setNewStrategySubsection(e.target.value)}
                        className="mt-1 h-9 text-sm"
                        disabled={addCustomStrategyMutation.isPending}
                      />
                    </div>
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
                      onClick={() => setShowAddForm(false)}
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

            {/* Section-based Accordion */}
            {Object.keys(organizedStrategies).length > 0 ? (
              <Accordion
                type="multiple"
                value={expandedSections}
                onValueChange={setExpandedSections}
                className="space-y-3"
              >
                {Object.entries(organizedStrategies)
                  .sort(([a], [b]) => {
                    const order = ['recommendations', 'buildNetWorth', 'implementingTaxStrategies', 'protectingWhatMatters', 'leavingALegacy'];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map(([sectionKey, sectionData]) => {
                    const totalInSection = sectionData.strategies.length + 
                      Object.values(sectionData.subsections).reduce((acc, subStrategies) => acc + subStrategies.length, 0);
                    const selectedInSection = [...sectionData.strategies, ...Object.values(sectionData.subsections).flat()]
                      .filter(strategy => selectedStrategies.includes(strategy.id)).length;

                    return (
                      <AccordionItem key={sectionKey} value={sectionKey} className="border rounded-lg">
                        <AccordionTrigger className={`px-4 py-3 hover:no-underline transition-all duration-200 ${
                          expandedSections.includes(sectionKey) ? 'rounded-t-lg' : 'rounded-lg'
                        } ${getSectionColor(sectionKey)} hover:shadow-sm`}>
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg transition-transform duration-200">
                                {getSectionIcon(sectionKey)}
                              </span>
                              <div className="text-left">
                                <h3 className="font-semibold text-base">
                                  {getSectionDisplayName(sectionKey)}
                                </h3>
                                <p className="text-xs opacity-75 font-normal">
                                  {totalInSection} strateg{totalInSection === 1 ? 'y' : 'ies'}
                                  {selectedInSection > 0 && ` • ${selectedInSection} selected`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedInSection > 0 && (
                                <Badge variant="secondary" className="bg-white/80 text-xs">
                                  {selectedInSection}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500 ml-2">
                                {expandedSections.includes(sectionKey) ? 'Click to collapse' : 'Click to expand'}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 bg-white/50 rounded-b-lg border-t border-gray-100">
                          <div className="space-y-4">
                            {/* Direct section strategies */}
                            {sectionData.strategies.length > 0 && (
                              <div className="space-y-2">
                                {sectionData.strategies.map((strategy) => {
                                  const isBuiltIn = strategies.some(s => s.id === strategy.id);
                                  return (
                                    <StrategyCard
                                      key={strategy.id}
                                      strategy={strategy}
                                      isBuiltIn={isBuiltIn}
                                    />
                                  );
                                })}
                              </div>
                            )}

                            {/* Subsections */}
                            {Object.entries(sectionData.subsections)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([subsectionKey, subsectionStrategies]) => (
                              <div key={subsectionKey} className="space-y-2">
                                <div className="flex items-center gap-2 pt-2">
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                  <h4 className="font-medium text-sm text-gray-700 capitalize">
                                    {subsectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </h4>
                                  <div className="h-px bg-gray-200 flex-1" />
                                  <Badge variant="outline" className="text-xs">
                                    {subsectionStrategies.length}
                                  </Badge>
                                </div>
                                <div className="ml-6 space-y-2">
                                  {subsectionStrategies.map((strategy) => {
                                    const isBuiltIn = strategies.some(s => s.id === strategy.id);
                                    return (
                                      <StrategyCard
                                        key={strategy.id}
                                        strategy={strategy}
                                        isBuiltIn={isBuiltIn}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">
                  {searchTerm ? 'No strategies found matching your search.' : 'No strategies available.'}
                </p>
                {searchTerm && (
                  <p className="text-sm text-gray-400 mb-4">
                    Try adjusting your search terms or clear the search to see all strategies.
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (searchTerm) {
                      setSearchTerm('');
                    } else {
                      setShowAddForm(true);
                    }
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  disabled={addCustomStrategyMutation.isPending}
                >
                  {searchTerm ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Clear Search
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Strategy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
