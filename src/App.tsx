import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { OperatorDashboard } from './components/OperatorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { User, Transaction, FieldConfig, Material, PreRegisteredVehicle, Destination } from './types/weighbridge';
import { defaultFieldConfigs, defaultMaterials, defaultDestinations } from './data/mockData';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>(defaultFieldConfigs);
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials);
  const [preRegisteredVehicles, setPreRegisteredVehicles] = useState<PreRegisteredVehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>(defaultDestinations);
  const [indicatorConnected, setIndicatorConnected] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('jws-transactions');
    const savedFieldConfigs = localStorage.getItem('jws-field-configs');
    const savedMaterials = localStorage.getItem('jws-materials');
    const savedPreRegisteredVehicles = localStorage.getItem('jws-pre-registered-vehicles');
    const savedDestinations = localStorage.getItem('jws-destinations');
    
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      const transactionsWithDates = parsedTransactions.map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp)
      }));
      setTransactions(transactionsWithDates);
    }
    
    if (savedFieldConfigs) {
      setFieldConfigs(JSON.parse(savedFieldConfigs));
    }

    if (savedMaterials) {
      setMaterials(JSON.parse(savedMaterials));
    }

    if (savedPreRegisteredVehicles) {
      const parsedVehicles = JSON.parse(savedPreRegisteredVehicles);
      const vehiclesWithDates = parsedVehicles.map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp)
      }));
      setPreRegisteredVehicles(vehiclesWithDates);
    }

    if (savedDestinations) {
      setDestinations(JSON.parse(savedDestinations));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jws-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('jws-field-configs', JSON.stringify(fieldConfigs));
  }, [fieldConfigs]);

  useEffect(() => {
    localStorage.setItem('jws-materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('jws-pre-registered-vehicles', JSON.stringify(preRegisteredVehicles));
  }, [preRegisteredVehicles]);

  useEffect(() => {
    localStorage.setItem('jws-destinations', JSON.stringify(destinations));
  }, [destinations]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'ticketNumber' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      ticketNumber: `JWS-${Date.now()}`,
      timestamp: new Date()
    };

    // If this is a completion of a partial transaction, update the existing one
    if (transactionData.weight2 && transactionData.status === 'complete') {
      const existingTransactionIndex = transactions.findIndex(
        t => t.vehicleReg === transactionData.vehicleReg && t.status === 'partial'
      );
      
      if (existingTransactionIndex !== -1) {
        const updatedTransactions = [...transactions];
        updatedTransactions[existingTransactionIndex] = {
          ...updatedTransactions[existingTransactionIndex],
          weight2: transactionData.weight2,
          netWeight: transactionData.netWeight,
          status: 'complete',
          materialRate: transactionData.materialRate,
          totalValue: transactionData.totalValue,
          timestamp: new Date()
        };
        setTransactions(updatedTransactions);
        return;
      }
    }

    setTransactions(prev => [...prev, newTransaction]);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateFieldConfigs = (configs: FieldConfig[]) => {
    setFieldConfigs(configs);
  };

  const handleUpdateMaterials = (updatedMaterials: Material[]) => {
    setMaterials(updatedMaterials);
  };

  const handleUpdatePreRegisteredVehicles = (vehicles: PreRegisteredVehicle[]) => {
    setPreRegisteredVehicles(vehicles);
  };

  const handleUpdateDestinations = (updatedDestinations: Destination[]) => {
    setDestinations(updatedDestinations);
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={handleLogout}
        transactions={transactions}
        onDeleteTransaction={handleDeleteTransaction}
        fieldConfigs={fieldConfigs}
        onUpdateFieldConfigs={handleUpdateFieldConfigs}
        materials={materials}
        onUpdateMaterials={handleUpdateMaterials}
        preRegisteredVehicles={preRegisteredVehicles}
        onUpdatePreRegisteredVehicles={handleUpdatePreRegisteredVehicles}
        destinations={destinations}
        onUpdateDestinations={handleUpdateDestinations}
        indicatorConnected={indicatorConnected}
        onIndicatorStatusChange={setIndicatorConnected}
        onWeightUpdate={setCurrentWeight}
      />
    );
  }

  return (
    <OperatorDashboard
      user={currentUser}
      onLogout={handleLogout}
      transactions={transactions}
      onAddTransaction={handleAddTransaction}
      fieldConfigs={fieldConfigs}
      preRegisteredVehicles={preRegisteredVehicles}
      materials={materials}
      destinations={destinations}
      indicatorConnected={indicatorConnected}
      currentWeight={currentWeight}
    />
  );
}

export default App;