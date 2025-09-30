import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { clientDataSchema, clientStrategyConfigSchema, strategySchema, customStrategySchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, getUserFromSession } from "./replitAuth";

// Utility functions for consistent API responses
const handleAsyncRoute = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

const sendError = (res: Response, status: number, message: string, details?: any) => {
  res.status(status).json({ error: message, ...(details && { details }) });
};

const sendSuccess = (res: Response, data: any, status: number = 200) => {
  res.status(status).json(data);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Authentication routes
  app.get('/api/auth/user', isAuthenticated, handleAsyncRoute(async (req: Request, res: Response) => {
    const user = getUserFromSession(req);
    if (!user) {
      return sendError(res, 401, 'Unauthorized');
    }
    res.json(user);
  }));

  // Protected Client Data Routes
  app.post('/api/client-data', isAuthenticated, handleAsyncRoute(async (req: any, res) => {
    const userId = req.user.claims.sub; // Get authenticated user ID

    console.log('Received client data:', Object.keys(req.body));

    const result = clientDataSchema.safeParse(req.body);

    if (result.success) {
      const savedData = await storage.saveClientData(userId, result.data);
      console.log('Full validation - returning saved data');
      sendSuccess(res, savedData);
    } else {
      // Auto-save with partial data
      console.log('Partial validation - saving partial data');
      const savedData = await (storage as any).savePartialClientData(userId, req.body);
      sendSuccess(res, savedData);
    }
  }));

  app.get('/api/client-data/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub; // Get authenticated user ID

      const clientData = await (storage as any).getCurrentClientData(userId);
      if (!clientData) {
        res.status(404).json({ error: 'No client data found' });
        return;
      }
      res.json(clientData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch client data' });
    }
  });

  // Get all client data for centralized management (protected)
  app.get('/api/client-data/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub; // Get authenticated user ID

      const allClientData = await (storage as any).getAllClientData(userId);
      res.json(allClientData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all client data' });
    }
  });

  // Delete specific client data (now public, but uses a fixed userId)
  app.delete('/api/client-data/:id', async (req, res) => { // Removed authenticateToken middleware
    try {
      // Removed userId extraction and check
      const userId = 'anonymous'; // Assigning a default anonymous user ID

      // Assuming :id in the route refers to the data ID, not user ID, and storage handles access.
      // If :id was intended to be userId, this logic would need to be re-evaluated.
      const deleted = await (storage as any).deleteClientData(userId, req.params.id); // Adjusted to potentially use data ID
      if (!deleted) {
        res.status(404).json({ error: 'Client data not found' });
        return;
      }
      res.json({ message: 'Client data deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete client data' });
    }
  });

  // Strategy Routes (no authentication)
  app.get('/api/strategies', handleAsyncRoute(async (req, res) => { // Removed authenticateToken
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategies' });
    }
  }));

  app.get('/api/strategies/:id', async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
      }
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategy' });
    }
  });

  // Add new strategy (no authentication)
  app.post('/api/strategies', handleAsyncRoute(async (req, res) => { // Removed authenticateToken
    const result = strategySchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, 400, 'Invalid strategy data', result.error);
    }

    try {
      const newStrategy = await storage.addStrategy(result.data);
      sendSuccess(res, newStrategy);
    } catch (error) {
      console.error('Error adding strategy:', error);
      sendError(res, 500, 'Failed to add strategy');
    }
  }));

  // Update existing strategy (built-in) (no authentication)
  app.put('/api/strategies/:id', async (req, res) => { // Removed authenticateToken
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedStrategy = await (storage as any).updateStrategy(id, updates);
      if (!updatedStrategy) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
      }

      res.json(updatedStrategy);
    } catch (error) {
      console.error('Error updating strategy:', error);
      res.status(500).json({ error: 'Failed to update strategy' });
    }
  });

  // Delete strategy (no authentication)
  app.delete('/api/strategies/:id', async (req, res) => { // Removed authenticateToken
    try {
      const { id } = req.params;
      const deleted = await (storage as any).deleteStrategy(id);

      if (!deleted) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
      }

      res.json({ message: 'Strategy deleted successfully' });
    } catch (error) {
      console.error('Error deleting strategy:', error);
      res.status(500).json({ error: 'Failed to delete strategy' });
    }
  });

  // Get strategies by category (no authentication)
  app.get('/api/strategies/category/:category', async (req, res) => { // Removed authenticateToken
    try {
      const { category } = req.params;
      const strategies = await (storage as any).getStrategiesByCategory(category);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategies by category' });
    }
  });

  // Get strategies by section (no authentication)
  app.get('/api/strategies/section/:section', async (req, res) => { // Removed authenticateToken
    try {
      const { section } = req.params;
      const strategies = await (storage as any).getStrategiesBySection(section);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategies by section' });
    }
  });

  // Export strategies (no authentication)
  app.get('/api/strategies/export', async (req, res) => { // Removed authenticateToken
    try {
      const customStrategies = await (storage as any).exportStrategies();
      res.json(customStrategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export strategies' });
    }
  });

  // Import strategies (no authentication)
  app.post('/api/strategies/import', async (req, res) => { // Removed authenticateToken
    try {
      const { strategies } = req.body;
      if (!Array.isArray(strategies)) {
        res.status(400).json({ error: 'Strategies must be an array' });
        return;
      }

      const importedStrategies = await (storage as any).importStrategies(strategies);
      res.json(importedStrategies);
    } catch (error) {
      console.error('Error importing strategies:', error);
      res.status(500).json({ error: 'Failed to import strategies' });
    }
  });

  // Client Strategy Configurations endpoints (now public)
  app.get('/api/client-strategy-configs/current', async (req, res) => { // Removed authenticateToken
    try {
      // Removed userId extraction and check
      const userId = 'anonymous'; // Assigning a default anonymous user ID

      const configs = await (storage as any).getCurrentClientStrategyConfigs(userId);
      res.json(configs);
    } catch (error) {
      res.status(404).json({ error: 'No client strategy configurations found' });
    }
  });

  app.post('/api/client-strategy-configs', async (req, res) => { // Removed authenticateToken
    try {
      const configs = req.body;
      // Removed userId extraction and check
      const userId = 'anonymous'; // Assigning a default anonymous user ID

      // Validate each configuration
      for (const config of configs) {
        const result = clientStrategyConfigSchema.safeParse(config);
        if (!result.success) {
          res.status(400).json({ error: 'Invalid strategy configuration data', details: result.error });
          return;
        }
      }

      const savedConfigs = await (storage as any).saveClientStrategyConfigs(userId, configs);
      res.json(savedConfigs);
    } catch (error) {
      console.error('Error saving client strategy configs:', error);
      res.status(500).json({ error: 'Failed to save client strategy configurations' });
    }
  });

  // Helper function to replace template placeholders and handle conditional text
  function replaceTemplatePlaceholders(template: string, values: Record<string, string | number | boolean>, strategy: any): string {
    let result = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : match;
    });

    // Handle conditional text for toggle fields
    if (strategy && strategy.inputFields) {
      strategy.inputFields.forEach((field: any) => {
        if (field.type === 'toggle' && field.conditionalText && values[field.id] !== undefined) {
          const toggleValue = Boolean(values[field.id]);
          if (toggleValue && field.conditionalText.whenTrue) {
            result += '\n' + field.conditionalText.whenTrue;
          } else if (!toggleValue && field.conditionalText.whenFalse) {
            result += '\n' + field.conditionalText.whenFalse;
          }
        }
      });
    }

    return result;
  }

  // Enhanced Report Generation Route (available to everyone)
  app.post('/api/reports/generate', async (req, res) => {
    try {
      const { clientData, selectedStrategyIds, strategyConfigurations, selectedCustomStrategyIds } = req.body;

      if (!clientData) {
        res.status(400).json({ error: 'Client data is required' });
        return;
      }

      // Validate client data
      const validatedClientData = clientDataSchema.parse(clientData);

      // Handle both old and new format for backward compatibility
      let configs = strategyConfigurations || [];

      // Convert old format to new format if needed
      if (selectedStrategyIds && !strategyConfigurations) {
        const allStrategies = await storage.getStrategies();
        configs = selectedStrategyIds.map((id: string) => {
          const strategy = allStrategies.find(s => s.id === id);
          const defaultValues: Record<string, string | number> = {};

          // Use default values from strategy input fields
          if (strategy && strategy.inputFields) {
            strategy.inputFields.forEach(field => {
              if (field.defaultValue !== undefined) {
                defaultValues[field.id] = field.defaultValue;
              }
            });
          }

          return {
            strategyId: id,
            isEnabled: true,
            inputValues: defaultValues
          };
        });
      }

      // Get all strategies (built-in and custom)
      const allStrategies = await storage.getStrategies();
      const customStrategies = await (storage as any).getCustomStrategies(); // This might need adjustment if getCustomStrategies was user-specific
      const allAvailableStrategies = [...allStrategies, ...customStrategies];

      // Get enabled strategies from configurations
      const enabledConfigs = configs.filter((config: any) => config.isEnabled);
      const strategies = enabledConfigs.map((config: any) => {
        const strategy = allAvailableStrategies.find(s => s.id === config.strategyId);
        if (strategy) {
          // Create enhanced strategy with customized content
          return {
            ...strategy,
            content: replaceTemplatePlaceholders(strategy.content, config.inputValues || {}, strategy)
          };
        }
        return null;
      }).filter(Boolean);

      // Generate report text
      const reportText = generateReportText(validatedClientData, strategies, []); // customStrategies are not passed here, check if intended

      // Save report
      const report = await storage.saveReport({
        clientData: validatedClientData,
        strategyConfigurations: configs,
        generatedReport: reportText
      });

      res.json({ report: reportText, reportId: report.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid client data', details: error.errors });
      } else {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
      }
    }
  });

  // Report Export Routes (available to everyone)
  app.post('/api/reports/export', async (req, res) => {
    try {
      const { reportText, clientData, format, filename } = req.body;

      if (format === 'pdf') {
        // For now, return a simple PDF-like response
        // In production, you'd use a library like puppeteer or jsPDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.send(Buffer.from(`PDF Export - ${reportText}`));
      } else if (format === 'docx') {
        // For now, return a simple DOCX-like response
        // In production, you'd use a library like docx
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(Buffer.from(`DOCX Export - ${reportText}`));
      } else {
        res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  });

  // Custom Strategies Routes (no authentication)
  app.get('/api/custom-strategies', async (req, res) => { // Removed authenticateToken
    try {
      // Removed userId extraction and check
      const userId = 'anonymous'; // Assigning a default anonymous user ID
      const customStrategies = await (storage as any).getCustomStrategies(userId);
      res.json(customStrategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch custom strategies' });
    }
  });

  // Add custom strategy (no authentication)
  app.post('/api/custom-strategies', async (req, res) => { // Removed authenticateToken
    try {
      const { title, content, section } = req.body;
      // Removed userId extraction
      const userId = 'anonymous'; // Assigning a default anonymous user ID

      if (!title || !content || !section) {
        return res.status(400).json({ error: 'Title, content, and section are required' });
      }

      const addedCustomStrategy = await (storage as any).addCustomStrategy({
        title,
        content,
        section
      }, userId); // userId is passed here, ensure storage.addCustomStrategy can handle 'anonymous' or modify if needed
      res.json(addedCustomStrategy);
    } catch (error) {
      console.error('Error adding custom strategy:', error);
      res.status(500).json({ error: 'Failed to add custom strategy' });
    }
  });

  // Update custom strategy (no authentication)
  app.put('/api/custom-strategies/:id', async (req, res) => { // Removed authenticateToken
    try {
      const { title, content, section } = req.body;

      if (!title || !content || !section) {
        return res.status(400).json({ error: 'Title, content, and section are required' });
      }

      // Assuming storage.updateCustomStrategy does not require userId or can handle 'anonymous'
      const updatedStrategy = await (storage as any).updateCustomStrategy(req.params.id, {
        title,
        content,
        section
      });

      if (!updatedStrategy) {
        res.status(404).json({ error: 'Custom strategy not found' });
        return;
      }

      res.json(updatedStrategy);
    } catch (error) {
      console.error('Error updating custom strategy:', error);
      res.status(500).json({ error: 'Failed to update custom strategy' });
    }
  });

  // Delete custom strategy (no authentication)
  app.delete('/api/custom-strategies/:id', async (req, res) => { // Removed authenticateToken
    try {
      // Assuming storage.removeCustomStrategy does not require userId or can handle 'anonymous'
      const deleted = await (storage as any).removeCustomStrategy(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Custom strategy not found' });
        return;
      }
      res.json({ message: 'Custom strategy deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete custom strategy' });
    }
  });

  // Get Reports (available to everyone)
  app.get('/api/reports', async (req, res) => { // Removed authenticateToken
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.get('/api/reports/:id', async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Report generation utilities
class ReportGenerator {
  private static readonly SECTION_MAPPINGS: Record<string, string> = {
    buildNetWorth: "BUILD NET WORTH",
    implementingTaxStrategies: "IMPLEMENTING TAX EFFICIENT STRATEGIES",
    protectingWhatMatters: "PROTECTING WHAT MATTERS",
    leavingALegacy: "LEAVING A LEGACY"
  };

  private static readonly SECTION_ORDER = [
    "buildNetWorth",
    "implementingTaxStrategies",
    "protectingWhatMatters",
    "leavingALegacy"
  ];

  static generateReport(clientData: any, strategies: any[], customStrategies: any[] = []): string {
    const strategiesBySection = this.groupStrategiesBySection(strategies, customStrategies);
    return this.buildReportContent(strategiesBySection);
  }

  private static groupStrategiesBySection(strategies: any[], customStrategies: any[]): Record<string, any[]> {
    const strategiesBySection: Record<string, any[]> = {};

    [...strategies, ...customStrategies].forEach(strategy => {
      if (strategy.section) {
        if (!strategiesBySection[strategy.section]) {
          strategiesBySection[strategy.section] = [];
        }
        strategiesBySection[strategy.section].push(strategy);
      }
    });

    return strategiesBySection;
  }

  private static buildReportContent(strategiesBySection: Record<string, any[]>): string {
    return this.SECTION_ORDER
      .map(sectionKey => {
        const sectionTitle = this.SECTION_MAPPINGS[sectionKey];
        const sectionStrategies = strategiesBySection[sectionKey] || [];

        let sectionContent = sectionTitle + '\n';

        if (sectionStrategies.length > 0) {
          sectionContent += sectionStrategies
            .map(strategy => '\n' + strategy.content + '\n')
            .join('');
        }

        return sectionContent + '\n';
      })
      .join('')
      .trim();
  }
}

function generateReportText(clientData: any, strategies: any[], customStrategies: any[] = []): string {
  return ReportGenerator.generateReport(clientData, strategies, customStrategies);
}