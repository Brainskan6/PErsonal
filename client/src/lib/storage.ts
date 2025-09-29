// Client-side storage adapter that handles both localStorage and server persistence
import { queryClient, apiRequest } from "./queryClient";
import type { ClientData, CustomStrategy, Strategy } from "@shared/schema";

interface StorageAdapter {
  // Client data operations
  getClientData(): Promise<ClientData | null>;
  saveClientData(data: ClientData): Promise<void>;
  
  // Custom strategy operations
  getCustomStrategies(): Promise<CustomStrategy[]>;
  saveCustomStrategy(strategy: CustomStrategy): Promise<void>;
  deleteCustomStrategy(id: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  private readonly CLIENT_DATA_KEY = 'financial-planner-client-data';
  private readonly CUSTOM_STRATEGIES_KEY = 'financial-planner-custom-strategies';

  async getClientData(): Promise<ClientData | null> {
    const data = localStorage.getItem(this.CLIENT_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }

  async saveClientData(data: ClientData): Promise<void> {
    localStorage.setItem(this.CLIENT_DATA_KEY, JSON.stringify(data));
  }

  async getCustomStrategies(): Promise<CustomStrategy[]> {
    const data = localStorage.getItem(this.CUSTOM_STRATEGIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveCustomStrategy(strategy: CustomStrategy): Promise<void> {
    const strategies = await this.getCustomStrategies();
    const existingIndex = strategies.findIndex(s => s.id === strategy.id);
    
    if (existingIndex >= 0) {
      strategies[existingIndex] = strategy;
    } else {
      strategies.push(strategy);
    }
    
    localStorage.setItem(this.CUSTOM_STRATEGIES_KEY, JSON.stringify(strategies));
  }

  async deleteCustomStrategy(id: string): Promise<void> {
    const strategies = await this.getCustomStrategies();
    const filtered = strategies.filter(s => s.id !== id);
    localStorage.setItem(this.CUSTOM_STRATEGIES_KEY, JSON.stringify(filtered));
  }
}

class ServerStorageAdapter implements StorageAdapter {
  async getClientData(): Promise<ClientData | null> {
    try {
      const response = await fetch('/api/client-data/current', {
        credentials: 'include'
      });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error('Failed to fetch client data');
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch client data from server:', error);
      return null;
    }
  }

  async saveClientData(data: ClientData): Promise<void> {
    const response = await apiRequest('/api/client-data', 'POST', data);
    if (!response.ok) {
      throw new Error('Failed to save client data');
    }
  }

  async getCustomStrategies(): Promise<CustomStrategy[]> {
    try {
      const response = await fetch('/api/custom-strategies', {
        credentials: 'include'
      });
      if (response.status === 401) return [];
      if (!response.ok) throw new Error('Failed to fetch custom strategies');
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch custom strategies from server:', error);
      return [];
    }
  }

  async saveCustomStrategy(strategy: CustomStrategy): Promise<void> {
    const response = await apiRequest('/api/custom-strategies', 'POST', strategy);
    if (!response.ok) {
      throw new Error('Failed to save custom strategy');
    }
  }

  async deleteCustomStrategy(id: string): Promise<void> {
    const response = await apiRequest(`/api/custom-strategies/${id}`, 'DELETE');
    if (!response.ok) {
      throw new Error('Failed to delete custom strategy');
    }
  }
}

class HybridStorageAdapter implements StorageAdapter {
  private localAdapter = new LocalStorageAdapter();
  private serverAdapter = new ServerStorageAdapter();

  constructor(private isAuthenticated: boolean) {}

  async getClientData(): Promise<ClientData | null> {
    if (this.isAuthenticated) {
      // Try server first, fallback to local
      const serverData = await this.serverAdapter.getClientData();
      if (serverData) return serverData;
    }
    return await this.localAdapter.getClientData();
  }

  async saveClientData(data: ClientData): Promise<void> {
    if (this.isAuthenticated) {
      try {
        await this.serverAdapter.saveClientData(data);
        // Clear local storage after successful server save
        localStorage.removeItem('financial-planner-client-data');
        return;
      } catch (error) {
        // If server fails, show login prompt
        throw new AuthenticationRequiredError('Please sign in to save your data');
      }
    }
    
    // Save to local storage for anonymous users
    await this.localAdapter.saveClientData(data);
  }

  async getCustomStrategies(): Promise<CustomStrategy[]> {
    if (this.isAuthenticated) {
      const serverStrategies = await this.serverAdapter.getCustomStrategies();
      return serverStrategies;
    }
    return await this.localAdapter.getCustomStrategies();
  }

  async saveCustomStrategy(strategy: CustomStrategy): Promise<void> {
    if (this.isAuthenticated) {
      try {
        await this.serverAdapter.saveCustomStrategy(strategy);
        return;
      } catch (error) {
        throw new AuthenticationRequiredError('Please sign in to save custom strategies');
      }
    }
    
    await this.localAdapter.saveCustomStrategy(strategy);
  }

  async deleteCustomStrategy(id: string): Promise<void> {
    if (this.isAuthenticated) {
      try {
        await this.serverAdapter.deleteCustomStrategy(id);
        return;
      } catch (error) {
        throw new AuthenticationRequiredError('Please sign in to manage custom strategies');
      }
    }
    
    await this.localAdapter.deleteCustomStrategy(id);
  }

  // Migration method to move local data to server after login
  async migrateLocalDataToServer(): Promise<void> {
    if (!this.isAuthenticated) return;

    try {
      // Migrate client data
      const localClientData = await this.localAdapter.getClientData();
      if (localClientData) {
        await this.serverAdapter.saveClientData(localClientData);
        localStorage.removeItem('financial-planner-client-data');
      }

      // Migrate custom strategies
      const localStrategies = await this.localAdapter.getCustomStrategies();
      for (const strategy of localStrategies) {
        await this.serverAdapter.saveCustomStrategy(strategy);
      }
      localStorage.removeItem('financial-planner-custom-strategies');

      // Refresh queries to show server data
      await queryClient.invalidateQueries({ queryKey: ['/api/client-data/current'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/custom-strategies'] });
    } catch (error) {
      console.warn('Failed to migrate local data to server:', error);
    }
  }
}

export class AuthenticationRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationRequiredError';
  }
}

// Export the storage adapter factory
export function createStorageAdapter(isAuthenticated: boolean): HybridStorageAdapter {
  return new HybridStorageAdapter(isAuthenticated);
}

// Hook to use the storage adapter
import { useAuth } from '@/hooks/useAuth';

export function useStorage(): HybridStorageAdapter {
  const { isAuthenticated } = useAuth();
  return createStorageAdapter(isAuthenticated);
}