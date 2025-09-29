import { useState } from 'react';
import StrategyBank from '../StrategyBank';

export default function StrategyBankExample() {
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const handleStrategyToggle = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedStrategies(selectedIds);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <StrategyBank
        strategies={[]}
        selectedStrategies={selectedStrategies}
        onStrategyToggle={handleStrategyToggle}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}