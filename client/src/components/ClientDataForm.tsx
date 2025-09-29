import { useEffect, useCallback, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientDataSchema, type ClientData } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { User, DollarSign, Target, Calendar, Shield, FileText, Building2, Heart } from "lucide-react";

interface ClientDataFormProps {
  onSubmit: (data: ClientData) => void;
  initialData?: ClientData;
}

export default function ClientDataForm({ onSubmit, initialData }: ClientDataFormProps) {
  const form = useForm<ClientData>({
    resolver: zodResolver(clientDataSchema),
    defaultValues: initialData || {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      hasSecondClient: false,
      secondClientFirstName: "",
      secondClientLastName: "",
      secondClientDateOfBirth: "",
      secondClientAnnualIncome: 0,
      secondClientMonthlyExpenses: 0,
      secondClientHasDebts: false,
      secondClientDebtType: "mortgage",
      secondClientDebtInterestRate: 0,
      secondClientDebtTermRemaining: 0,
      secondClientDebtPayment: 0,
      secondClientDebtPaymentFrequency: "monthly",
      secondClientHasProperties: false,
      secondClientPropertyType: "principal-residence",
      secondClientPropertyMarketValue: 0,
      secondClientPropertyCostBasis: 0,
      secondClientDesiredRetirementAge: 65,
      secondClientRetirementSpendingGoal: 0,
      secondClientQppCurrentlyReceiving: false,
      secondClientQppCurrentAmount: 0,
      secondClientQppExpectedAmount: 0,
      secondClientOasCurrentlyReceiving: false,
      secondClientOasCurrentAmount: 0,
      secondClientOasExpectedAmount: 0,
      secondClientHasInsurance: false,
      secondClientInsuranceDeathBenefit: 0,
      secondClientInsuranceType: "term",
      secondClientInsuranceTermYearsRemaining: 0,
      secondClientInsuranceAnnualPremiums: 0,
      secondClientInsuranceWithEmployer: false,
      secondClientHasWill: false,
      secondClientWillLastUpdated: "",
      secondClientHasAssetsOFI: false,
      secondClientAssetsOFIDetails: "",
      secondClientTfsaMaximizedYearly: false,
      secondClientFinancialGoals: "",
      secondClientRiskTolerance: "balanced",
      secondClientAdditionalComments: "",
      investmentAdviceFee: 0,
      annualIncome: 0,
      monthlyExpenses: 0,
      hasDebts: false,
      debtType: "mortgage",
      debtInterestRate: 0,
      debtTermRemaining: 0,
      debtPayment: 0,
      debtPaymentFrequency: "monthly",
      hasProperties: false,
      propertyType: "principal-residence",
      propertyMarketValue: 0,
      propertyCostBasis: 0,
      financialGoals: "",
      riskTolerance: "balanced",
      desiredRetirementAge: 65,
      retirementSpendingGoal: 0,
      qppCurrentlyReceiving: false,
      qppCurrentAmount: 0,
      qppExpectedAmount: 0,
      oasCurrentlyReceiving: false,
      oasCurrentAmount: 0,
      oasExpectedAmount: 0,
      hasInsurance: false,
      insuranceDeathBenefit: 0,
      insuranceType: "term",
      insuranceTermYearsRemaining: 0,
      insuranceAnnualPremiums: 0,
      insuranceWithEmployer: false,
      hasWill: false,
      willLastUpdated: "",
      hasAssetsOFI: false,
      assetsOFIDetails: "",
      tfsaMaximizedYearly: false,
      inRelationship: false,
      relationshipType: "married",
      hasCohabitationAgreement: false,
      additionalComments: "",
    },
  });

  // Reset form when initialData changes, but preserve current values if they exist
  useEffect(() => {
    if (initialData) {
      const currentValues = form.getValues();
      const hasCurrentData = Object.values(currentValues).some(value =>
        value !== "" && value !== 0 && value !== false
      );

      if (!hasCurrentData) {
        form.reset(initialData);
      }
    }
  }, [initialData, form]);

  const handleValidSubmit = useCallback((data: ClientData) => {
    console.log('Form button clicked, submitting:', data);
    onSubmit(data);
  }, [onSubmit]);

  const handleFormSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submit handler called');
    form.handleSubmit(handleValidSubmit)(e);
  }, [form, handleValidSubmit]);

  return (
    <div className="space-y-6">
      {/* Sticky Save Button */}
      <div className="sticky top-32 z-40 flex justify-end mb-2 pr-4">
        <Button
          type="submit"
          size="sm"
          className="px-6 py-2 text-sm font-medium shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
          data-testid="button-submit-form-top"
          onClick={(e) => {
            console.log('Update Client Data button clicked');
            form.handleSubmit(handleValidSubmit)(e);
          }}
        >
          Save Changes
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name (optional)"
                          data-testid="input-firstname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name (optional)"
                          data-testid="input-lastname"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-date-of-birth"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hasSecondClient"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Add a second client to the report?</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-second-client"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("hasSecondClient") && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Second Client Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="secondClientFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter first name"
                              data-testid="input-second-firstname"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondClientLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter last name"
                              data-testid="input-second-lastname"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondClientDateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              data-testid="input-second-date-of-birth"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Situation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Situation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Investment Advisory Fee</h4>
                  <FormField
                    control={form.control}
                    name="investmentAdviceFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Investment Advice Fee (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="1.25"
                            data-testid="input-investment-advice-fee"
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h4 className="font-medium mb-4">Client 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="annualIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Income ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50000"
                              data-testid="input-income"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Expenses ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="3000"
                              data-testid="input-expenses"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Client 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="secondClientAnnualIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Income ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                data-testid="input-second-income"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondClientMonthlyExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Expenses ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="3000"
                                data-testid="input-second-expenses"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Debt Information */}
              <div className="space-y-6">
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium">Client 1 - Debt Information</h4>
                  <FormField
                    control={form.control}
                    name="hasDebts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Are there any debts?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-has-debts"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("hasDebts") && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="debtType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Debt</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-debt-type">
                                  <SelectValue placeholder="Select debt type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="car-loan">Car Loan</SelectItem>
                                <SelectItem value="mortgage">Mortgage</SelectItem>
                                <SelectItem value="heloc">HELOC</SelectItem>
                                <SelectItem value="personal-loan">Personal Loan</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="debtInterestRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interest Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="5.5"
                                  data-testid="input-debt-interest-rate"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="debtTermRemaining"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Term Remaining (months)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="120"
                                  data-testid="input-debt-term-remaining"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="debtPayment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Amount ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="500"
                                  data-testid="input-debt-payment"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="debtPaymentFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Frequency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-debt-frequency">
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Client 2 - Debt Information</h4>
                    <FormField
                      control={form.control}
                      name="secondClientHasDebts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Are there any debts?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-second-has-debts"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("secondClientHasDebts") && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="secondClientDebtType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type of Debt</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-second-debt-type">
                                    <SelectValue placeholder="Select debt type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="car-loan">Car Loan</SelectItem>
                                  <SelectItem value="mortgage">Mortgage</SelectItem>
                                  <SelectItem value="heloc">HELOC</SelectItem>
                                  <SelectItem value="personal-loan">Personal Loan</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="secondClientDebtInterestRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interest Rate (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="5.5"
                                    data-testid="input-second-debt-interest-rate"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secondClientDebtTermRemaining"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Term Remaining (months)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="120"
                                    data-testid="input-second-debt-term-remaining"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="secondClientDebtPayment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Amount ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="500"
                                    data-testid="input-second-debt-payment"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secondClientDebtPaymentFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-second-debt-frequency">
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Properties */}
              <div className="space-y-6">
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium">Client 1 - Property Information</h4>
                  <FormField
                    control={form.control}
                    name="hasProperties"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Do you own any properties?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-has-properties"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("hasProperties") && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-property-type">
                                  <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="principal-residence">Principal Residence</SelectItem>
                                <SelectItem value="secondary-residence">Secondary Residence</SelectItem>
                                <SelectItem value="rental-property">Rental Property</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="propertyMarketValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Market Value ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="500000"
                                  data-testid="input-property-market-value"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="propertyCostBasis"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cost Basis ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="400000"
                                  data-testid="input-property-cost-basis"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Client 2 - Property Information</h4>
                    <FormField
                      control={form.control}
                      name="secondClientHasProperties"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Do you own any properties?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-second-has-properties"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("secondClientHasProperties") && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="secondClientPropertyType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-second-property-type">
                                    <SelectValue placeholder="Select property type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="principal-residence">Principal Residence</SelectItem>
                                  <SelectItem value="secondary-residence">Secondary Residence</SelectItem>
                                  <SelectItem value="rental-property">Rental Property</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="secondClientPropertyMarketValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Market Value ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="500000"
                                    data-testid="input-second-property-market-value"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secondClientPropertyCostBasis"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cost Basis ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="400000"
                                    data-testid="input-second-property-cost-basis"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Retirement Planning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Retirement Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Client 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="desiredRetirementAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desired Retirement Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="65"
                              data-testid="input-retirement-age"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 65)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="retirementSpendingGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Spending Goal at Retirement ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="4000"
                              data-testid="input-retirement-spending"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Client 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="secondClientDesiredRetirementAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desired Retirement Age</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="65"
                                data-testid="input-second-retirement-age"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 65)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondClientRetirementSpendingGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Spending Goal at Retirement ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="4000"
                                data-testid="input-second-retirement-spending"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* QPP Section */}
              <div className="space-y-6">
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium">Client 1 - Quebec Pension Plan (QPP)</h4>
                  <FormField
                    control={form.control}
                    name="qppCurrentlyReceiving"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Currently receiving QPP?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-qpp-receiving"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("qppCurrentlyReceiving") ? (
                    <FormField
                      control={form.control}
                      name="qppCurrentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current QPP Monthly Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="800"
                              data-testid="input-qpp-current"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="qppExpectedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected QPP Monthly Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1200"
                              data-testid="input-qpp-expected"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Client 2 - Quebec Pension Plan (QPP)</h4>
                    <FormField
                      control={form.control}
                      name="secondClientQppCurrentlyReceiving"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Currently receiving QPP?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-second-qpp-receiving"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {form.watch("secondClientQppCurrentlyReceiving") ? (
                      <FormField
                        control={form.control}
                        name="secondClientQppCurrentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current QPP Monthly Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="800"
                                data-testid="input-second-qpp-current"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="secondClientQppExpectedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected QPP Monthly Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1200"
                                data-testid="input-second-qpp-expected"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* OAS Section */}
              <div className="space-y-6">
                <div className="space-y-3 p-4 border rounded-lg">
                  <h4 className="font-medium">Client 1 - Old Age Security (OAS)</h4>
                  <FormField
                    control={form.control}
                    name="oasCurrentlyReceiving"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Currently receiving OAS?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-oas-receiving"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("oasCurrentlyReceiving") ? (
                    <FormField
                      control={form.control}
                      name="oasCurrentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current OAS Monthly Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="650"
                              data-testid="input-oas-current"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="oasExpectedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected OAS Monthly Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="700"
                              data-testid="input-oas-expected"
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Client 2 - Old Age Security (OAS)</h4>
                    <FormField
                      control={form.control}
                      name="secondClientOasCurrentlyReceiving"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Currently receiving OAS?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-second-oas-receiving"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {form.watch("secondClientOasCurrentlyReceiving") ? (
                      <FormField
                        control={form.control}
                        name="secondClientOasCurrentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current OAS Monthly Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="650"
                                data-testid="input-second-oas-current"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="secondClientOasExpectedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected OAS Monthly Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="700"
                                data-testid="input-second-oas-expected"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Client 1</h4>
                  <FormField
                    control={form.control}
                    name="hasInsurance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Do you have life insurance?</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-has-insurance"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("hasInsurance") && (
                    <div className="space-y-4 p-4 border rounded-lg mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="insuranceDeathBenefit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Death Benefit ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="250000"
                                  data-testid="input-insurance-death-benefit"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="insuranceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type of Insurance</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-insurance-type">
                                    <SelectValue placeholder="Select insurance type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="term">Term</SelectItem>
                                  <SelectItem value="permanent">Permanent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch("insuranceType") === "term" && (
                        <FormField
                          control={form.control}
                          name="insuranceTermYearsRemaining"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years Remaining on Term</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="15"
                                  data-testid="input-insurance-term-years"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="insuranceAnnualPremiums"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Premiums ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="2000"
                                  data-testid="input-insurance-premiums"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="insuranceWithEmployer"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Insurance with Employer?</FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-insurance-employer"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Client 2</h4>
                    <FormField
                      control={form.control}
                      name="secondClientHasInsurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Do you have life insurance?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-second-has-insurance"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("secondClientHasInsurance") && (
                      <div className="space-y-4 p-4 border rounded-lg mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="secondClientInsuranceDeathBenefit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Death Benefit ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="250000"
                                    data-testid="input-second-insurance-death-benefit"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secondClientInsuranceType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type of Insurance</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-second-insurance-type">
                                      <SelectValue placeholder="Select insurance type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="term">Term</SelectItem>
                                    <SelectItem value="permanent">Permanent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("secondClientInsuranceType") === "term" && (
                          <FormField
                            control={form.control}
                            name="secondClientInsuranceTermYearsRemaining"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years Remaining on Term</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="15"
                                    data-testid="input-second-insurance-term-years"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="secondClientInsuranceAnnualPremiums"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Annual Premiums ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="2000"
                                    data-testid="input-second-insurance-premiums"
                                    {...field}
                                    value={field.value === 0 ? "" : field.value}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="secondClientInsuranceWithEmployer"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Insurance with Employer?</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-second-insurance-employer"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legal Documents & Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Legal Documents & Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Client 1</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="hasWill"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Do you have a will?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-has-will"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasWill") && (
                      <FormField
                        control={form.control}
                        name="willLastUpdated"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>When was it last updated?</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., January 2023"
                                data-testid="input-will-updated"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="hasAssetsOFI"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Assets held in other financial institutions?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-has-assets-ofi"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasAssetsOFI") && (
                      <FormField
                        control={form.control}
                        name="assetsOFIDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Details of assets in other institutions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the assets held in other financial institutions..."
                                className="min-h-[80px]"
                                data-testid="input-assets-ofi-details"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="tfsaMaximizedYearly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Is TFSA being maximized every year?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-tfsa-maximized"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Client 2</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="secondClientHasWill"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Do you have a will?</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-second-has-will"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch("secondClientHasWill") && (
                        <FormField
                          control={form.control}
                          name="secondClientWillLastUpdated"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>When was it last updated?</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., January 2023"
                                  data-testid="input-second-will-updated"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="secondClientHasAssetsOFI"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Assets held in other financial institutions?</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-second-has-assets-ofi"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch("secondClientHasAssetsOFI") && (
                        <FormField
                          control={form.control}
                          name="secondClientAssetsOFIDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Details of assets in other institutions</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the assets held in other financial institutions..."
                                  className="min-h-[80px]"
                                  data-testid="input-second-assets-ofi-details"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="secondClientTfsaMaximizedYearly"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Is TFSA being maximized every year?</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-second-tfsa-maximized"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Relationship Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Relationship Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="inRelationship"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Are you in a relationship?</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-in-relationship"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("inRelationship") && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="relationshipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-relationship-type">
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="common-law">Common-law</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("relationshipType") === "common-law" && (
                    <FormField
                      control={form.control}
                      name="hasCohabitationAgreement"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Do you have a cohabitation agreement?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-cohabitation-agreement"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals and Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Client 1</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="financialGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financial Goals</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your financial goals and objectives (optional)..."
                              className="min-h-[100px]"
                              data-testid="input-goals"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Tolerance</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-risk">
                                <SelectValue placeholder="Select risk tolerance" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="conservative">Conservative</SelectItem>
                              <SelectItem value="conservative-income">Conservative Income</SelectItem>
                              <SelectItem value="balanced-income">Balanced Income</SelectItem>
                              <SelectItem value="balanced">Balanced</SelectItem>
                              <SelectItem value="balanced-growth">Balanced Growth</SelectItem>
                              <SelectItem value="growth">Growth</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="additionalComments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Comments (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information you'd like to share..."
                              className="min-h-[80px]"
                              data-testid="input-comments"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {form.watch("hasSecondClient") && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Client 2</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="secondClientFinancialGoals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Financial Goals</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your financial goals and objectives..."
                                className="min-h-[100px]"
                                data-testid="input-second-goals"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondClientRiskTolerance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk Tolerance</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-second-risk">
                                  <SelectValue placeholder="Select risk tolerance" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="conservative">Conservative</SelectItem>
                                <SelectItem value="conservative-income">Conservative Income</SelectItem>
                                <SelectItem value="balanced-income">Balanced Income</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="balanced-growth">Balanced Growth</SelectItem>
                                <SelectItem value="growth">Growth</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondClientAdditionalComments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Comments (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional information you'd like to share..."
                                className="min-h-[80px]"
                                data-testid="input-second-comments"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


        </form>
      </Form>
    </div>
  );
}