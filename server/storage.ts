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
          content: "Establish an emergency fund equal to 3-6 months of living expenses in a high-yield savings account (HISA) or Tax-Free Savings Account (TFSA). This fund should be easily accessible and separate from other savings goals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-reduction",
          title: "Debt Reduction Plan",
          description: "Systematic approach to eliminate high-interest debt",
          category: "Debt Management",
          section: "buildNetWorth",
          content: "Implement either debt avalanche (highest interest first) or debt snowball (smallest balance first) method to systematically eliminate debt while maintaining minimum payments on all accounts. Consider using TFSA room strategically once high-interest debt is eliminated.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rrsp-optimization",
          title: "RRSP Optimization Strategy",
          description: "Maximize RRSP contributions and employer matching",
          category: "Retirement",
          section: "buildNetWorth",
          content: "Contribute to your Registered Retirement Savings Plan (RRSP) to receive immediate tax deductions and defer taxes until retirement. Maximize employer matching contributions first, then consider additional contributions based on your marginal tax rate. Consider spousal RRSPs for income splitting in retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tfsa-maximization",
          title: "TFSA Maximization Strategy",
          description: "Fully utilize Tax-Free Savings Account room",
          category: "Savings",
          section: "buildNetWorth",
          content: "Maximize your Tax-Free Savings Account (TFSA) contributions annually. TFSA growth and withdrawals are tax-free, making it ideal for emergency funds, short-term goals, and long-term investing. Consider TFSA before RRSP if you're in a lower tax bracket or expect higher income in the future.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "investment-portfolio-canadian",
          title: "Canadian Diversified Investment Portfolio",
          description: "Build portfolio with Canadian and international exposure",
          category: "Investing",
          section: "buildNetWorth",
          content: "Implement a diversified portfolio including Canadian equity (TSX), international developed markets, emerging markets, and bonds. Consider Canadian-listed ETFs to minimize foreign withholding taxes in taxable accounts. Maintain home bias appropriate for Canadian investors (typically 25-40% Canadian equity).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "quebec-tax-optimization",
          title: "Quebec Tax Optimization Strategy",
          description: "Minimize combined federal and Quebec provincial tax burden",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Optimize for Quebec's unique tax structure with separate federal and provincial returns. Maximize RRSP contributions for combined 48%+ marginal tax rate relief. Consider Quebec-specific tax credits including childcare expenses, medical expenses, and charitable donations. Utilize income splitting strategies where applicable.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "qpp-cpp-optimization",
          title: "QPP/CPP Optimization Strategy",
          description: "Optimize Quebec and Canada Pension Plan benefits",
          category: "Retirement",
          section: "buildNetWorth",
          content: "Understand QPP (Quebec Pension Plan) benefits and optimal claiming strategies. Consider delaying QPP until age 70 for increased benefits (42% increase) if financially feasible. Factor QPP into overall retirement income planning alongside OAS and personal savings.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "resp-education-funding",
          title: "RESP Education Funding Plan",
          description: "Save for children's education using Registered Education Savings Plan",
          category: "Education",
          section: "leavingALegacy",
          content: "Utilize Registered Education Savings Plans (RESP) for tax-free growth and withdrawals for qualified education expenses. Maximize Canada Education Savings Grant (CESG) of 20% on first $2,500 contributed annually. Quebec residents also receive additional Quebec Education Savings Incentive (QESI).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "first-time-homebuyer",
          title: "First-Time Home Buyer Strategy",
          description: "Leverage Canadian programs for home ownership",
          category: "Real Estate",
          section: "buildNetWorth",
          content: "Utilize the Home Buyers' Plan (HBP) to withdraw up to $35,000 from RRSP tax-free for first home purchase. Consider First-Time Home Buyer Incentive programs and ensure adequate down payment (minimum 5% for homes under $500K). Factor in land transfer taxes, which vary by province, and consider legal fees and home inspection costs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-review-canadian",
          title: "Canadian Insurance Coverage Review",
          description: "Ensure adequate protection considering Canadian healthcare and benefits",
          category: "Insurance",
          section: "protectingWhatMatters",
          content: "Review life insurance needs (typically 8-10x annual income) considering mortgage protection, income replacement, and final expenses. Evaluate disability insurance to supplement employer coverage, as government disability benefits are limited. Consider critical illness insurance as a supplement to provincial healthcare coverage.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "estate-planning-quebec",
          title: "Quebec Estate Planning Essentials",
          description: "Create estate planning documents under Quebec civil law",
          category: "Estate Planning",
          section: "leavingALegacy",
          content: "Establish a will that complies with Quebec's Civil Code requirements. Consider a notarial will for added security. Prepare mandate in case of incapacity (equivalent to power of attorney). Review beneficiary designations on RRSPs, RRIFs, TFSAs, and insurance policies. Consider spousal rollovers and graduated rate estates for tax efficiency.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rrif-withdrawal-strategy",
          title: "RRIF Withdrawal Strategy",
          description: "Optimize RRIF withdrawals for tax efficiency",
          category: "Retirement",
          section: "implementingTaxStrategies",
          content: "Plan mandatory Registered Retirement Income Fund (RRIF) withdrawals starting at age 71. Consider income splitting with spouse through pension splitting rules. Time withdrawals to minimize OAS clawback (starting at $81,761 net income). Consider voluntary withdrawals in lower-income years to smooth tax burden.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "oas-optimization",
          title: "Old Age Security Optimization",
          description: "Maximize OAS benefits and minimize clawbacks",
          category: "Retirement",
          section: "protectingWhatMatters",
          content: "Understand Old Age Security (OAS) eligibility and benefit amounts. Plan to minimize OAS recovery tax (clawback) which begins at $81,761 net income. Consider income splitting strategies, RRSP withdrawal timing, and capital gains realization to stay below clawback thresholds. Factor in Guaranteed Income Supplement (GIS) if applicable.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "capital-gains-optimization",
          title: "Capital Gains Tax Strategy",
          description: "Optimize capital gains realization and lifetime exemption",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Utilize lifetime capital gains exemption ($971,190 for 2023) on qualified small business corporation shares and qualified farm/fishing property. Plan capital gains realization to minimize tax impact, considering income splitting opportunities and tax-loss harvesting in non-registered accounts.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "charitable-giving-canadian",
          title: "Canadian Charitable Giving Strategy",
          description: "Optimize charitable donations for Canadian tax efficiency",
          category: "Tax Planning",
          section: "leavingALegacy",
          content: "Maximize charitable tax credits (15% federal + provincial rate on first $200, then 29% federal + top provincial rate). Consider donating appreciated securities to eliminate capital gains tax. Explore charitable remainder trusts, charitable gift annuities, and private foundation options for larger gifts.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-loss-harvesting-canadian",
          title: "Canadian Tax Loss Harvesting",
          description: "Offset capital gains with investment losses in Canadian context",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Systematically realize investment losses to offset capital gains and reduce overall tax burden. Be mindful of Canada's superficial loss rules (30-day rule) and maintain portfolio diversification. Consider carrying forward capital losses indefinitely or back three years to optimize tax efficiency.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-efficiency-assessment",
          title: "Tax Efficiency Assessment",
          description: "Evaluate non-registered account tax efficiency",
          category: "Tax Planning",
          section: "implementingTaxStrategies",
          content: "Review your non-registered investment accounts for tax optimization opportunities considering Canadian dividend tax credits and capital gains treatment.",
          inputFields: [
            {
              id: "significantNonRegistered",
              label: "Is there a significant non-registered account?",
              type: "toggle",
              defaultValue: false,
              conditionalText: {
                whenTrue: "Consider asset location strategies: hold Canadian eligible dividends and growth investments in non-registered accounts, while placing interest-bearing investments in tax-sheltered accounts.",
                whenFalse: ""
              }
            }
          ],
          isCustom: false
        },
        {
          id: "estate-executor-review",
          title: "Estate Executor Review",
          description: "Assess executor capability for estate management",
          category: "Estate Planning",
          section: "leavingALegacy",
          content: "Evaluate whether your chosen executor can effectively handle your estate administration under Quebec civil law.",
          inputFields: [
            {
              id: "executorCapable",
              label: "Is the executor able to handle the Estate?",
              type: "toggle",
              defaultValue: true,
              conditionalText: {
                whenTrue: "",
                whenFalse: "Consider appointing a trust company or professional executor familiar with Quebec estate administration requirements."
              }
            }
          ],
          isCustom: false
        },
        {
          id: "testamentary-trust-analysis",
          title: "Testamentary Trust Analysis",
          description: "Determine if a testamentary trust is appropriate under Quebec law",
          category: "Estate Planning",
          section: "leavingALegacy",
          content: "Assess the relevance of establishing a testamentary trust for your beneficiaries under Quebec's Civil Code framework.",
          inputFields: [
            {
              id: "testamentaryTrustRelevant",
              label: "Is a Testamentary Trust relevant?",
              type: "toggle",
              defaultValue: false,
              conditionalText: {
                whenTrue: "Testamentary trusts can provide tax advantages and asset protection for beneficiaries, particularly useful for minor children or beneficiaries requiring financial guidance.",
                whenFalse: ""
              }
            }
          ],
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