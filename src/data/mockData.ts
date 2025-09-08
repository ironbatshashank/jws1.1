import { User, FieldConfig, Material, PreRegisteredVehicle, Destination } from '../types/weighbridge';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'operator',
    password: 'op123',
    role: 'operator',
    name: 'John Operator'
  },
  {
    id: '2',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  }
];

export const defaultFieldConfigs: FieldConfig[] = [
  {
    id: 'vehicleReg',
    name: 'vehicleReg',
    label: 'Vehicle Registration',
    type: 'text',
    required: true,
    order: 1
  },
  {
    id: 'material',
    name: 'material',
    label: 'Material',
    type: 'select',
    required: true,
    options: ['Steel', 'Iron', 'Aluminum', 'Copper', 'Scrap Metal'],
    order: 2
  },
  {
    id: 'destination',
    name: 'destination',
    label: 'Destination',
    type: 'select',
    required: true,
    order: 3
  },
  {
    id: 'weight1',
    name: 'weight1',
    label: 'Weight 1 (kg)',
    type: 'number',
    required: true,
    order: 4
  },
  {
    id: 'weight2',
    name: 'weight2',
    label: 'Weight 2 (kg)',
    type: 'number',
    required: false,
    order: 5
  }
];

export const defaultMaterials: Material[] = [
  { id: '1', name: 'Steel', unit: 'kg', pricePerUnit: 0.50 },
  { id: '2', name: 'Iron', unit: 'kg', pricePerUnit: 0.45 },
  { id: '3', name: 'Aluminum', unit: 'kg', pricePerUnit: 1.20 },
  { id: '4', name: 'Copper', unit: 'kg', pricePerUnit: 6.50 },
  { id: '5', name: 'Scrap Metal', unit: 'kg', pricePerUnit: 0.30 }
];

export const defaultDestinations: Destination[] = [
  { id: '1', name: 'Warehouse A' },
  { id: '2', name: 'Warehouse B' },
  { id: '3', name: 'Processing Plant' },
  { id: '4', name: 'Export Terminal' },
  { id: '5', name: 'Local Distributor' }
];