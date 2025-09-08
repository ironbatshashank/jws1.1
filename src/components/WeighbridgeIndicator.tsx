import React, { useState, useEffect, useCallback } from 'react';
import { Usb, AlertCircle } from 'lucide-react';

interface WeighbridgeIndicatorProps {
  onWeightUpdate: (weight: number) => void;
  onConnectionChange: (connected: boolean) => void;
  currentField: 'weight1' | 'weight2';
  disabled?: boolean;
}

export const WeighbridgeIndicator: React.FC<WeighbridgeIndicatorProps> = ({
  onWeightUpdate,
  onConnectionChange,
  currentField,
  disabled = false
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [port, setPort] = useState<SerialPort | null>(null);
  const [reader, setReader] = useState<ReadableStreamDefaultReader | null>(null);

  const connectToIndicator = useCallback(async () => {
    if (!('serial' in navigator)) {
      setConnectionStatus('error');
      alert('Web Serial API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Request port access
      const selectedPort = await (navigator as any).serial.requestPort();
      
      // Open the port with indicator specifications
      await selectedPort.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      setPort(selectedPort);
      setIsConnected(true);
      onConnectionChange(true);
      setConnectionStatus('connected');

      // Start reading data
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = selectedPort.readable.pipeTo(textDecoder.writable);
      const newReader = textDecoder.readable.getReader();
      setReader(newReader);

      // Read data continuously
      const readData = async () => {
        try {
          while (true) {
            const { value, done } = await newReader.read();
            if (done) break;
            
            // Parse weight data from various weighing scale formats
            console.log('Raw data from scale:', value); // Debug log
            
            const parsedWeight = parseWeightData(value);
            if (parsedWeight !== null) {
              setCurrentWeight(parsedWeight);
              onWeightUpdate(parsedWeight);
            }
          }
        } catch (error) {
          console.error('Error reading from serial port:', error);
          setConnectionStatus('error');
          setIsConnected(false);
        }
      };

      readData();

    } catch (error) {
      console.error('Failed to connect to indicator:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      onConnectionChange(false);
    }
  }, []);

  // Enhanced weight parsing function to handle various scale formats
  const parseWeightData = (data: string): number | null => {
    try {
      // Clean the data - remove extra whitespace and convert to uppercase
      const cleanData = data.trim().toUpperCase();
      
      // Common weighing scale formats:
      // Format 1: "ST,GS,    1200,kg" or "ST, GS,    1200, kg"
      // Format 2: "  1234.5 kg" or "1234.5kg"
      // Format 3: "+001234.5 KG" (with sign and leading zeros)
      // Format 4: "NET 1234.5" or "GROSS 1234.5"
      // Format 5: "1234.5" (just the number)
      
      let weightMatch;
      
      // Try format with status codes (ST, GS, etc.) and comma separation
      weightMatch = cleanData.match(/(?:ST|GS|NET|GROSS).*?([+-]?\d+\.?\d*)\s*(?:KG|G|LB|T)?/);
      if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        if (!isNaN(weight)) {
          return Math.abs(weight); // Return absolute value for weight
        }
      }
      
      // Try simple format with weight and unit
      weightMatch = cleanData.match(/([+-]?\d+\.?\d*)\s*(?:KG|G|LB|T|KGS)/);
      if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        if (!isNaN(weight)) {
          return Math.abs(weight);
        }
      }
      
      // Try format with NET/GROSS prefix
      weightMatch = cleanData.match(/(?:NET|GROSS)\s*([+-]?\d+\.?\d*)/);
      if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        if (!isNaN(weight)) {
          return Math.abs(weight);
        }
      }
      
      // Try just extracting any number (fallback)
      weightMatch = cleanData.match(/([+-]?\d+\.?\d*)/);
      if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        if (!isNaN(weight) && weight >= 0) {
          return weight;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing weight data:', error);
      return null;
    }
  };

  const disconnectIndicator = useCallback(async () => {
    try {
      if (reader) {
        await reader.cancel();
        setReader(null);
      }
      if (port) {
        await port.close();
        setPort(null);
      }
      setIsConnected(false);
      setConnectionStatus('disconnected');
      onConnectionChange(false);
      setCurrentWeight(null);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, [reader, port, onConnectionChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectIndicator();
    };
  }, [disconnectIndicator]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Usb className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Weight Indicator</span>
        </div>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          <Usb className={`w-4 h-4 ${isConnected ? '' : 'opacity-50'}`} />
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="flex space-x-2">
        {!isConnected ? (
          <button
            onClick={connectToIndicator}
            disabled={connectionStatus === 'connecting'}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Usb className="w-4 h-4 mr-2" />
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Indicator'}
          </button>
        ) : (
          <button
            onClick={disconnectIndicator}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            <Usb className="w-4 h-4 mr-2 opacity-50" />
            Disconnect
          </button>
        )}
      </div>

      {/* Weight Display */}
      {isConnected && (
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-sm text-gray-600 mb-1">Current Reading:</div>
          <div className="text-2xl font-bold text-gray-900">
            {currentWeight !== null ? `${currentWeight.toFixed(2)} kg` : '---'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Auto-updating {currentField} field
          </div>
        </div>
      )}

      {/* Manual Input Message */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="text-sm text-yellow-800">
            <strong>Indicator not connected.</strong> Please enter weights manually in the Weight 1 and Weight 2 fields below.
          </div>
        </div>
      )}

      {/* Debug Information (only show in development) */}
      {isConnected && process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="text-xs text-blue-800">
            <strong>Debug Mode:</strong> Check browser console for raw scale data
          </div>
        </div>
      )}

      {/* Browser Compatibility Warning */}
      {!('serial' in navigator) && (
        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            Web Serial API not supported. Please use Chrome or Edge browser for USB connectivity.
          </span>
        </div>
      )}
    </div>
  );
};