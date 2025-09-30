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
  addCustomStrategy(strategy: { title: string; content: string; section?: string; subsection?: string }): Promise<CustomStrategy>;
  removeCustomStrategy(id: string): Promise<boolean>;
  updateCustomStrategy(id: string, updates: { title: string; content: string; section: string; subsection?: string }): Promise<any>;

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
  private strategiesBySubsection: Map<string, Strategy[]> = new Map(); // Added cache for subsections
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
    this.strategiesBySubsection.clear(); // Clear subsection cache

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

    // Build subsection cache
    allStrategies.forEach(strategy => {
      if (strategy.subsection) {
        if (!this.strategiesBySubsection.has(strategy.subsection)) {
          this.strategiesBySubsection.set(strategy.subsection, []);
        }
        this.strategiesBySubsection.get(strategy.subsection)!.push(strategy);
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

  async getStrategiesBySubsection(subsection: string): Promise<Strategy[]> {
    this.rebuildCache();
    return this.strategiesBySubsection.get(subsection) || [];
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

  async addCustomStrategy(strategy: { title: string; content: string; section?: string; subsection?: string }): Promise<CustomStrategy> {
    const id = `custom-${Date.now()}-${strategy.title.toLowerCase().replace(/\s+/g, '-')}`;
    const customStrategy: CustomStrategy = {
      id,
      title: strategy.title,
      content: strategy.content,
      section: strategy.section,
      subsection: strategy.subsection,
      isSelected: false
    };
    this.customStrategies.set(id, customStrategy);
    // Add to strategies map as well to ensure it's cached and sortable
    this.strategies.set(id, { ...customStrategy, category: 'Custom', description: '', isCustom: true });
    this.cacheInvalidated = true;
    return customStrategy;
  }

  async updateCustomStrategy(id: string, updates: { title: string; content: string; section: string; subsection?: string }): Promise<any> {
    const strategy = this.customStrategies.get(id);
    if (!strategy) {
      return null;
    }

    strategy.title = updates.title;
    strategy.content = updates.content;
    strategy.section = updates.section;
    if (updates.subsection !== undefined) {
      strategy.subsection = updates.subsection;
    }

    // Update in the main strategies map as well
    const existingStrategyInMainMap = this.strategies.get(id);
    if (existingStrategyInMainMap) {
      this.strategies.set(id, {
        ...existingStrategyInMainMap,
        title: updates.title,
        content: updates.content,
        section: updates.section,
        subsection: updates.subsection
      });
      this.cacheInvalidated = true;
    }

    await this.save(); // Assuming save persists changes, though MemStorage doesn't need it.
    return strategy;
  }

  async removeCustomStrategy(id: string): Promise<boolean> {
    // Remove from both customStrategies and strategies maps
    const deletedFromCustom = this.customStrategies.delete(id);
    const deletedFromStrategies = this.strategies.delete(id);
    if (deletedFromCustom || deletedFromStrategies) {
      this.cacheInvalidated = true;
    }
    return deletedFromCustom;
  }

  private initializeDefaultStrategies() {
    // Add some default strategies if none exist
    if (this.strategies.size === 0) { // Changed from .length === 0 to .size === 0 for Map
      const defaultStrategies: Strategy[] = [
        // RECOMMENDATIONS SECTION
        {
          id: "rec-automatic-savings-rrsp-tfsa",
          title: "Implement Automatic Savings Program",
          description: "Set up automated contributions to RRSP and TFSA accounts",
          category: "Recommendations",
          section: "recommendations",
          content: "Once your assets have transferred to TD Wealth and the recommended portfolio changes are complete, we can implement an automatic savings program to each of your RRSPs and TFSAs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-portfolio-changes-savings",
          title: "Portfolio Changes and Automated Savings",
          description: "Implement portfolio changes with automatic contribution plan",
          category: "Recommendations",
          section: "recommendations",
          content: "With your approval, we will implement the recommended portfolio changes and set up an automatic savings program to each of your RRSPs and TFSAs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-resp-documents",
          title: "RESP Account Documentation",
          description: "Provide required documents to open RESP account",
          category: "Recommendations",
          section: "recommendations",
          content: "Provide the children’s birth certificates and SINs to open an RESP account.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-monthly-contribution-plan",
          title: "Monthly Contribution Plan Setup",
          description: "Establish regular contribution and investment plan",
          category: "Recommendations",
          section: "recommendations",
          content: "Set up a monthly contribution plan with a systematic investment plan.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-business-structure-consultation",
          title: "Business Structure Consultation",
          description: "Review optimal business structure with advisors",
          category: "Recommendations",
          section: "recommendations",
          content: "Consult your tax and legal advisors to determine the most appropriate business structure.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-business-succession-advisor",
          title: "Business Succession Planning",
          description: "Meet with succession advisor for business strategies",
          category: "Recommendations",
          section: "recommendations",
          content: "I would like to introduce you to a TD Wealth Business Succession Advisor to discuss strategies tailored to your circumstances.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-major-purchase-savings",
          title: "Major Purchase Savings Plan",
          description: "Implement savings plan for large purchase",
          category: "Recommendations",
          section: "recommendations",
          content: "Implement a savings plan toward your major purchase goal.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-meet-specialist",
          title: "Meet with Specialist",
          description: "Consultation with financial specialist",
          category: "Recommendations",
          section: "recommendations",
          content: "Meet with (NAME, BUSINESS). They will review your needs and provide suitable solutions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-tax-planning-review",
          title: "Tax Planning Strategy Review",
          description: "Discuss tax planning with specialist",
          category: "Recommendations",
          section: "recommendations",
          content: "I would like to introduce you to (NAME, BUSINESS) to review and discuss your tax planning strategies.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-asset-consolidation",
          title: "Asset Consolidation",
          description: "Consolidate assets for better control and efficiency",
          category: "Recommendations",
          section: "recommendations",
          content: "Consider consolidating your assets to gain greater control and flexibility, enhance diversification, and improve tax efficiency.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-charitable-donation",
          title: "Complete Charitable Donation",
          description: "Process donation of securities to charity",
          category: "Recommendations",
          section: "recommendations",
          content: "Complete the process to donate the selected (SHARES/UNITS) to the charitable organization of your choice.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-insurance-review",
          title: "Insurance Options Review",
          description: "Review insurance coverage needs",
          category: "Recommendations",
          section: "recommendations",
          content: "Meet with (NAME, BUSINESS) to review your insurance options.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-will-poa-review",
          title: "Will and Power of Attorney Review",
          description: "Update estate planning documents",
          category: "Recommendations",
          section: "recommendations",
          content: "Schedule a meeting with your lawyer to ensure your respective Wills and Powers of Attorney for Property and Personal Care are drafted and reflect your current intentions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-charitable-giving-follow-up",
          title: "Charitable Giving Follow-up",
          description: "Schedule meeting to discuss charitable goals",
          category: "Recommendations",
          section: "recommendations",
          content: "After reviewing this information, we can schedule a follow-up meeting to discuss your charitable giving goals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-estate-documentation-review",
          title: "Periodic Estate Documentation Review",
          description: "Regular review of estate documents",
          category: "Recommendations",
          section: "recommendations",
          content: "Review your estate documentation periodically to ensure your wishes reflect your current circumstances.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-td-liquidator",
          title: "Corporate Liquidator Consideration",
          description: "Consider TD Canada Trust as estate liquidator",
          category: "Recommendations",
          section: "recommendations",
          content: "Consider appointing TD Canada Trust as liquidator or co‑liquidator to guide you through the estate settlement process. We can arrange a brief meeting with a specialist to explore your options.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-cross-border-specialist",
          title: "Cross-Border Tax and Estate Specialist",
          description: "Consult specialist for cross-border matters",
          category: "Recommendations",
          section: "recommendations",
          content: "Consider meeting with a cross‑border tax and estate specialist to discuss your situation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "rec-plan-assumptions",
          title: "Plan Assumptions Modification",
          description: "Review modified assumptions in financial plan",
          category: "Recommendations",
          section: "recommendations",
          content: "Within your plan (insert plan name if a What‑If), we modified the (insert field name) from the default assumptions as follows: (detail the assumption used in the plan and supporting information).",
          inputFields: [],
          isCustom: false
        },

        // BUILDING NET WORTH SECTION
        {
          id: "bnw-investment-profile",
          title: "Investment Profile Selection",
          description: "Determine appropriate investment product and profile",
          category: "Objectives",
          section: "buildNetWorth",
          content: "We discussed your investment profile(s) and determined that we will invest your (insert account) in a (insert profile) investment product. Repeat as needed for other accounts if different risk profiles apply.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-return-projections",
          title: "Projection Rate of Return",
          description: "Conservative rate assumptions for long-term goals",
          category: "Objectives",
          section: "buildNetWorth",
          content: "We used a (%) rate of return to project progress toward your (insert goal, e.g., retirement). This conservative, long‑term projection may differ from your stated investor profile. It does not represent actual performance and is not guaranteed. Repeat as needed for each goal.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-retirement-goals",
          title: "Retirement Income Goals",
          description: "Define retirement timeline and income targets",
          category: "Objectives",
          section: "buildNetWorth",
          content: "You would like to retire this year, and Client2 in three years, with an initial after‑tax income goal of $90,000 per year in today’s dollars. You are both Canadian citizens and residents of Quebec for income tax and estate purposes.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-qpp-planning",
          title: "Quebec Pension Plan (QPP) Strategy",
          description: "Optimize QPP benefit timing and amounts",
          category: "Objectives",
          section: "buildNetWorth",
          content: "The Quebec Pension Plan (QPP) is contributory; your retirement benefit depends on your contributions during your working years. When deciding when to begin receiving your QPP pension, consider life expectancy, other income sources, and your overall tax level now and in the future. Based on your latest statement, we used an entitlement of $$$ per month. For a more accurate projection, contact Retraite Québec for your Statement of Participation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-qpp-current-benefits",
          title: "Current QPP Entitlements",
          description: "Track current QPP benefits received",
          category: "Objectives",
          section: "buildNetWorth",
          content: "You are currently receiving Quebec Pension Plan (QPP) benefits totaling $XXX per year.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-oas-planning",
          title: "Old Age Security (OAS) Strategy",
          description: "Maximize OAS benefits and minimize clawback",
          category: "Objectives",
          section: "buildNetWorth",
          content: "Old Age Security (OAS) is available to most Canadian residents age 65 and older. OAS is income‑tested; benefits are reduced once your net income exceeds a threshold ($90,997 for 2024, indexed annually). Above the threshold, OAS is clawed back at 15 cents per dollar. We have included a 100% OAS entitlement for each of you starting at age 65, and the plan will reflect any clawback in applicable years.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-rregop-pension",
          title: "RREGOP Pension Benefits",
          description: "Track employer pension with cost-of-living adjustments",
          category: "Objectives",
          section: "buildNetWorth",
          content: "XXX has a RREGOP pension with benefits of $2,310 per month. Cost‑of‑living adjustments are estimated at 1.5%, aligned with current expectations.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-retirement-scenarios",
          title: "Additional Retirement Scenarios",
          description: "Multiple scenario planning for retirement",
          category: "Objectives",
          section: "buildNetWorth",
          content: "In addition to the \"Base Plan,\" we prepared three scenarios: \"Max retirement spending,\" \"Market crash and max spending,\" and \"Retire early.\"",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-sequence-risk",
          title: "Sequence of Returns Risk Mitigation",
          description: "Manage early retirement market downturn risk",
          category: "Objectives",
          section: "buildNetWorth",
          content: "Because investment income is a significant part of your retirement, a major market downturn early in retirement—\"sequence of returns risk\"—can make recovery more difficult as withdrawals can permanently erode capital. One mitigation strategy is to delay retirement, allowing continued contributions and fewer years for savings to support withdrawals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-real-estate-cushion",
          title: "Real Estate Equity as Financial Cushion",
          description: "Leverage property equity for retirement security",
          category: "Objectives",
          section: "buildNetWorth",
          content: "Our projections indicate you are on track to meet your retirement goal, assuming expected returns and spending remain within a reasonable range. In adverse market conditions that significantly affect portfolio performance, your real estate equity provides a financial cushion. If needed, you could access equity through downsizing, refinancing, or a reverse mortgage to support retirement income without compromising long‑term stability.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bnw-scenario-modeling",
          title: "Retirement Scenario Modeling",
          description: "Prepare for various retirement outcomes",
          category: "Objectives",
          section: "buildNetWorth",
          content: "To help you prepare for a range of retirement outcomes, we modeled three scenarios reflecting varying market conditions and spending patterns: the base scenario (including all recommendations), a market crash scenario, and a maximum sustainable spending scenario.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR RETIREMENT (Subsection of Building Net Worth)
        {
          id: "ret-qpp-timing",
          title: "QPP Collection Timing Strategy",
          description: "Optimize when to start collecting QPP benefits",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "Because you will draw from your registered accounts (RRSP/LRSP) first, consider starting QPP at age 65, or delaying to age 72 to maximize benefits, rather than taking it immediately at retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-tfsa-contributions",
          title: "TFSA Maximization Strategy",
          description: "Maximize tax-free savings account contributions",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "(CLIENT 1, CLIENT 2), we recommend you (CONTINUE/START) maximizing annual TFSA contributions of $6,500 each until retirement. TFSA growth is tax‑free, and withdrawals are tax‑free if funds are needed.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-rrsp-contributions",
          title: "RRSP Contribution Strategy",
          description: "Maximize retirement savings through RRSP",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "We recommend that you (BOTH) continue contributing (THE MAXIMUM/$ AMOUNT) to your RRSP each year until retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-conservative-approach",
          title: "Conservative Retirement Investment Strategy",
          description: "Adjust investment profile for retirement stage",
          category: "Retirement Planning",
          section: "buildNetWorth",
          subsection: "Planning for Retirement",
          content: "During retirement, a slightly more conservative investment approach may be appropriate. We recommend a (NAME OF PORTFOLIO) profile during retirement and have reduced projected returns accordingly.",
          inputFields: [],
          isCustom: false
        },

        // PAYING DOWN DEBT (Subsection of Building Net Worth)
        {
          id: "debt-no-outstanding",
          title: "No Outstanding Property Debt",
          description: "Current debt-free status on properties",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "You have no outstanding debts on your properties. If additional liquidity is needed in retirement, consider a reverse mortgage to access home equity without selling.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-consolidation",
          title: "Debt Consolidation Strategy",
          description: "Reduce borrowing costs through consolidation",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "Based on our discussions, we recommend consolidating outstanding debts to reduce borrowing costs and monthly payments.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-mortgage-acceleration",
          title: "Mortgage Payment Acceleration",
          description: "Increase payments to clear mortgage before retirement",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "Increase your mortgage payments by (x) to ensure it is fully paid before retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-liability-consolidation-detailed",
          title: "Detailed Liability Consolidation",
          description: "Lower interest rates and redirect savings",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "After reviewing your liabilities, consider consolidating them to lower your overall interest rate and accelerate repayment. If implemented, we will update your plan to maintain accurate projections. If consolidation reduces monthly payments, direct the difference to monthly savings to increase progress toward your goals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "debt-automated-savings",
          title: "Automated Monthly Contribution Plan",
          description: "Increase savings through systematic contributions",
          category: "Debt Management",
          section: "buildNetWorth",
          subsection: "Paying Down Debt",
          content: "To increase overall savings, implement a monthly contribution plan. Automation simplifies management, supports consistent saving, and enables systematic investing (dollar‑cost averaging). We can adjust frequency or amount as needed, or pause contributions if necessary.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR EDUCATION (Subsection of Building Net Worth)
        {
          id: "edu-resp-setup",
          title: "RESP Account Setup and Strategy",
          description: "Government-assisted education savings plan",
          category: "Education Planning",
          section: "buildNetWorth",
          subsection: "Planning for Education",
          content: "Open a Registered Education Savings Plan (RESP), a government‑assisted plan with tax‑deferred growth and contribution matching. As you already have an RESP, set up an automated savings and systematic investment plan to simplify management and support your goal.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "edu-resp-grandparents",
          title: "Grandparent RESP Considerations",
          description: "Important factors for grandparent-opened RESPs",
          category: "Education Planning",
          section: "buildNetWorth",
          subsection: "Planning for Education",
          content: "Grandparents may open an RESP; however, if the child does not attend post‑secondary education and the grandparents are over 71, they may not be able to transfer funds to their RRSP. It may be preferable for parents to open the RESP, with grandparents providing funds or considering alternative savings options.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR BUSINESS OWNERS (Subsection of Building Net Worth)
        {
          id: "bus-estate-freeze",
          title: "Business Estate Freeze Strategy",
          description: "Freeze business value for estate purposes",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "Consider implementing an estate freeze on your business interests. This would allow other family members to become shareholders—directly or through a family trust—with future growth accruing to the new shares. Your interest would remain \"frozen\" at its current value for estate purposes.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-succession-plan",
          title: "Business Succession Planning",
          description: "Develop comprehensive succession strategy",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "Develop a business succession plan. Consider engaging a consultant/facilitator to communicate the plan to family members, assess feasibility, professionalize the business, and prepare for management and ownership transitions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-shareholders-agreement",
          title: "Shareholders' Agreement",
          description: "Define duties and obligations of shareholders",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A shareholders' agreement defines the duties and obligations of shareholders in a private corporation and sets rules for specific circumstances. As (INSERT NAME OF COMPANY) does not have one, meet with your corporate lawyer/Quebec notary to draft it.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-shareholders-review",
          title: "Shareholders' Agreement Review",
          description: "Review buy-sell provisions in agreement",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "Review your shareholders' agreement to determine whether a mechanism exists to transfer shares—typically a buy‑sell provision.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-valuation",
          title: "Business Valuation and Sale Structure",
          description: "Determine business value and transition plan",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "Consult your accountant or a business valuator to determine the value of your business and, if feasible, outline how to structure an eventual sale or transition.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-corporate-lawyer",
          title: "Corporate Legal Assistance",
          description: "Legal support for business documents and transfers",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A corporate lawyer can assist with drafting and updating corporate documents, revising organizational documents, creating companies to implement tax planning, and drafting or reviewing agreements related to ownership transfers.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "bus-intermediary",
          title: "Business Intermediary Services",
          description: "Prepare business for sale and maximize value",
          category: "Business Planning",
          section: "buildNetWorth",
          subsection: "Planning for Business Owners",
          content: "A business intermediary can recommend steps to prepare your business for sale and help maximize the value of proceeds from ownership transfer.",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR LARGE PURCHASE/EVENT (Subsection of Building Net Worth)
        {
          id: "purchase-savings-plan",
          title: "Large Purchase Savings Strategy",
          description: "Systematic savings toward major purchase goal",
          category: "Major Purchase",
          section: "buildNetWorth",
          subsection: "Planning for Large Purchase or Event",
          content: "Save (X$) per month toward your goal, directing savings to your (ACCOUNT TYPE) account.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "purchase-financing",
          title: "Purchase Financing Options",
          description: "Explore borrowing options for major purchase",
          category: "Major Purchase",
          section: "buildNetWorth",
          subsection: "Planning for Large Purchase or Event",
          content: "If you may need a (LOAN/MORTGAGE) to complete the purchase, meet with our colleague (NAME, BUSINESS) to discuss borrowing options.",
          inputFields: [],
          isCustom: false
        },

        // IMPLEMENTING TAX-EFFICIENT STRATEGIES - OBJECTIVES
        {
          id: "tax-liability-review",
          title: "Liability Interest Rate Review",
          description: "Assess debt reduction and payment strategies",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You would like to review your liabilities to determine whether interest can be reduced and/or payments increased to repay debt sooner.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-comprehensive-approach",
          title: "Comprehensive Tax Planning Approach",
          description: "Multi-strategy tax burden reduction",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "As part of our tax planning approach, we aim to implement strategies to reduce your tax burden, including building a tax‑efficient portfolio, optimizing registered account contributions, structuring income sources, income splitting, prescribed loans, pension sharing, and the potential use of trusts.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-additional-savings",
          title: "Additional Savings Direction",
          description: "Optimize allocation of increased savings",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You are comfortable increasing savings and would like guidance on the most effective allocation.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-efficient-portfolio",
          title: "Tax-Efficient Portfolio Building",
          description: "Explore tax-saving opportunities",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You are interested in building a tax‑efficient portfolio and would like to explore strategies to reduce tax liability and identify opportunities.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-account-growth",
          title: "Tax Consequences of Account Growth",
          description: "Best-in-class tax efficient portfolio",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "As your accounts grow, it becomes especially important to be mindful of tax consequences. Marc will help you build a best‑in‑class, tax‑efficient portfolio.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-non-reg-tfsa",
          title: "Non-Registered to TFSA Opportunity",
          description: "Transfer strategy for tax optimization",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You hold significant assets in a non-registered account and have not yet maximized your TFSA contributions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-family-liability",
          title: "Family Tax Liability Reduction",
          description: "Strategies to reduce overall family tax",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You would like to explore strategies to reduce your family’s overall tax liability.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-charitable-donations-annual",
          title: "Annual Charitable Donations",
          description: "Track and optimize charitable giving",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You donate approximately $XXX annually to various organizations.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-charitable-cash-donations",
          title: "Regular Cash Charitable Donations",
          description: "Cash donation tracking",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You make regular cash donations to various charitable organizations.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-tfsa-gaps",
          title: "TFSA Contribution Room Gaps",
          description: "Identify TFSA optimization opportunities",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "You do not own any TFSAs and have not maximized contributions. TFSA contribution room cannot be transferred to a spouse.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-asset-consolidation-clarity",
          title: "Asset Consolidation for Clarity",
          description: "Improve wealth management through consolidation",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "Consolidating your assets into fewer institutions can significantly improve the clarity and efficiency of your overall wealth management. It simplifies tracking, reduces administrative complexity, and makes it easier to implement cohesive strategies around retirement income, tax optimization, and estate planning. A more unified view of your portfolio also helps your advisors coordinate better, ensuring that nothing is overlooked and that your goals remain aligned over time.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "tax-spousal-coordination",
          title: "Spousal Financial Coordination",
          description: "Integrated planning for both spouses",
          category: "Tax Planning Objectives",
          section: "implementingTaxStrategies",
          content: "When only one spouse’s finances are visible, fully integrated retirement, tax, and estate strategies are limited. Consolidating and coordinating across both spouses simplifies management and enables more precise planning—from income splitting to minimizing estate taxes and optimizing withdrawals—enhancing long‑term outcomes for both partners.",
          inputFields: [],
          isCustom: false
        },

        // OPTIMIZE CASH FLOW (Subsection of Implementing Tax-Efficient Strategies)
        {
          id: "cashflow-private-banking",
          title: "TD Wealth Private Banking Services",
          description: "Sophisticated banking for complex needs",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Speak with a TD Wealth Private Banker. TD Wealth Private Banking provides integrated, personalized banking services for clients with sophisticated needs, focusing on economical, flexible, and convenient credit solutions.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-spousal-coordination",
          title: "Spousal Income Strategy Coordination",
          description: "Enhanced retirement income through coordination",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Although this plan is prepared for you individually, many retirement income strategies are enhanced when coordinated with a spouse. Income splitting, pension sharing, and optimizing withdrawal timing can improve after‑tax income for couples. While not included here, these remain important considerations for broader planning.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-income-splitting",
          title: "Income Splitting Strategies",
          description: "Multiple methods to split income with family",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Splitting income with family members in lower marginal tax brackets can reduce your family’s overall tax burden. Consider:\n\n- Contribute to a spousal RRSP – If you are taxed at a higher marginal rate than your spouse (SPOUSE NAME), contributing to a spousal RRSP allows you to claim the deduction (assuming sufficient room), while (SPOUSE NAME) is taxed on future withdrawals, presumably at a lower rate. Be aware of attribution rules: if (SPOUSE NAME) withdraws funds in the same calendar year you contribute or in either of the next two years, the income may attribute back to you.\n\n- Elect pension income splitting – You may shift part of eligible pension income to your spouse to be taxed at their lower rate. If the recipient is under 65, only certain types (e.g., lifetime annuity payments from a registered pension plan) may be split; RRIF distributions generally cannot be split before age 65.\n\n- Use an income‑on‑income strategy – When the higher‑income spouse gifts funds to the lower‑income spouse for investment, income generally attributes back to the higher‑income spouse. However, income earned on reinvested income (\"second‑generation income\") does not attribute. Track and invest reinvested income separately to preserve this treatment.\n\n- Consider a prescribed rate loan – When prescribed interest rates are low (currently 2%), loans at the prescribed rate between related persons are not subject to attribution. If expected returns exceed the rate, the higher‑income spouse can lend to the lower‑income spouse and charge the prescribed interest annually to avoid attribution. Returns above interest are then taxed in the lower‑income spouse’s hands.\n\n- Share CPP/QPP credits – The CPP/QPP program allows married or common‑law couples to share CPP/QPP credits earned during their contributory period to balance benefits and potentially reduce tax.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-company-withdrawals",
          title: "Tax-Efficient Corporate Withdrawals",
          description: "Salary vs dividends optimization",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Consider the most tax‑efficient way to withdraw funds from your company(ies). Salary creates RRSP room and CPP benefits and is deductible to the company but taxed at your marginal rate. Dividends do not create RRSP room or CPP benefits and are not deductible to the company, but are generally taxed to you at lower rates.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-corporate-accounts",
          title: "Corporate Account Optimization",
          description: "CDA and RDTOH utilization",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Consult your accountant on how best to use the Capital Dividend Account (CDA) and Refundable Dividend Tax on Hand (RDTOH) balances within your corporate shareholdings.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-in-kind-donations",
          title: "In-Kind Securities Donations",
          description: "Eliminate capital gains tax on charitable gifts",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Consider donating publicly traded securities, mutual funds, or segregated funds in‑kind to charity, as capital gains on donated securities are not taxable.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-securities-charity",
          title: "Donate Appreciated Securities to Charity",
          description: "Zero capital gains inclusion on charitable donations",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Because you hold appreciated publicly traded securities in your non‑registered account, donating them to charity can eliminate the capital gains inclusion rate and provide a charitable receipt to reduce income tax.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "cashflow-non-reg-tax-efficiency",
          title: "Non-Registered Account Tax Structuring",
          description: "Structure investments for tax efficiency",
          category: "Cash Flow Optimization",
          section: "implementingTaxStrategies",
          subsection: "Optimize Cash Flow",
          content: "Because part of your portfolio is held in a non‑registered account, tax‑efficient structuring is especially important. Danny can help structure holdings to reduce unnecessary taxation and support your long‑term goals.",
          inputFields: [],
          isCustom: false
        },

        // RETIREMENT INCOME PLANNING (Subsection of Implementing Tax-Efficient Strategies)
        {
          id: "ret-income-conversion",
          title: "Retirement Product Conversion",
          description: "Convert savings to income products",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "Based on our analysis, convert your retirement savings products to retirement income products at age (X) and begin minimum withdrawals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-younger-spouse",
          title: "Use Younger Spouse Age for RRIF",
          description: "Reduce minimum payments using spouse's age",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "When converting to a retirement income product, use your younger spouse’s birthdate to reduce the annual minimum payment if you do not need the funds to meet spending needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-rrif-to-tfsa",
          title: "RRIF to TFSA Transfer Strategy",
          description: "Optimize RRIF withdrawals to TFSA",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "We recommend transferring money from XXX’s RRIF to his TFSA. TFSA growth and withdrawals are tax‑free. Based on our projections, you can withdraw $XXXX above the RRIF minimum and contribute it to the TFSA. We selected this amount using projected income and tax brackets; consult your accountant for the precise amount that minimizes overall taxes.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-insurance-proceeds",
          title: "Life Insurance Proceeds Allocation",
          description: "Optimal allocation of insurance benefits",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "We recommend contributing life insurance proceeds to XXX’s TFSA and allocating the remainder to a non‑registered account.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-rrif-rollover",
          title: "RRIF Rollover and Tax Management",
          description: "Manage RRIF estate taxation",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "XXX’s RRIF will roll over to YYY on a tax‑deferred basis. RRIFs passing through the estate are fully taxable. To limit taxes, transfer XXX in addition to your minimum payment to your non‑registered account. Non‑registered accounts may receive preferential tax treatment.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "ret-income-withdrawal-procedure",
          title: "Tax-Efficient Withdrawal Procedure",
          description: "Three-step withdrawal strategy",
          category: "Retirement Income",
          section: "implementingTaxStrategies",
          subsection: "Retirement Income Planning",
          content: "Cash management is important as you transition to a new life stage. Follow this procedure for tax‑efficient withdrawals.\n\nStep 1 Determine after‑tax income from recurring sources, such as:\n- Retirement income (from employer‑sponsored plans)\n- Government benefits, such as CPP and OAS (if applicable)\n- Mandatory withdrawals from registered plans (RRSP, RRIF), if applicable\n- Income from non‑registered accounts\n- Other income (e.g., rental)\n\nStep 2 If expenses exceed the sources above, withdraw from investment accounts to cover the difference. Generally, draw first from the least‑taxed accounts:\n- Capital from non‑registered accounts, prioritizing investments with the smallest unrealized gains\n- TFSA withdrawals. In your case, it is advantageous to avoid TFSA withdrawals due to their tax‑free nature for the estate\n\nStep 3 If needed, use less tax‑efficient or fully taxable sources, such as lump‑sum RRSP or RRIF/LIF withdrawals.\n\nRecommendations Convert your RRSP/LIRA to a RRIF/LIF at age 71 and take the minimum payments. Combined with pensions and government benefits, this should meet your needs. Consult your tax advisor to tailor the strategy.",
          inputFields: [],
          isCustom: false
        },

        // PROTECTING WHAT MATTERS - OBJECTIVES
        {
          id: "protect-insurance-foundation",
          title: "Insurance as Financial Foundation",
          description: "Essential protection for family security",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Insurance is a foundational component of a comprehensive financial plan, protecting against unforeseen events that could impact your family’s financial security. Life, critical illness, and disability coverage can help ensure your goals remain on track. While this report does not include a detailed insurance analysis, we encourage further review. We can connect you with TD Insurance Specialists to ensure coverage aligns with your objectives and risk profile.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-life-insurance-benefits",
          title: "Life Insurance Benefits Overview",
          description: "Key advantages of life insurance protection",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Consider the advantages of life insurance as part of your plan to accumulate and transfer assets tax‑efficiently. Benefits include:\n- Income replacement in the event of premature death\n- Liquidity in your estate to fund tax liabilities\n- A tax‑efficient strategy to transfer assets to beneficiaries",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-estate-erosion",
          title: "Estate Value Erosion Factors",
          description: "Understanding estate costs and taxes",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Upon death, estate value may be reduced by:\n- Income taxes payable at death (deemed disposition of assets; taxes on unrealized gains and on RRSP/RRIF balances if not transferred to a qualifying beneficiary, such as a surviving spouse/partner)\n- Legal fees to settle the estate\n- Debt repayment\n- Funeral costs",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-estate-erosion-coverage",
          title: "Estate Erosion Coverage Strategy",
          description: "Liquidation vs life insurance for estate costs",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Estate erosion can be addressed by liquidating estate assets or by using life insurance.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-insurance-in-place",
          title: "Current Insurance Coverage Review",
          description: "Existing coverage and beneficiaries reviewed",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Based on our conversation, your insurance coverage is in place and beneficiary designations have been reviewed.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-insurance-needs-review",
          title: "Insurance Needs Assessment",
          description: "Determine adequate coverage for objectives",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You would like to review your current insurance policies to determine whether they adequately cover your needs. Your primary objective is to (REPLACE INCOME/PLAN FOR ESTATE/TAX‑SHELTER FUNDS).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-emergency-funds-adequate",
          title: "Adequate Emergency Funds",
          description: "Prepared for unexpected situations",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You indicated that you have adequate funds available for unexpected situations that could impact income or your ability to earn for a short period.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-emergency-funds-concern",
          title: "Emergency Fund Gap",
          description: "Need for short-term emergency coverage",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "Based on our discussions, you do not currently have an emergency fund and are concerned about the impact a short‑term event could have on your cash flow.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-disability-review",
          title: "Disability Insurance Review",
          description: "Assess coverage for work disability",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You would like to review your insurance policies to determine if your coverage is adequate in the event of a disability affecting your ability to work in the short or long term.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-critical-illness",
          title: "Critical Illness Insurance Information",
          description: "Explore critical illness coverage options",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You do not currently have critical illness insurance and would like more information on available benefits and options.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-insurance-declined",
          title: "Insurance Analysis Declined",
          description: "No current insurance review requested",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You have declined an insurance needs analysis at this time. You are comfortable with your current situation and understand a review is available if you wish to revisit this later.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "protect-life-insurance-epa",
          title: "Life Insurance Needs with EPA",
          description: "Detailed life insurance review",
          category: "Protection Objectives",
          section: "protectingWhatMatters",
          content: "You would like to review your life insurance needs in detail with EPA. Your primary objective is income replacement (or estate planning).",
          inputFields: [],
          isCustom: false
        },

        // PLANNING FOR UNCERTAINTY (Subsection of Protecting What Matters)
        {
          id: "uncertainty-emergency-fund",
          title: "Emergency Fund Requirements",
          description: "3-6 months household income accessibility",
          category: "Risk Management",
          section: "protectingWhatMatters",
          subsection: "Planning for Uncertainty",
          content: "It is recommended to maintain easily accessible funds for emergencies or unexpected costs, typically 3–6 months of household income. We recommend a cash or bank account, or an unused line of credit. If using a line of credit, consider interest costs; a line secured by a home or investment property generally offers lower rates.",
          inputFields: [],
          isCustom: false
        },

        // INSURANCE (Subsection of Protecting What Matters)
        {
          id: "insurance-needs-analysis",
          title: "Life Insurance Needs Analysis",
          description: "Specialist consultation for coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Our analysis indicates you may need life insurance. We recommend speaking with a specialist from EPA for further details.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-employer-term",
          title: "Employer Term Life Insurance",
          description: "Coverage through employment",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 1 currently has employer‑provided term life insurance equal to one times salary, which will expire upon retirement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-permanent-and-term",
          title: "Permanent and Term Life Insurance Mix",
          description: "Combined insurance coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 1 has permanent life insurance with combined death benefits of approximately $100,000 and personal term life insurance with combined death benefits of approximately $200,000.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-no-coverage",
          title: "No Current Life Insurance",
          description: "Client without coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 2 currently does not have life insurance.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-personal-term",
          title: "Personal Term Life Insurance",
          description: "Individual term coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 2 has a personal term life insurance policy with a $XX death benefit.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-employer-and-personal",
          title: "Employer and Personal Term Coverage",
          description: "Combined employer and personal insurance",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 2 has employer‑provided term life insurance of approximately two times salary and a personal term policy with a $XX million death benefit.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-joint-second-to-die",
          title: "Joint Second-to-Die Participating Policy",
          description: "Permanent joint insurance coverage",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Client 1 & 2 also have a joint second‑to‑die participating life insurance policy. The estimated death benefit is $3 million, assuming the current dividend scale less 1%.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-sufficient-coverage",
          title: "Sufficient Insurance Coverage",
          description: "Adequate coverage for identified needs",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Based on the information provided, our current analysis indicates you may have sufficient insurance to cover your identified needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-policy-reviews",
          title: "Regular Policy Review Schedule",
          description: "Periodic insurance review guidelines",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Review whole life or universal policies annually, and term policies every three years or after significant life events.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-employer-policy-review",
          title: "Employer Policy Review",
          description: "Understand employer coverage details",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Review employer policies to understand eligibility, waiting periods, and tax treatment of benefits, and to confirm they meet your needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-critical-illness",
          title: "Critical Illness Insurance",
          description: "Lump-sum tax-free payment for critical illness",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "Critical illness insurance can provide a lump‑sum, tax‑free payment 30 days after diagnosis of a covered condition. This can assist with household bills, debts, or medical costs. Payment is based on diagnosis and is payable during the insured person’s life; if the individual dies after receiving the funds, there is no repayment. Meet with our insurance specialist to assess whether your coverage meets your needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "insurance-permanent-never-money",
          title: "Permanent Insurance for Never Money",
          description: "Tax-efficient wealth transfer strategy",
          category: "Insurance Coverage",
          section: "protectingWhatMatters",
          subsection: "Insurance",
          content: "For “never money”—capital you do not intend to spend—permanent life insurance can be an efficient wealth transfer strategy. It provides tax‑sheltered growth within limits, similar to a TFSA, moving funds from taxable to tax‑free. Some capital funds the policy; some may be invested tax‑sheltered inside it. On death, the benefit is paid tax‑free and probate‑free to beneficiaries. Given its unique tax structure, tax‑exempt life insurance can act as a “unique asset class” for building tax‑advantaged capital.",
          inputFields: [],
          isCustom: false
        },

        // LEAVING A LEGACY - OBJECTIVES
        {
          id: "legacy-estate-documentation",
          title: "Estate Documentation Status",
          description: "Review of will and power of attorney completion",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You indicated it is important to make things clear for your loved ones upon your passing. You (HAVE/HAVE NOT) completed your estate documentation (Wills, Powers of Attorney) (AND THEY REFLECT YOUR CURRENT WISHES/ BUT THEY WERE DRAFTED SOME TIME AGO).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-net-estate-value",
          title: "Net Estate Value Projection",
          description: "Future estate value and tax liability",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "Your net estate is expected to be approximately $XXXX in future dollars. See the Estate Summary report for projected values and taxes at death. Note: The Estate Summary does not include probate tax, if applicable in your province.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-minor-children-concern",
          title: "Managing Inheritance for Young Children",
          description: "Concerns about children inheriting young",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You expressed concern about how funds would be managed if your children inherited at a young age.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-beneficiary-outdated",
          title: "Outdated Beneficiary Designations",
          description: "Update required for insurance and accounts",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "Your beneficiary designations on life insurance (or RRSP/RRIF/TFSA) may not be up to date.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-charitable-giving-interest",
          title: "Charitable Giving at Scale",
          description: "Larger charitable giving consideration",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You would like to consider charitable giving on a larger scale or through your estate.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "legacy-specific-charity-support",
          title: "Specific Charity Support",
          description: "Continued support through estate",
          category: "Estate Planning Objectives",
          section: "leavingALegacy",
          content: "You enjoy supporting (insert charity) and would like to understand how to continue through your will, estate, or life insurance policies.",
          inputFields: [],
          isCustom: false
        },

        // DONATING TO CHARITY (Subsection of Leaving a Legacy)
        {
          id: "charity-insurance-beneficiary",
          title: "Update Insurance Beneficiaries for Charity",
          description: "Designate charity as life insurance beneficiary",
          category: "Charitable Giving",
          section: "leavingALegacy",
          subsection: "Donating to Charity",
          content: "We recommend updating life insurance beneficiaries to designate (insert charity).",
          inputFields: [],
          isCustom: false
        },
        {
          id: "charity-securities-donation",
          title: "Donate Securities to Eliminate Capital Gains",
          description: "Tax-efficient charitable giving through securities",
          category: "Charitable Giving",
          section: "leavingALegacy",
          subsection: "Donating to Charity",
          content: "We recommend donating (insert security) to (insert charity) to eliminate the unrealized capital gain and receive a charitable tax credit, while supporting a cause important to you.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "charity-estate-planning",
          title: "Charitable Giving in Estate Plan",
          description: "Legacy giving during lifetime or through estate",
          category: "Charitable Giving",
          section: "leavingALegacy",
          subsection: "Donating to Charity",
          content: "Consider incorporating charitable giving into your estate plan. Gifts during life or through your estate—such as via a donor‑advised fund like the Private Giving Foundation—can align your wealth with your values, reduce taxes, and ease the administrative burden on heirs.",
          inputFields: [],
          isCustom: false
        },

        // PASSING ON WEALTH (Subsection of Leaving a Legacy)
        {
          id: "wealth-will-poa-update",
          title: "Will and Power of Attorney Update",
          description: "Ensure documents reflect current objectives",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Speak with your legal representative to ensure your Wills reflect your current estate objectives. Also discuss your Powers of Attorney for Property and Personal Care to ensure appropriate provisions in the event of incapacity. Review these documents periodically or after major life events. You may also consider setting up a testamentary trust. Testamentary trusts are created by Will and become effective on death, allowing a trustee to manage property for beneficiaries and direct income and capital as specified.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-estate-doc-completed",
          title: "Estate Documentation Review Points",
          description: "Considerations for future updates",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "XXX, you have completed your estate documentation (Wills, Powers of Attorney). Consider the following for future updates:",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-estate-revision-considerations",
          title: "Estate Document Revision Considerations",
          description: "Key questions for liquidator selection",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Here are key considerations when revising estate documents:\n- Who should be liquidator or co‑liquidators?\n- Are they Canadian residents, local, younger, financially savvy, and trustworthy?\n- Do they have the expertise, time, and willingness to serve? Should a third party (e.g., a trust company) be named?",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-corporate-liquidator",
          title: "Corporate Liquidator Benefits",
          description: "Professional estate administration services",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "A corporate liquidator can provide high‑level expertise and facilitate estate settlement. If The Canada Trust Company is appointed, fees apply only when administration begins. A corporate liquidator offers impartiality, accountability, and responsibility and can handle the “heavy lifting” that family or friends may be unable or unwilling to do.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-asset-inventory",
          title: "Personal Asset Inventory",
          description: "Document personal items and joint assets",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Create an inventory of personal items and discuss how they will be distributed. Assets held jointly pass directly to the surviving owner. Assets with named beneficiaries pass outside the estate directly to the named individuals.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-testamentary-trust-reasons",
          title: "Testamentary Trust Benefits",
          description: "Control and protection through trusts",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "A testamentary trust can help maintain control over inheritances, particularly for beneficiaries who need assistance managing finances. Trusts may protect assets from beneficiaries’ creditors or spouses. Ensure any trustee is qualified, competent, and willing to carry out fiduciary duties.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-td-corporate-executor",
          title: "TD Private Trust as Corporate Executor",
          description: "Unburden family with professional executor",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Consider engaging TD Private Trust as a corporate executor to provide expertise and relieve family members—such as your brother Brian—of administrative burdens.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-private-trust-management",
          title: "TD Wealth Private Trust Management",
          description: "Professional trust administration",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "For individuals seeking streamlined trust management, TD Wealth Private Trust can ensure the trust is administered according to the testator’s wishes and the beneficiaries’ needs.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-estate-planning-specialist",
          title: "Estate Planning Specialist Consultation",
          description: "Corporate executor and testamentary trust options",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Meet with our Estate Planning colleague to discuss options, including a corporate executor and testamentary trusts (e.g., spousal trusts). A corporate executor can simplify and facilitate the estate settlement process.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-beneficiary-review",
          title: "Periodic Beneficiary Designation Review",
          description: "Avoid probate with proper designations",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Review beneficiary designations periodically to ensure they reflect your estate wishes. Where permitted, proper designations can expedite payouts and may avoid probate costs, if applicable.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-emergency-funds-estate",
          title: "Estate Emergency Funds",
          description: "Liquidity for surviving spouse during settlement",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "Ensure some emergency funds are available if one spouse passes away. Estate administration can be lengthy; an emergency fund helps the survivor meet day‑to‑day needs until settlement.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-us-citizen-estate",
          title: "US Citizen Estate Tax Planning",
          description: "Cross-border tax and estate considerations",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "As a U.S. citizen living in Canada, your spouse may be subject to both Canadian income tax at death (deemed disposition) and U.S. estate tax on worldwide assets. Review the estate plan with a cross‑border tax and estate specialist.",
          inputFields: [],
          isCustom: false
        },
        {
          id: "wealth-private-giving-foundation",
          title: "Private Giving Foundation Account",
          description: "Philanthropic goals through foundation",
          category: "Wealth Transfer",
          section: "leavingALegacy",
          subsection: "Passing on your Wealth",
          content: "You may consider fulfilling your philanthropic goals by establishing a Private Giving Foundation account. I have attached a brochure, which highlights the benefits of giving through the Private Giving Foundation. I recommend that you speak with your lawyer to ensure that your will reflects your desire to provide funds to a charitable organization at your death. You may also wish to speak with a tax advisor to determine if donating specific securities, rather than a $ amount, will help to offset other costs to the estate.",
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