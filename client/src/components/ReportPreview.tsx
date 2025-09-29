import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ClientData, Strategy } from "@shared/schema";

interface ReportPreviewProps {
  clientData: ClientData | null;
  selectedStrategies: Strategy[];
  reportText: string;
  onGenerateReport: () => void;
  onExportReport: () => void;
  isGenerating?: boolean;
}

export default function ReportPreview({ 
  clientData, 
  selectedStrategies, 
  reportText, 
  onGenerateReport, 
  onExportReport,
  isGenerating = false
}: ReportPreviewProps) {
  const { toast } = useToast();

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: "Report copied",
        description: "The report has been copied to your clipboard.",
      });
      console.log("Report copied to clipboard");
    } catch (err) {
      console.error("Failed to copy report:", err);
      toast({
        title: "Copy failed",
        description: "Unable to copy the report to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generateDefaultReport = () => {
    if (!clientData) return "";
    if (selectedStrategies.length === 0) return "";
    return "";
  };

  const displayReport = reportText;
  const hasData = clientData && selectedStrategies.length > 0;

  const exportReport = (format: 'txt' | 'pdf' | 'docx' = 'txt') => {
    if (!reportText) {
      toast({
        title: "No report to export",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }

    if (format === 'txt') {
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
    } else {
      // For PDF/DOCX, we'll need to send to backend for processing
      fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reportText, 
          clientData,
          format,
          filename: `financial-planning-report-${new Date().toISOString().split('T')[0]}`
        })
      })
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial-planning-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Report exported",
          description: `The report has been downloaded as a ${format.toUpperCase()} file.`,
        });
      })
      .catch(error => {
        console.error('Export error:', error);
        toast({
          title: "Export failed",
          description: `Failed to export as ${format.toUpperCase()}. Falling back to text export.`,
          variant: "destructive",
        });
        exportReport('txt'); // Fallback to text export
      });
    }

    console.log(`Report exported successfully as ${format}`);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Financial Planning Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={hasData && reportText ? "default" : "secondary"} data-testid="text-report-status">
              {hasData && reportText ? "Complete" : "Draft"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onGenerateReport} 
            size="sm" 
            disabled={!clientData || isGenerating}
            data-testid="button-generate-report"
          >
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
          <Button 
            onClick={handleCopyReport} 
            size="sm" 
            variant="outline"
            disabled={!displayReport}
            data-testid="button-copy-report"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button 
            onClick={() => exportReport('txt')} 
            size="sm" 
            variant="outline"
            disabled={!displayReport || !hasData}
            data-testid="button-export-report"
          >
            <Download className="h-4 w-4 mr-1" />
            Export TXT
          </Button>
          {/* Add buttons for PDF and DOCX export */}
          <Button
            onClick={() => exportReport('pdf')}
            size="sm"
            variant="outline"
            disabled={!displayReport || !hasData}
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button
            onClick={() => exportReport('docx')}
            size="sm"
            variant="outline"
            disabled={!displayReport || !hasData}
            data-testid="button-export-docx"
          >
            <Download className="h-4 w-4 mr-1" />
            Export DOCX
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {clientData && (
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Client:</span>{" "}
                <span className="font-medium" data-testid="text-client-name">
                  {clientData.firstName} {clientData.lastName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Strategies:</span>{" "}
                <span className="font-medium" data-testid="text-strategy-count">
                  {selectedStrategies.length}
                </span>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {displayReport ? (
              displayReport.split('\n\n').map((section, index) => {
                const [title, ...content] = section.split('\n');
                const isHeader = title && title === title.toUpperCase() && !title.includes(':');

                if (isHeader && content.length > 0) {
                  return (
                    <div key={index} className="space-y-2">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        {title}
                      </h3>
                      <Separator />
                      <div className="space-y-1">
                        {content.map((line, lineIndex) => (
                          <p key={lineIndex} className="text-sm leading-relaxed whitespace-pre-wrap">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                      {section}
                    </p>
                  );
                }
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Report Generated</p>
                <p className="text-sm">
                  {!clientData ? "Please fill out client data first." : 
                   selectedStrategies.length === 0 ? "Select strategies and click 'Generate Report'." :
                   "Click 'Generate Report' to create your financial planning report."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}