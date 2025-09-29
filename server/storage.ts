import { type User, type InsertUser, type ClientData, type InsertClientData, type Strategy, type Report, type InsertReport, type ClientStrategyConfig } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for financial planning application
export interface IStorage {
  // Legacy user methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Client data methods
  saveClientData(data: InsertClientData): Promise<ClientData>;
  savePartialClientData(data: Partial<ClientData>): Promise<Partial<ClientData>>;
  getClientData(id: string): Promise<ClientData | undefined>;

  // Strategy methods
  getStrategies(): Promise<Strategy[]>;
  getStrategy(id: string): Promise<Strategy | undefined>;
  addStrategy(strategy: Omit<Strategy, 'id'>): Promise<Strategy>;

  // Custom Strategy methods
  getCustomStrategies(): Promise<CustomStrategy[]>;
  addCustomStrategy(strategy: { title: string; content: string }): Promise<CustomStrategy>;
  removeCustomStrategy(id: string): Promise<boolean>;
  updateCustomStrategy(id: string, updates: { title: string; content: string; section: string }): Promise<any>;

  // Client Strategy Configuration methods
  saveClientStrategyConfigs(clientId: string, configs: ClientStrategyConfig[]): Promise<ClientStrategyConfig[]>;
  getClientStrategyConfigs(clientId: string): Promise<ClientStrategyConfig[]>;

  // Report methods
  saveReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReports(): Promise<Report[]>;
}

interface CustomStrategy {
  id: string;
  title: string;
  content: string;
  section?: string;
  isSelected: boolean;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clientData: Map<string, ClientData>;
  private strategies: Map<string, Strategy>;
  private reports: Map<string, Report>;
  private clientStrategyConfigs: Map<string, ClientStrategyConfig[]>;
  private customStrategies: Map<string, CustomStrategy>;
  private currentClientId: string | null = null;
  
  // Cache for frequently accessed data
  private strategiesByCategory: Map<string, Strategy[]> = new Map();
  private strategiesBySection: Map<string, Strategy[]> = new Map();
  private cacheInvalidated: boolean = true;

  constructor() {
    this.users = new Map();
    this.clientData = new Map();
    this.strategies = new Map();
    this.reports = new Map();
    this.clientStrategyConfigs = new Map();
    this.customStrategies = new Map();

    // Initialize default strategies
    this.initializeDefaultStrategies();
  }

  // Legacy user methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Client data methods
  async saveClientData(data: InsertClientData, userId?: string): Promise<ClientData> {
    const dataKey = userId ? `${userId}_client_data` : (this.currentClientId || randomUUID());
    const clientData: ClientData = { ...data };
    this.clientData.set(dataKey, clientData);
    if (!userId) {
      this.currentClientId = dataKey;
    }
    console.log('Client data saved with key:', dataKey);
    console.log('Saved data keys:', Object.keys(clientData));
    return clientData;
  }

  async savePartialClientData(data: Partial<ClientData>): Promise<Partial<ClientData>> {
    const id = this.currentClientId || randomUUID();

    // Get existing data or create new with defaults
    const existingData = this.clientData.get(id) || {};

    // Merge new data with existing data
    const mergedData = { ...existingData, ...data };

    this.clientData.set(id, mergedData as ClientData);
    this.currentClientId = id;
    console.log('Partial client data saved with ID:', id);
    console.log('Merged data keys:', Object.keys(mergedData));
    return mergedData;
  }

  async getClientData(id: string): Promise<ClientData | undefined> {
    return this.clientData.get(id);
  }

  async getCurrentClientData(): Promise<ClientData | undefined> {
    if (!this.currentClientId) return undefined;
    return this.getClientData(this.currentClientId);
  }

  async getAllClientData(): Promise<ClientData[]> {
    return Array.from(this.clientData.values());
  }

  async deleteClientData(id: string): Promise<boolean> {
    const deleted = this.clientData.delete(id);
    if (deleted && this.currentClientId === id) {
      this.currentClientId = null;
    }
    return deleted;
  }

  // Strategy methods
  async getStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values());
  }

  async getStrategy(id: string): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  // Report methods
  async saveReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Client Strategy Configuration methods
  async saveClientStrategyConfigs(clientId: string, configs: ClientStrategyConfig[]): Promise<ClientStrategyConfig[]> {
    this.clientStrategyConfigs.set(clientId, configs);
    return configs;
  }

  async getClientStrategyConfigs(clientId: string): Promise<ClientStrategyConfig[]> {
    return this.clientStrategyConfigs.get(clientId) || [];
  }

  async getCurrentClientStrategyConfigs(): Promise<ClientStrategyConfig[]> {
    if (!this.currentClientId) return [];
    return this.getClientStrategyConfigs(this.currentClientId);
  }

  async addStrategy(strategy: Omit<Strategy, 'id'>): Promise<Strategy> {
    const id = `custom-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
    const newStrategy = { ...strategy, id };
    this.strategies.set(id, newStrategy);
    this.cacheInvalidated = true;
    console.log(`Added new strategy: ${newStrategy.title} (ID: ${id})`);
    return newStrategy;
  }

  async updateStrategy(id: string, updates: Partial<Strategy>): Promise<Strategy | null> {
    const existingStrategy = this.strategies.get(id);
    if (!existingStrategy) {
      return null;
    }
    
    const updatedStrategy = { ...existingStrategy, ...updates, id };
    this.strategies.set(id, updatedStrategy);
    this.cacheInvalidated = true;
    console.log(`Updated strategy: ${updatedStrategy.title} (ID: ${id})`);
    return updatedStrategy;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    const deleted = this.strategies.delete(id);
    if (deleted) {
      this.cacheInvalidated = true;
      console.log(`Deleted strategy with ID: ${id}`);
      // Also remove from any client configurations
      for (const [clientId, configs] of this.clientStrategyConfigs.entries()) {
        const filteredConfigs = configs.filter(config => config.strategyId !== id);
        if (filteredConfigs.length !== configs.length) {
          this.clientStrategyConfigs.set(clientId, filteredConfigs);
        }
      }
    }
    return deleted;
  }

  private rebuildCache(): void {
    if (!this.cacheInvalidated) return;
    
    this.strategiesByCategory.clear();
    this.strategiesBySection.clear();
    
    const allStrategies = Array.from(this.strategies.values());
    
    // Build category cache
    allStrategies.forEach(strategy => {
      if (!this.strategiesByCategory.has(strategy.category)) {
        this.strategiesByCategory.set(strategy.category, []);
      }
      this.strategiesByCategory.get(strategy.category)!.push(strategy);
    });
    
    // Build section cache
    allStrategies.forEach(strategy => {
      if (strategy.section) {
        if (!this.strategiesBySection.has(strategy.section)) {
          this.strategiesBySection.set(strategy.section, []);
        }
        this.strategiesBySection.get(strategy.section)!.push(strategy);
      }
    });
    
    this.cacheInvalidated = false;
  }

  async getStrategiesByCategory(category: string): Promise<Strategy[]> {
    this.rebuildCache();
    return this.strategiesByCategory.get(category) || [];
  }

  async getStrategiesBySection(section: string): Promise<Strategy[]> {
    this.rebuildCache();
    return this.strategiesBySection.get(section) || [];
  }

  async exportStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(s => s.isCustom);
  }

  async importStrategies(strategies: Strategy[]): Promise<Strategy[]> {
    const importedStrategies: Strategy[] = [];
    
    for (const strategy of strategies) {
      const newId = `imported-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
      const importedStrategy = { ...strategy, id: newId, isCustom: true };
      this.strategies.set(newId, importedStrategy);
      importedStrategies.push(importedStrategy);
    }
    
    console.log(`Imported ${importedStrategies.length} strategies`);
    return importedStrategies;
  }

  // Custom Strategy methods
  async getCustomStrategies(userId?: string): Promise<CustomStrategy[]> {
    if (!userId) {
      return Array.from(this.customStrategies.values());
    }
    
    // Filter strategies by user
    return Array.from(this.customStrategies.values()).filter(strategy => 
      strategy.id.startsWith(`${userId}_custom_`) || strategy.id.startsWith('custom_')
    );
  }

  async addCustomStrategy(strategy: { title: string; content: string; section?: string }, userId?: string): Promise<CustomStrategy> {
    const id = userId ? `${userId}_custom_${Date.now()}` : `custom-${Date.now()}`;
    const customStrategy: CustomStrategy = {
      id,
      title: strategy.title,
      content: strategy.content,
      section: strategy.section,
      isSelected: false
    };
    this.customStrategies.set(id, customStrategy);
    return customStrategy;
  }

  async updateCustomStrategy(id: string, updates: { title: string; content: string; section: string }): Promise<any> {
    const strategy = this.customStrategies.get(id);
    if (!strategy) {
      return null;
    }

    strategy.title = updates.title;
    strategy.content = updates.content;
    strategy.section = updates.section;

    await this.save();
    return strategy;
  }

  async removeCustomStrategy(id: string): Promise<boolean> {
    return this.customStrategies.delete(id);
  }

  private initializeDefaultStrategies() {
    // Add some default strategies if none exist
    if (this.strategies.size === 0) { // Changed from .length === 0 to .size === 0 for Map
      const defaultStrategies: Strategy[] = [
        {
          id: "emergency-fund",
          title: "Emergency Fund Strategy",
          description: "Build and maintain 3-6 months of expenses in liquid savings",
          category: "Savings",
          content: "Establish an emergency fund equal to 3-6 months of living expenses in a high-yield savings account. This fund should be easily accessible and separate from other savings goals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-reduction",
          title: "Debt Reduction Plan",
          description: "Systematic approach to eliminate high-interest debt",
          category: "Debt Management",
          content: "Implement either debt avalanche (highest interest first) or debt snowball (smallest balance first) method to systematically eliminate debt while maintaining minimum payments on all accounts.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "retirement-401k",
          title: "401(k) Optimization",
          description: "Maximize employer matching and tax-advantaged retirement savings",
          category: "Retirement",
          content: "Contribute enough to receive full employer match, then maximize annual contributions up to IRS limits. Consider Roth vs traditional contributions based on current and expected future tax brackets.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "investment-portfolio",
          title: "Diversified Investment Portfolio",
          description: "Build age-appropriate asset allocation with low-cost index funds",
          category: "Investing",
          content: "Implement a diversified portfolio using low-cost index funds with asset allocation based on age, risk tolerance, and time horizon. Consider target-date funds for simplicity or build custom allocation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-optimization",
          title: "Tax Optimization Strategy",
          description: "Minimize tax burden through strategic planning and deductions",
          category: "Tax Planning",
          content: "Maximize tax-advantaged accounts (401k, IRA, HSA), consider tax-loss harvesting, and optimize timing of income and deductions. Review tax strategy annually and adjust as needed.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-review",
          title: "Insurance Coverage Review",
          description: "Ensure adequate protection for income, health, and assets",
          category: "Protection",
          content: "Review life insurance needs (10x annual income rule), disability insurance (60-70% of income), health insurance adequacy, and consider umbrella policy for asset protection.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "home-buying",
          title: "Home Purchase Strategy",
          description: "Plan for home ownership including down payment and ongoing costs",
          category: "Real Estate",
          content: "Save for 10-20% down payment, maintain good credit score (740+), budget for closing costs and ongoing maintenance. Consider rent vs buy analysis based on local market conditions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "education-funding",
          title: "Education Funding Plan",
          description: "Save for children's education using tax-advantaged accounts",
          category: "Education",
          content: "Utilize 529 education savings plans for tax-free growth and withdrawals for qualified education expenses. Consider age-based investment options and state tax benefits.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-efficiency-assessment",
          title: "Tax Efficiency Assessment",
          description: "Evaluate non-registered account tax efficiency",
          category: "Tax Planning",
          content: "Review your non-registered investment accounts for tax optimization opportunities.",
          inputFields: [
            {
              id: "significantNonRegistered",
              label: "Is there a significant non-registered account?",
              type: "toggle",
              defaultValue: false,
              conditionalText: {
                whenTrue: "Think your portfolio is tax efficient ? Lol nope my friend.",
                whenFalse: ""
              }
            }
          ],
          isCustom: true
        },
        {
          id: "estate-executor-review",
          title: "Estate Executor Review",
          description: "Assess executor capability for estate management",
          category: "Estate Planning",
          content: "Evaluate whether your chosen executor can effectively handle your estate administration.",
          inputFields: [
            {
              id: "executorCapable",
              label: "Is the executor able to handle the Estate?",
              type: "toggle",
              defaultValue: true,
              conditionalText: {
                whenTrue: "",
                whenFalse: "Forget it bro, leave it to the pros."
              }
            }
          ],
          isCustom: true
        },
        {
          id: "testamentary-trust-analysis",
          title: "Testamentary Trust Analysis",
          description: "Determine if a testamentary trust is appropriate",
          category: "Estate Planning",
          content: "Assess the relevance of establishing a testamentary trust for your beneficiaries.",
          inputFields: [
            {
              id: "testamentaryTrustRelevant",
              label: "Is a Testamentary Trust relevant?",
              type: "toggle",
              defaultValue: false,
              conditionalText: {
                whenTrue: "Good call, you don't want your kids to spend it all for nothing right ?",
                whenFalse: ""
              }
            }
          ],
          isCustom: true
        }
      ];

      defaultStrategies.forEach(strategy => {
        this.strategies.set(strategy.id, strategy);
      });
    }
  }

  // Mock save method to satisfy the interface, as MemStorage uses direct Map manipulation
  private async save(): Promise<void> {
    // In-memory storage doesn't need a complex save operation.
    // If this were a real implementation (e.g., file system or database),
    // this is where the data would be persisted.
    console.log("Data saved (in-memory).");
  }
}

export const storage = new MemStorage();