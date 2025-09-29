import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Strategy, StrategyInputField } from "@shared/schema";

interface StrategyAdminProps {
  onBack: () => void;
}

const inputFieldTypes = ["text", "number", "select", "textarea", "date", "toggle"] as const;

const categoryOptions = [
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

const sectionOptions = [
  "recommendations",
  "buildingNetWorth", 
  "planningForRetirement",
  "payingDownDebt",
  "planningForEducation",
  "planningForBusinessOwners",
  "planningForLargePurchase",
  "implementingTaxStrategies",
  "optimizeCashflow",
  "retirementIncomePlanning",
  "planningForUncertainty",
  "insurance",
  "donatingToCharity",
  "passingOnWealth"
];

const getSectionDisplayName = (section: string) => {
  const displayNames: Record<string, string> = {
    recommendations: "Recommendations",
    buildingNetWorth: "Building Net Worth",
    planningForRetirement: "Planning for Retirement", 
    payingDownDebt: "Paying Down Debt",
    planningForEducation: "Planning for Education",
    planningForBusinessOwners: "Planning for Business Owners",
    planningForLargePurchase: "Planning for Large Purchase or Event",
    implementingTaxStrategies: "Implementing Tax-Efficient Strategies",
    optimizeCashflow: "Optimize Cash Flow",
    retirementIncomePlanning: "Retirement Income Planning",
    planningForUncertainty: "Planning for Uncertainty",
    insurance: "Insurance",
    donatingToCharity: "Donating to Charity",
    passingOnWealth: "Passing on Your Wealth"
  };
  return displayNames[section] || section;
};

export default function StrategyAdmin({ onBack }: StrategyAdminProps) {
  const [strategy, setStrategy] = useState<Partial<Strategy>>({
    title: "",
    description: "",
    category: "",
    section: "",
    content: "",
    inputFields: [],
    isCustom: true
  });

  const [newInputField, setNewInputField] = useState<Partial<StrategyInputField>>({
    id: "",
    label: "",
    type: "text",
    placeholder: "",
    required: false,
    options: [],
    defaultValue: "",
    conditionalText: {
      whenTrue: "",
      whenFalse: ""
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStrategyMutation = useMutation({
    mutationFn: (strategyData: Omit<Strategy, 'id'>) =>
      apiRequest('/api/strategies', 'POST', strategyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({
        title: "Strategy created",
        description: "New strategy has been added successfully.",
      });
      // Reset form
      setStrategy({
        title: "",
        description: "",
        category: "",
        section: "",
        content: "",
        inputFields: [],
        isCustom: true
      });
      setNewInputField({
        id: "",
        label: "",
        type: "text",
        placeholder: "",
        required: false,
        options: [],
        defaultValue: "",
        conditionalText: {
          whenTrue: "",
          whenFalse: ""
        }
      });
    },
    onError: () => {
      toast({
        title: "Error creating strategy",
        description: "Failed to create strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddInputField = () => {
    if (!newInputField.id || !newInputField.label) {
      toast({
        title: "Invalid input field",
        description: "ID and label are required for input fields.",
        variant: "destructive",
      });
      return;
    }

    const field: StrategyInputField = {
      id: newInputField.id!,
      label: newInputField.label!,
      type: newInputField.type || "text",
      placeholder: newInputField.placeholder,
      required: newInputField.required || false,
      options: newInputField.type === "select" ? newInputField.options : undefined,
      defaultValue: newInputField.defaultValue,
      conditionalText: newInputField.type === "toggle" ? {
        whenTrue: newInputField.conditionalText?.whenTrue || "",
        whenFalse: newInputField.conditionalText?.whenFalse || ""
      } : undefined
    };

    setStrategy(prev => ({
      ...prev,
      inputFields: [...(prev.inputFields || []), field]
    }));

    // Reset new field form
    setNewInputField({
      id: "",
      label: "",
      type: "text",
      placeholder: "",
      required: false,
      options: [],
      defaultValue: "",
      conditionalText: {
        whenTrue: "",
        whenFalse: ""
      }
    });
  };

  const handleRemoveInputField = (fieldId: string) => {
    setStrategy(prev => ({
      ...prev,
      inputFields: prev.inputFields?.filter(field => field.id !== fieldId) || []
    }));
  };

  const handleSaveStrategy = () => {
    if (!strategy.title || !strategy.description || !strategy.category || !strategy.section || !strategy.content) {
      toast({
        title: "Missing required fields",
        description: "Title, description, category, section, and content are required.",
        variant: "destructive",
      });
      return;
    }

    const strategyData = {
      ...strategy,
      id: `custom-${Date.now()}-${strategy.title?.toLowerCase().replace(/\s+/g, '-')}`,
      inputFields: strategy.inputFields || []
    } as Omit<Strategy, 'id'>;

    addStrategyMutation.mutate(strategyData);
  };

  const handleOptionsChange = (value: string) => {
    const options = value.split(',').map(opt => opt.trim()).filter(Boolean);
    setNewInputField(prev => ({ ...prev, options }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          data-testid="button-back-to-strategies"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Strategies
        </Button>
        <h2 className="text-2xl font-bold">Create Custom Strategy</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Strategy Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-title">Title *</Label>
              <Input
                id="strategy-title"
                placeholder="e.g., Custom Investment Strategy"
                value={strategy.title || ""}
                onChange={(e) => setStrategy(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-strategy-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy-description">Description *</Label>
              <Textarea
                id="strategy-description"
                placeholder="Brief description of the strategy..."
                value={strategy.description || ""}
                onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
                data-testid="textarea-strategy-description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy-category">Category *</Label>
              <Select
                value={strategy.category || ""}
                onValueChange={(value) => setStrategy(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-strategy-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy-section">Report Section *</Label>
              <Select
                value={strategy.section || ""}
                onValueChange={(value) => setStrategy(prev => ({ ...prev, section: value }))}
              >
                <SelectTrigger data-testid="select-strategy-section">
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
              <Label htmlFor="strategy-content">Content Template *</Label>
              <Textarea
                id="strategy-content"
                placeholder="Strategy content with placeholders like {{amount}}, {{timeline}}, etc..."
                value={strategy.content || ""}
                onChange={(e) => setStrategy(prev => ({ ...prev, content: e.target.value }))}
                data-testid="textarea-strategy-content"
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Use double curly braces for placeholders: {"{"}{"{"} fieldId {"}"}{"}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Input Fields</Label>
              <div className="space-y-2">
                {strategy.inputFields?.map((field, index) => (
                  <div key={field.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <span className="font-medium">{field.label}</span>
                      <Badge variant="outline" className="ml-2">{field.type}</Badge>
                      {field.required && <Badge variant="secondary" className="ml-1">Required</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInputField(field.id)}
                      data-testid={`button-remove-field-${field.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {strategy.inputFields?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No input fields added yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Input Field */}
        <Card>
          <CardHeader>
            <CardTitle>Add Input Field</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-id">Field ID *</Label>
                <Input
                  id="field-id"
                  placeholder="e.g., targetAmount"
                  value={newInputField.id || ""}
                  onChange={(e) => setNewInputField(prev => ({ ...prev, id: e.target.value }))}
                  data-testid="input-field-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-label">Label *</Label>
                <Input
                  id="field-label"
                  placeholder="e.g., Target Amount"
                  value={newInputField.label || ""}
                  onChange={(e) => setNewInputField(prev => ({ ...prev, label: e.target.value }))}
                  data-testid="input-field-label"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type</Label>
              <Select
                value={newInputField.type || "text"}
                onValueChange={(value) => setNewInputField(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inputFieldTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                placeholder="e.g., Enter amount in dollars"
                value={newInputField.placeholder || ""}
                onChange={(e) => setNewInputField(prev => ({ ...prev, placeholder: e.target.value }))}
                data-testid="input-field-placeholder"
              />
            </div>

            {newInputField.type === "select" && (
              <div className="space-y-2">
                <Label htmlFor="field-options">Options (comma-separated)</Label>
                <Textarea
                  id="field-options"
                  placeholder="Option 1, Option 2, Option 3"
                  value={newInputField.options?.join(', ') || ""}
                  onChange={(e) => handleOptionsChange(e.target.value)}
                  data-testid="textarea-field-options"
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="field-default">Default Value</Label>
              <Input
                id="field-default"
                placeholder="Default value (optional)"
                value={newInputField.defaultValue || ""}
                onChange={(e) => setNewInputField(prev => ({ ...prev, defaultValue: e.target.value }))}
                data-testid="input-field-default"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-required"
                checked={newInputField.required || false}
                onChange={(e) => setNewInputField(prev => ({ ...prev, required: e.target.checked }))}
                data-testid="checkbox-field-required"
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>

            {newInputField.type === 'toggle' && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Conditional Text (appears in report based on toggle state)</h4>
                <div className="space-y-2">
                  <Label htmlFor="conditional-text-true">Text when toggled ON (optional)</Label>
                  <Textarea
                    id="conditional-text-true"
                    placeholder="Text to show in report when toggle is ON..."
                    className="min-h-[60px]"
                    value={newInputField.conditionalText?.whenTrue || ""}
                    onChange={(e) => setNewInputField(prev => ({ ...prev, conditionalText: { ...prev.conditionalText, whenTrue: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditional-text-false">Text when toggled OFF (optional)</Label>
                  <Textarea
                    id="conditional-text-false"
                    placeholder="Text to show in report when toggle is OFF..."
                    className="min-h-[60px]"
                    value={newInputField.conditionalText?.whenFalse || ""}
                    onChange={(e) => setNewInputField(prev => ({ ...prev, conditionalText: { ...prev.conditionalText, whenFalse: e.target.value } }))}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleAddInputField}
              className="w-full"
              data-testid="button-add-input-field"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Input Field
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          data-testid="button-cancel-strategy"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveStrategy}
          disabled={addStrategyMutation.isPending}
          data-testid="button-save-strategy"
        >
          <Save className="h-4 w-4 mr-2" />
          {addStrategyMutation.isPending ? "Creating..." : "Create Strategy"}
        </Button>
      </div>
    </div>
  );
}