import { type ClientData, type InsertClientData, type Strategy, type Report, type InsertReport, type ClientStrategyConfig, type User, type UpsertUser, type CustomStrategy, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for financial planning application
export interface IStorage {
  // User operations - REQUIRED for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client data methods
  saveClientData(userId: string, data: InsertClientData): Promise<ClientData>;
  savePartialClientData(userId: string, data: Partial<ClientData>): Promise<Partial<ClientData>>;
  getClientData(userId: string): Promise<ClientData | undefined>;

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
  saveClientStrategyConfigs(userId: string, configs: ClientStrategyConfig[]): Promise<ClientStrategyConfig[]>;
  getClientStrategyConfigs(userId: string): Promise<ClientStrategyConfig[]>;

  // Report methods
  saveReport(report: InsertReport): Promise<Report>;
  getReport(id: string): Promise<Report | undefined>;
  getReports(): Promise<Report[]>;
}


export class MemStorage implements IStorage {
  private clientData: Map<string, ClientData>;
  private strategies: Map<string, Strategy>;
  private reports: Map<string, Report>;
  private clientStrategyConfigs: Map<string, ClientStrategyConfig[]>;
  private customStrategies: Map<string, CustomStrategy>;
  private users: Map<string, User>;

  // Cache for frequently accessed data
  private strategiesByCategory: Map<string, Strategy[]> = new Map();
  private strategiesBySection: Map<string, Strategy[]> = new Map();
  private cacheInvalidated: boolean = true;

  constructor() {
    this.clientData = new Map();
    this.strategies = new Map();
    this.reports = new Map();
    this.clientStrategyConfigs = new Map();
    this.customStrategies = new Map();
    this.users = new Map();

    // Initialize default strategies
    this.initializeDefaultStrategies();
  }

  // User operations - REQUIRED for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);

    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      } as User;
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  // Legacy methods for backward compatibility
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser: User = {
      id: randomUUID(),
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // Client data methods
  async saveClientData(userId: string, data: InsertClientData): Promise<ClientData> {
    const clientData: ClientData = { ...data, userId }; // Ensure userId is part of the stored data if needed by other methods
    this.clientData.set(userId, clientData);
    console.log('Client data saved for user:', userId);
    console.log('Saved data keys:', Object.keys(clientData));
    return clientData;
  }

  async savePartialClientData(userId: string, data: Partial<ClientData>): Promise<Partial<ClientData>> {
    const existingData = this.clientData.get(userId) || {};
    // Merge new data with existing data
    const mergedData = { ...existingData, ...data, userId }; // Ensure userId is part of the stored data if needed by other methods

    this.clientData.set(userId, mergedData as ClientData);
    console.log('Partial client data saved for user:', userId);
    console.log('Merged data keys:', Object.keys(mergedData));
    return mergedData;
  }

  async getClientData(userId: string): Promise<ClientData | undefined> {
    return this.clientData.get(userId);
  }

  // Added methods to satisfy the interface and provided changes, adapted for Map
  async getCurrentClientData(userId: string): Promise<ClientData | undefined> {
    return this.clientData.get(userId);
  }

  async getAllClientData(userId: string): Promise<ClientData[]> {
    const data = this.clientData.get(userId);
    return data ? [data] : [];
  }

  async deleteClientData(userId: string): Promise<boolean> {
    return this.clientData.delete(userId);
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
  async saveClientStrategyConfigs(userId: string, configs: ClientStrategyConfig[]): Promise<ClientStrategyConfig[]> {
    this.clientStrategyConfigs.set(userId, configs);
    return configs;
  }

  async getClientStrategyConfigs(userId: string): Promise<ClientStrategyConfig[]> {
    return this.clientStrategyConfigs.get(userId) || [];
  }

  async getCurrentClientStrategyConfigs(userId: string): Promise<ClientStrategyConfig[]> {
    return this.getClientStrategyConfigs(userId);
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
  async getCustomStrategies(): Promise<CustomStrategy[]> {
    // Assuming customStrategies map stores all custom strategies, regardless of userId for now.
    // If user-specific custom strategies are needed, a different storage mechanism or keying strategy would be required.
    return Array.from(this.customStrategies.values());
  }

  async addCustomStrategy(strategy: { title: string; content: string; section?: string }): Promise<CustomStrategy> {
    const id = `custom-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
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

    await this.save(); // Assuming save persists changes, though MemStorage doesn't need it.
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
          section: "buildNetWorth",
          content: "Establish an emergency fund equal to 3-6 months of living expenses in a high-yield savings account. This fund should be easily accessible and separate from other savings goals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-reduction",
          title: "Debt Reduction Plan",
          description: "Systematic approach to eliminate high-interest debt",
          category: "Debt Management",
          section: "buildNetWorth",
          content: "Implement either debt avalanche (highest interest first) or debt snowball (smallest balance first) method to systematically eliminate debt while maintaining minimum payments on all accounts.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "retirement-401k",
          title: "401(k) Optimization",
          description: "Maximize employer matching and tax-advantaged retirement savings",
          category: "Retirement",
          section: "buildNetWorth",
          content: "Contribute at least enough to your 401(k) to receive full employer match, then maximize annual contributions up to IRS limits. Consider Roth vs traditional contributions based on current and expected future tax brackets.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "investment-portfolio",
          title: "Diversified Investment Portfolio",
          description: "Build age-appropriate asset allocation with low-cost index funds",
          category: "Investing",
          section: "buildNetWorth",
          content: "Implement a diversified portfolio using low-cost index funds with asset allocation based on age, risk tolerance, and time horizon. Consider target-date funds for simplicity or build custom allocation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-optimization",
          title: "Tax Optimization Strategy",
          description: "Minimize tax burden through strategic planning and deductions",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Maximize tax-advantaged accounts (401k, IRA, HSA), consider tax-loss harvesting, and optimize timing of income and deductions. Review tax strategy annually and adjust as needed.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-review",
          title: "Insurance Coverage Review",
          description: "Ensure adequate protection for income, health, and assets",
          category: "Insurance",
          section: "protectingWhatMatters",
          content: "Review life insurance needs (10x annual income rule), disability insurance (60-70% of income), health insurance adequacy, and consider umbrella policy for asset protection.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "home-buying",
          title: "Home Purchase Strategy",
          description: "Plan for home ownership including down payment and ongoing costs",
          category: "Real Estate",
          section: "buildNetWorth",
          content: "Save for 10-20% down payment, maintain good credit score (740+), budget for closing costs and ongoing maintenance. Consider rent vs buy analysis based on local market conditions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "education-funding",
          title: "Education Funding Plan",
          description: "Save for children's education using tax-advantaged accounts",
          category: "Education",
          section: "leavingALegacy",
          content: "Utilize 529 education savings plans for tax-free growth and withdrawals for qualified education expenses. Consider age-based investment options and state tax benefits.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-efficiency-assessment",
          title: "Tax Efficiency Assessment",
          description: "Evaluate non-registered account tax efficiency",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
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
          section: "leavingALegacy",
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
          section: "leavingALegacy",
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
        },
        {
          id: "tax-loss-harvesting",
          title: "Tax Loss Harvesting",
          description: "Offset capital gains with investment losses to reduce tax liability",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Systematically realize investment losses to offset capital gains and reduce overall tax burden. Be mindful of wash sale rules and maintain portfolio diversification.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "life-insurance",
          title: "Life Insurance Protection",
          description: "Ensure adequate life insurance coverage for dependents",
          category: "Insurance",
          section: "protectingWhatMatters",
          content: "Evaluate life insurance needs based on income replacement, debt coverage, and family obligations. Consider term life insurance for temporary needs and permanent insurance for estate planning.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "disability-insurance",
          title: "Disability Insurance",
          description: "Protect income against disability with proper coverage",
          category: "Insurance",
          section: "protectingWhatMatters",
          content: "Secure disability insurance to protect against loss of income due to illness or injury. Consider both short-term and long-term disability coverage through employer or individual policies.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "estate-planning",
          title: "Estate Planning Basics",
          description: "Create essential estate planning documents",
          category: "Estate Planning",
          section: "leavingALegacy",
          content: "Establish a will, power of attorney, and healthcare directives. Consider trusts for larger estates and review beneficiaries on all accounts annually.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "charitable-giving",
          title: "Charitable Giving Strategy",
          description: "Optimize charitable donations for tax efficiency",
          category: "Tax Planning",
          section: "leavingALegacy",
          content: "Consider donor-advised funds, charitable remainder trusts, or direct giving strategies to maximize both charitable impact and tax benefits.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "investment-diversification",
          title: "Investment Diversification",
          description: "Build a well-diversified investment portfolio",
          category: "Investing",
          section: "buildNetWorth",
          content: "Create a diversified portfolio across asset classes, geographic regions, and investment styles to reduce risk while maintaining growth potential.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "roth-conversion",
          title: "Roth IRA Conversion Strategy",
          description: "Convert traditional IRA funds to Roth for tax-free growth",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Consider converting traditional IRA or 401(k) funds to Roth accounts during lower-income years to benefit from tax-free growth and withdrawals in retirement.",
          inputFields: [],
          isCustom: false
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