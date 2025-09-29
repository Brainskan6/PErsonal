
import { useMemo } from 'react';

interface Strategy {
  id: string;
  title: string;
  description: string;
  content: string;
  section?: string;
}

interface CustomStrategy {
  id: string;
  title: string;
  content: string;
  section?: string;
}

interface UseFilteredStrategiesProps {
  strategies: Strategy[];
  customStrategies: CustomStrategy[];
  searchQuery: string;
  selectedSection: string;
}

export const useFilteredStrategies = ({
  strategies,
  customStrategies,
  searchQuery,
  selectedSection
}: UseFilteredStrategiesProps) => {
  const filteredBuiltInStrategies = useMemo(() => {
    return strategies.filter(strategy => {
      const matchesSearch = !searchQuery || 
        strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection = selectedSection === 'all' || strategy.section === selectedSection;
      
      return matchesSearch && matchesSection;
    });
  }, [strategies, searchQuery, selectedSection]);

  const filteredCustomStrategies = useMemo(() => {
    return customStrategies.filter(strategy => {
      const matchesSearch = !searchQuery || 
        strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        strategy.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection = selectedSection === 'all' || strategy.section === selectedSection;
      
      return matchesSearch && matchesSection;
    });
  }, [customStrategies, searchQuery, selectedSection]);

  return {
    filteredBuiltInStrategies,
    filteredCustomStrategies
  };
};
