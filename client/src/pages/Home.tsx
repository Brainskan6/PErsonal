import React from 'react';
import FinancialPlanningLayout from '../components/FinancialPlanningLayout';

export default function Home() {
  // For now, we'll show the landing page for everyone
  // The auth will be handled at the application level
  return <FinancialPlanningLayout />;
}