import React, { useState, useEffect } from 'react';
import { Transaction, User, FieldConfig, PreRegisteredVehicle, Material, Destination } from '../types/weighbridge';
import { Printer, LogOut, Scale, Usb, AlertCircle } from 'lucide-react';

interface OperatorDashboardProps {
  user: User;
  onLogout: () => void;
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'ticketNumber' | 'timestamp'>) => void;
  fieldConfigs: FieldConfig[];
  preRegisteredVehicles: PreRegisteredVehicle[];
  materials: Material[];
  destinations: Destination[];
  indicatorConnected: boolean;
  currentWeight: number | null;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  user,
  onLogout,
  transactions,
  onAddTransaction,
  fieldConfigs,
  preRegisteredVehicles,
  materials,
  destinations,
  indicatorConnected,
  currentWeight
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isNewVehicle, setIsNewVehicle] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeWeightField, setActiveWeightField] = useState<'weight1' | 'weight2'>('weight1');
  // Sort field configs by order
  const sortedFields = [...fieldConfigs].sort((a, b) => a.order - b.order);

  // Get all vehicle registrations for autocomplete
  const getAllVehicleRegs = () => {
    const transactionRegs = transactions.map(t => t.vehicleReg);
    const preRegRegs = preRegisteredVehicles.map(v => v.vehicleReg);
    return [...new Set([...transactionRegs, ...preRegRegs])];
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Handle vehicle registration autocomplete and auto-population
    if (fieldName === 'vehicleReg' && value) {
      // Show autocomplete suggestions
      const allRegs = getAllVehicleRegs();
      const filtered = allRegs.filter(reg => 
        reg.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);

      // Check for existing partial transaction
      const existingTransaction = transactions.find(
        t => t.vehicleReg === value && t.status === 'partial'
      );
      
      // Check for pre-registered vehicle
      const preRegistered = preRegisteredVehicles.find(
        v => v.vehicleReg === value
      );

      if (existingTransaction) {
        // Vehicle has partial transaction - populate all data including weight1
        setCurrentTransaction(existingTransaction);
        setIsNewVehicle(false);
        setFormData({
          vehicleReg: existingTransaction.vehicleReg,
          material: existingTransaction.material,
          destination: existingTransaction.destination,
          weight1: existingTransaction.weight1,
          weight2: ''
        });
      } else if (preRegistered) {
        // Vehicle is pre-registered - populate data and set weight1
        setCurrentTransaction(null);
        setIsNewVehicle(false);
        setFormData({
          vehicleReg: preRegistered.vehicleReg,
          material: preRegistered.material || '',
          destination: preRegistered.destination || '',
          weight1: preRegistered.weight1,
          weight2: ''
        });
      } else {
        // New vehicle - reset form and disable weight2
        setCurrentTransaction(null);
        setIsNewVehicle(true);
        setFormData({
          vehicleReg: value,
          material: '',
          destination: '',
          weight1: '',
          weight2: ''
        });
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleInputChange('vehicleReg', suggestion);
    setShowSuggestions(false);
  };

  // Determine which weight field should be active based on form state
  useEffect(() => {
    if (currentTransaction || (!isNewVehicle && formData.weight1)) {
      setActiveWeightField('weight2');
    } else {
      setActiveWeightField('weight1');
    }
  }, [currentTransaction, isNewVehicle, formData.weight1]);

  // Auto-update weight from indicator
  useEffect(() => {
    if (indicatorConnected && currentWeight !== null) {
      setFormData(prev => ({
        ...prev,
        [activeWeightField]: currentWeight.toString()
      }));
    }
  }, [currentWeight, activeWeightField, indicatorConnected]);

  const handlePrint = () => {
    const requiredFields = sortedFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.name]);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    // For new vehicles, weight2 should be disabled
    if (isNewVehicle && formData.weight2) {
      alert('For new vehicles, only Weight 1 can be recorded in the first transaction.');
      return;
    }

    // Get material rate for pricing
    const material = materials.find(m => m.name === formData.material);
    const materialRate = material?.pricePerUnit || 0;
    const netWeight = formData.weight2 ? Math.abs(parseFloat(formData.weight2) - parseFloat(formData.weight1)) : undefined;
    const totalValue = netWeight ? netWeight * materialRate : undefined;

    const transactionData = {
      vehicleReg: formData.vehicleReg,
      material: formData.material,
      destination: formData.destination,
      weight1: parseFloat(formData.weight1),
      weight2: formData.weight2 ? parseFloat(formData.weight2) : undefined,
      netWeight,
      operatorName: user.name,
      status: formData.weight2 ? 'complete' : 'partial',
      materialRate,
      totalValue
    } as Omit<Transaction, 'id' | 'ticketNumber' | 'timestamp'>;

    onAddTransaction(transactionData);
    printTicket(transactionData);
    
    // Reset form
    setFormData({});
    setCurrentTransaction(null);
    setIsNewVehicle(true);
  };

  const printTicket = (data: any) => {
    const printWindow = window.open('', '_blank');
    const ticketNumber = `JWS-${Date.now()}`;
    
    printWindow?.document.write(`
      <html>
        <head>
          <title>JWS Weighbridge Ticket</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .ticket { border: 2px solid #000; padding: 20px; max-width: 400px; }
            .header { text-align: center; margin-bottom: 20px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; }
            .pricing { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>JWS WEIGHBRIDGE</h2>
              <p>Ticket #: ${ticketNumber}</p>
              <p>Date: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="field">
              <span class="label">Vehicle Registration:</span> ${data.vehicleReg}
            </div>
            <div class="field">
              <span class="label">Material:</span> ${data.material}
            </div>
            <div class="field">
              <span class="label">Destination:</span> ${data.destination}
            </div>
            <div class="field">
              <span class="label">Weight 1:</span> ${data.weight1} kg
            </div>
            ${data.weight2 ? `
              <div class="field">
                <span class="label">Weight 2:</span> ${data.weight2} kg
              </div>
              <div class="field">
                <span class="label">Net Weight:</span> ${data.netWeight} kg
              </div>
              ${data.materialRate ? `
                <div class="pricing">
                  <div class="field">
                    <span class="label">Rate:</span> $${data.materialRate}/kg
                  </div>
                  <div class="field">
                    <span class="label">Total Value:</span> $${data.totalValue?.toFixed(2)}
                  </div>
                </div>
              ` : ''}
            ` : ''}
            
            <div class="footer">
              <p>Operator: ${data.operatorName}</p>
              <p>Status: ${data.status === 'complete' ? 'Complete' : 'Partial - Weight 2 Required'}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow?.document.close();
    printWindow?.print();
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] || '';
    const isDisabled = field.name === 'weight2' && isNewVehicle;
    
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required={field.required}
            disabled={isDisabled}
          >
            <option value="">Select {field.label}</option>
            {field.name === 'destination' ? (
              destinations.map(dest => (
                <option key={dest.id} value={dest.name}>{dest.name}</option>
              ))
            ) : field.name === 'material' ? (
              materials.map(material => (
                <option key={material.id} value={material.name}>{material.name}</option>
              ))
            ) : field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={`Enter ${field.label}`}
            required={field.required}
            step="0.01"
            disabled={isDisabled}
          />
        );
      default:
        return (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              onFocus={() => field.name === 'vehicleReg' && setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={`Enter ${field.label}`}
              required={field.required}
              disabled={isDisabled}
            />
            {field.name === 'vehicleReg' && showSuggestions && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Scale className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JWS Weighbridge</h1>
                <p className="text-sm text-gray-600">Operator Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Weighbridge Transaction</h2>
          
          {/* Weight Indicator Status */}
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Usb className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Weight Indicator Status</span>
                </div>
                <div className={`flex items-center space-x-2 ${indicatorConnected ? 'text-green-600' : 'text-red-600'}`}>
                  <div className={`w-3 h-3 rounded-full ${indicatorConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">{indicatorConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              {indicatorConnected && currentWeight !== null && (
                <div className="mt-3 bg-gray-50 rounded-md p-3">
                  <div className="text-sm text-gray-600 mb-1">Current Reading ({activeWeightField}):</div>
                  <div className="text-2xl font-bold text-gray-900">{currentWeight.toFixed(2)} kg</div>
                </div>
              )}
            </div>
          </div>
          
          {currentTransaction && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                Vehicle found with partial transaction - please enter Weight 2 to complete
              </p>
            </div>
          )}

          {!isNewVehicle && !currentTransaction && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Pre-registered vehicle detected - Weight 1 already recorded
              </p>
            </div>
          )}

          {isNewVehicle && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-medium">
                New vehicle - Weight 2 will be available after first transaction
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedFields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                  {field.name === 'weight2' && isNewVehicle && (
                    <span className="text-gray-500 text-xs ml-2">(Disabled for new vehicles)</span>
                  )}
                </label>
                {renderField(field)}
                {field.name === 'material' && formData.material && (
                  <div className="mt-1 text-sm text-green-600 font-medium">
                    {(() => {
                      const material = materials.find(m => m.name === formData.material);
                      return material ? `Rate: $${material.pricePerUnit.toFixed(2)}/${material.unit}` : '';
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5 mr-2" />
              Print Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};