import React, { useState } from 'react';
import { Transaction, User, FieldConfig, Material, PreRegisteredVehicle, Destination } from '../types/weighbridge';
import { LogOut, Scale, FileText, Settings, Plus, Trash2, Edit3, DollarSign, Car, Download, Calendar, MapPin, Usb } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WeighbridgeIndicator } from './WeighbridgeIndicator';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  fieldConfigs: FieldConfig[];
  onUpdateFieldConfigs: (configs: FieldConfig[]) => void;
  materials: Material[];
  onUpdateMaterials: (materials: Material[]) => void;
  preRegisteredVehicles: PreRegisteredVehicle[];
  onUpdatePreRegisteredVehicles: (vehicles: PreRegisteredVehicle[]) => void;
  destinations: Destination[];
  onUpdateDestinations: (destinations: Destination[]) => void;
  indicatorConnected: boolean;
  onIndicatorStatusChange: (connected: boolean) => void;
  onWeightUpdate: (weight: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onLogout,
  transactions,
  onDeleteTransaction,
  fieldConfigs,
  onUpdateFieldConfigs,
  materials,
  onUpdateMaterials,
  preRegisteredVehicles,
  onUpdatePreRegisteredVehicles,
  destinations,
  onUpdateDestinations,
  indicatorConnected,
  onIndicatorStatusChange,
  onWeightUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'fields' | 'materials' | 'vehicles' | 'partial' | 'reports' | 'destinations' | 'indicator'>('transactions');
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text' as const,
    required: false,
    options: ''
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    unit: 'kg',
    pricePerUnit: 0
  });
  const [newVehicle, setNewVehicle] = useState({
    vehicleReg: '',
    material: '',
    destination: '',
    weight1: 0
  });
  const [newDestination, setNewDestination] = useState({
    name: ''
  });
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const partialTransactions = transactions.filter(t => t.status === 'partial');

  const handleAddField = () => {
    const field: FieldConfig = {
      id: Date.now().toString(),
      name: newField.name,
      label: newField.label,
      type: newField.type,
      required: newField.required,
      options: newField.options ? newField.options.split(',').map(s => s.trim()) : undefined,
      order: fieldConfigs.length + 1
    };

    onUpdateFieldConfigs([...fieldConfigs, field]);
    setNewField({ name: '', label: '', type: 'text', required: false, options: '' });
  };

  const handleUpdateField = (field: FieldConfig) => {
    const updatedConfigs = fieldConfigs.map(f => f.id === field.id ? field : f);
    onUpdateFieldConfigs(updatedConfigs);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      const updatedConfigs = fieldConfigs.filter(f => f.id !== fieldId);
      onUpdateFieldConfigs(updatedConfigs);
    }
  };

  const handleAddMaterial = () => {
    const material: Material = {
      id: Date.now().toString(),
      name: newMaterial.name,
      unit: newMaterial.unit,
      pricePerUnit: newMaterial.pricePerUnit
    };

    onUpdateMaterials([...materials, material]);
    setNewMaterial({ name: '', unit: 'kg', pricePerUnit: 0 });
  };

  const handleUpdateMaterial = (material: Material) => {
    const updatedMaterials = materials.map(m => m.id === material.id ? material : m);
    onUpdateMaterials(updatedMaterials);
    setEditingMaterial(null);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      const updatedMaterials = materials.filter(m => m.id !== materialId);
      onUpdateMaterials(updatedMaterials);
    }
  };

  const handleAddVehicle = () => {
    const vehicle: PreRegisteredVehicle = {
      id: Date.now().toString(),
      vehicleReg: newVehicle.vehicleReg,
      material: newVehicle.material || '',
      destination: newVehicle.destination || '',
      weight1: newVehicle.weight1,
      operatorName: user.name,
      timestamp: new Date()
    };

    onUpdatePreRegisteredVehicles([...preRegisteredVehicles, vehicle]);
    setNewVehicle({ vehicleReg: '', material: '', destination: '', weight1: 0 });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this pre-registered vehicle?')) {
      const updatedVehicles = preRegisteredVehicles.filter(v => v.id !== vehicleId);
      onUpdatePreRegisteredVehicles(updatedVehicles);
    }
  };

  const handleAddDestination = () => {
    const destination: Destination = {
      id: Date.now().toString(),
      name: newDestination.name
    };

    onUpdateDestinations([...destinations, destination]);
    setNewDestination({ name: '' });
  };

  const handleDeleteDestination = (destinationId: string) => {
    if (confirm('Are you sure you want to delete this destination?')) {
      const updatedDestinations = destinations.filter(d => d.id !== destinationId);
      onUpdateDestinations(updatedDestinations);
    }
  };

  const generatePDFReport = () => {
    if (!reportDateRange.startDate || !reportDateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const startDate = new Date(reportDateRange.startDate);
    const endDate = new Date(reportDateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include full end date

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('JWS Weighbridge Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);

    // Summary
    const completedTransactions = filteredTransactions.filter(t => t.status === 'complete');
    const totalValue = completedTransactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
    
    doc.text(`Total Transactions: ${filteredTransactions.length}`, 20, 55);
    doc.text(`Completed: ${completedTransactions.length}`, 20, 65);
    doc.text(`Partial: ${filteredTransactions.length - completedTransactions.length}`, 20, 75);
    doc.text(`Total Value: $${totalValue.toFixed(2)}`, 20, 85);

    // Table data
    const tableData = filteredTransactions.map(t => [
      t.ticketNumber,
      t.vehicleReg,
      t.material,
      t.destination,
      `${t.weight1} kg`,
      t.weight2 ? `${t.weight2} kg` : '-',
      t.netWeight ? `${t.netWeight} kg` : '-',
      t.status,
      t.totalValue ? `$${t.totalValue.toFixed(2)}` : '-',
      t.timestamp.toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [['Ticket #', 'Vehicle', 'Material', 'Destination', 'Weight 1', 'Weight 2', 'Net Weight', 'Status', 'Value', 'Date']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`JWS_Report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.pdf`);
  };

  const renderTransactionsTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Reg</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight 1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight 2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.ticketNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.vehicleReg}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.material}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.weight1} kg</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.weight2 ? `${transaction.weight2} kg` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.netWeight ? `${transaction.netWeight} kg` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${transaction.status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.totalValue ? `$${transaction.totalValue.toFixed(2)}` : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.timestamp.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button onClick={() => onDeleteTransaction(transaction.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPartialTransactionsTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Partial Transactions (Weight 1 Only)</h3>
        <p className="text-sm text-gray-600 mt-1">Vehicles waiting for Weight 2 measurement</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Reg</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight 1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partialTransactions.map((transaction) => (
              <tr key={transaction.id} className="bg-yellow-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.ticketNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{transaction.vehicleReg}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.material}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.weight1} kg</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.timestamp.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.operatorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {partialTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No partial transactions found
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate PDF Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={reportDateRange.startDate}
              onChange={(e) => setReportDateRange({...reportDateRange, startDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={reportDateRange.endDate}
              onChange={(e) => setReportDateRange({...reportDateRange, endDate: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={generatePDFReport}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );

  const renderMaterialsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Material</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Material Name"
            value={newMaterial.name}
            onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Unit (e.g., kg)"
            value={newMaterial.unit}
            onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Price per unit"
            value={newMaterial.pricePerUnit}
            onChange={(e) => setNewMaterial({...newMaterial, pricePerUnit: parseFloat(e.target.value)})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.01"
          />
        </div>
        <button
          onClick={handleAddMaterial}
          disabled={!newMaterial.name}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Material Pricing</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((material) => (
                <tr key={material.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${material.pricePerUnit.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingMaterial(material)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVehiclesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-register Vehicle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Vehicle Registration"
            value={newVehicle.vehicleReg}
            onChange={(e) => setNewVehicle({...newVehicle, vehicleReg: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={newVehicle.material}
            onChange={(e) => setNewVehicle({...newVehicle, material: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Material</option>
            {materials.map(material => (
              <option key={material.id} value={material.name}>{material.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Destination"
            value={newVehicle.destination}
            onChange={(e) => setNewVehicle({...newVehicle, destination: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Weight 1 (kg)"
            value={newVehicle.weight1}
            onChange={(e) => setNewVehicle({...newVehicle, weight1: parseFloat(e.target.value)})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.01"
          />
        </div>
        <button
          onClick={handleAddVehicle}
          disabled={!newVehicle.vehicleReg || !newVehicle.weight1}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Pre-register Vehicle
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pre-registered Vehicles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Reg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preRegisteredVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.vehicleReg}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.material}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.weight1} kg</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.timestamp.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFieldsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Field</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Field Name (e.g., vehicleReg)"
            value={newField.name}
            onChange={(e) => setNewField({...newField, name: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Display Label (e.g., Vehicle Registration)"
            value={newField.label}
            onChange={(e) => setNewField({...newField, label: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={newField.type}
            onChange={(e) => setNewField({...newField, type: e.target.value as any})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="select">Select</option>
          </select>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={newField.required}
              onChange={(e) => setNewField({...newField, required: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="required" className="text-sm text-gray-700">Required</label>
          </div>
          {newField.type === 'select' && (
            <input
              type="text"
              placeholder="Options (comma-separated)"
              value={newField.options}
              onChange={(e) => setNewField({...newField, options: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>
        <button
          onClick={handleAddField}
          disabled={!newField.name || !newField.label}
          className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Fields</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fieldConfigs.sort((a, b) => a.order - b.order).map((field) => (
                <tr key={field.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.required ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.order}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingField(field)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDestinationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Destination</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Destination Name"
              value={newDestination.name}
              onChange={(e) => setNewDestination({name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddDestination}
            disabled={!newDestination.name}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Destination
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Destinations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {destinations.map((destination) => (
                <tr key={destination.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{destination.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleDeleteDestination(destination.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderIndicatorTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">USB Weight Indicator Management</h3>
        <p className="text-gray-600 mb-6">Connect and manage the USB weight indicator for automatic weight readings.</p>
        
        <WeighbridgeIndicator
          onWeightUpdate={onWeightUpdate}
          onConnectionChange={onIndicatorStatusChange}
          currentField="weight1"
          disabled={false}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Scale className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JWS Weighbridge</h1>
                <p className="text-sm text-gray-600">Admin Dashboard</p>
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

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'transactions', label: 'Transactions', icon: FileText },
              { key: 'partial', label: 'Partial Transactions', icon: Scale },
              { key: 'vehicles', label: 'Pre-registered Vehicles', icon: Car },
              { key: 'materials', label: 'Material Pricing', icon: DollarSign },
              { key: 'fields', label: 'Field Management', icon: Settings },
              { key: 'destinations', label: 'Destinations', icon: MapPin },
              { key: 'reports', label: 'Reports', icon: Calendar },
              { key: 'indicator', label: 'USB Indicator', icon: Usb }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'transactions' && renderTransactionsTab()}
        {activeTab === 'partial' && renderPartialTransactionsTab()}
        {activeTab === 'vehicles' && renderVehiclesTab()}
        {activeTab === 'materials' && renderMaterialsTab()}
        {activeTab === 'fields' && renderFieldsTab()}
        {activeTab === 'destinations' && renderDestinationsTab()}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'indicator' && renderIndicatorTab()}
      </div>
    </div>
  );
};