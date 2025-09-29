import ReportPreview from '../ReportPreview';
import type { ClientData, Strategy } from '@shared/schema';

// todo: remove mock functionality
const mockClientData: ClientData = {
  firstName: "John",
  lastName: "Doe", 
  age: 35,
  email: "john.doe@example.com",
  phone: "(555) 123-4567",
  annualIncome: 85000,
  currentSavings: 25000,
  monthlyExpenses: 4500,
  debt: 15000,
  financialGoals: "Save for retirement, buy a house, and build an emergency fund for financial security.",
  riskTolerance: "moderate" as const,
  timeHorizon: "long" as const,
  additionalComments: "Interested in sustainable investing options and tax optimization strategies."
};

const mockStrategies: Strategy[] = [
  {
    id: "emergency-fund",
    title: "Emergency Fund Strategy", 
    description: "Build 3-6 months of expenses in liquid savings",
    category: "Savings",
    content: "Establish an emergency fund equal to 3-6 months of living expenses in a high-yield savings account."
  },
  {
    id: "retirement-401k",
    title: "401(k) Optimization",
    description: "Maximize employer matching and retirement savings", 
    category: "Retirement",
    content: "Contribute enough to receive full employer match, then maximize annual contributions up to IRS limits."
  }
];

export default function ReportPreviewExample() {
  const handleGenerateReport = () => {
    console.log('Generate report clicked');
  };

  const handleExportReport = () => {
    console.log('Export report clicked');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ReportPreview
        clientData={mockClientData}
        selectedStrategies={mockStrategies}
        reportText=""
        onGenerateReport={handleGenerateReport}
        onExportReport={handleExportReport}
      />
    </div>
  );
}