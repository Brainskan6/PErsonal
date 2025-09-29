import React from 'react';
import { useAuth } from '../hooks/useAuth';
import FinancialPlanningLayout from '../components/FinancialPlanningLayout';
import AuthForm from '../components/AuthForm';

export default function Home() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthForm />;
  }
  
  return <FinancialPlanningLayout />;
}