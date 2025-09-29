import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { clientDataSchema, clientStrategyConfigSchema, strategySchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    (req as any).user = decoded;
    next();
  });
};

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
  // Authentication Routes
  app.post('/api/auth/register', handleAsyncRoute(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 400, 'Username and password are required');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }

    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return sendError(res, 409, 'Username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({ username, password: hashedPassword });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      sendSuccess(res, {
        user: { id: user.id, username: user.username },
        token
      }, 201);
    } catch (error) {
      console.error('Registration error:', error);
      sendError(res, 500, 'Failed to create account');
    }
  }));

  app.post('/api/auth/login', handleAsyncRoute(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 400, 'Username and password are required');
    }

    try {
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return sendError(res, 401, 'Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return sendError(res, 401, 'Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      sendSuccess(res, {
        user: { id: user.id, username: user.username },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      sendError(res, 500, 'Failed to login');
    }
  }));

  app.get('/api/auth/verify', authenticateToken, handleAsyncRoute(async (req, res) => {
    const user = (req as any).user;
    sendSuccess(res, { user: { id: user.userId, username: user.username } });
  }));

  // Client Data Routes (protected)
  app.post('/api/client-data', authenticateToken, handleAsyncRoute(async (req, res) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return sendError(res, 401, 'Unauthorized');
    }

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

  app.get('/api/client-data/current', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

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

  // Get all client data for centralized management
  app.get('/api/client-data/all', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const allClientData = await (storage as any).getAllClientData(userId);
      res.json(allClientData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all client data' });
    }
  });

  // Delete specific client data
  app.delete('/api/client-data/:id', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (req.params.id !== userId) {
        res.status(404).json({ error: 'Client data not found' });
        return;
      }

      const deleted = await (storage as any).deleteClientData(userId);
      if (!deleted) {
        res.status(404).json({ error: 'Client data not found' });
        return;
      }
      res.json({ message: 'Client data deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete client data' });
    }
  });

  // Strategy Routes
  app.get('/api/strategies', async (req, res) => {
    try {
      const strategies = await storage.getStrategies();
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategies' });
    }
  });

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

  // Add new strategy
  app.post('/api/strategies', handleAsyncRoute(async (req, res) => {
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

  // Update existing strategy (built-in)
  app.put('/api/strategies/:id', async (req, res) => {
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

  // Delete strategy
  app.delete('/api/strategies/:id', async (req, res) => {
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

  // Get strategies by category
  app.get('/api/strategies/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const strategies = await (storage as any).getStrategiesByCategory(category);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategies by category' });
    }
  });

  // Get strategies by section
  app.get('/api/strategies/section/:section', async (req, res) => {
    try {
      const { section } = req.params;
      const strategies = await (storage as any).getStrategiesBySection(section);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch strategies by section' });
    }
  });

  // Export custom strategies
  app.get('/api/strategies/export', async (req, res) => {
    try {
      const customStrategies = await (storage as any).exportStrategies();
      res.json(customStrategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export strategies' });
    }
  });

  // Import strategies
  app.post('/api/strategies/import', async (req, res) => {
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

  // Client Strategy Configurations endpoints
  app.get('/api/client-strategy-configs/current', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const configs = await (storage as any).getCurrentClientStrategyConfigs(userId);
      res.json(configs);
    } catch (error) {
      res.status(404).json({ error: 'No client strategy configurations found' });
    }
  });

  app.post('/api/client-strategy-configs', authenticateToken, async (req, res) => {
    try {
      const configs = req.body;
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

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
      const customStrategies = await (storage as any).getCustomStrategies();
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
      const reportText = generateReportText(validatedClientData, strategies, []);

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

  // Report Export Routes
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

  // Custom Strategies Routes
  app.get('/api/custom-strategies', authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const customStrategies = await (storage as any).getCustomStrategies(userId);
      res.json(customStrategies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch custom strategies' });
    }
  });

  app.post('/api/custom-strategies', authenticateToken, async (req, res) => {
    try {
      const { title, content, section } = req.body;
      const userId = (req as any).user.userId;

      if (!title || !content || !section) {
        return res.status(400).json({ error: 'Title, content, and section are required' });
      }

      const addedCustomStrategy = await (storage as any).addCustomStrategy({
        title,
        content,
        section
      }, userId);
      res.json(addedCustomStrategy);
    } catch (error) {
      console.error('Error adding custom strategy:', error);
      res.status(500).json({ error: 'Failed to add custom strategy' });
    }
  });

  app.put('/api/custom-strategies/:id', authenticateToken, async (req, res) => {
    try {
      const { title, content, section } = req.body;

      if (!title || !content || !section) {
        return res.status(400).json({ error: 'Title, content, and section are required' });
      }

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

  app.delete('/api/custom-strategies/:id', authenticateToken, async (req, res) => {
    try {
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

  // Get Reports
  app.get('/api/reports', async (req, res) => {
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
    recommendations: "RECOMMENDATIONS",
    buildingNetWorth: "BUILDING NET WORTH", 
    planningForRetirement: "PLANNING FOR RETIREMENT",
    payingDownDebt: "PAYING DOWN DEBT",
    planningForEducation: "PLANNING FOR EDUCATION",
    planningForBusinessOwners: "PLANNING FOR BUSINESS OWNERS",
    planningForLargePurchase: "PLANNING FOR LARGE PURCHASE OR EVENT",
    implementingTaxStrategies: "IMPLEMENTING TAX-EFFICIENT STRATEGIES",
    optimizeCashflow: "OPTIMIZE CASH FLOW",
    retirementIncomePlanning: "RETIREMENT INCOME PLANNING",
    planningForUncertainty: "PLANNING FOR UNCERTAINTY",
    insurance: "INSURANCE",
    donatingToCharity: "DONATING TO CHARITY",
    passingOnWealth: "PASSING ON YOUR WEALTH"
  };

  private static readonly SECTION_ORDER = [
    'recommendations', 'buildingNetWorth', 'planningForRetirement',
    'payingDownDebt', 'planningForEducation', 'planningForBusinessOwners',
    'planningForLargePurchase', 'implementingTaxStrategies', 'optimizeCashflow',
    'retirementIncomePlanning', 'planningForUncertainty', 'insurance',
    'donatingToCharity', 'passingOnWealth'
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