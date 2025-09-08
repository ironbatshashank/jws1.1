export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  driverLicense: string;
  vehicleType: string;
  tareWeight: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
}

export interface Destination {
  id: string;
  name: string;
}

export interface PreRegisteredVehicle {
  id: string;
  vehicleReg: string;
  material: string;
  destination: string;
  weight1: number;
  operatorName: string;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  ticketNumber: string;
  vehicleReg: string;
  material: string;
  destination: string;
  weight1: number;
  weight2?: number;
  netWeight?: number;
  timestamp: Date;
  operatorName: string;
  status: 'partial' | 'complete';
  notes?: string;
  materialRate?: number;
  totalValue?: number;
}

export interface WeighbridgeState {
  currentWeight: number;
  isStable: boolean;
  isConnected: boolean;
  lastUpdate: Date;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'operator' | 'admin';
  name: string;
}

export interface FieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
  order: number;
}