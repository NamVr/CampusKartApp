import React from 'react';
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderStepperProps {
  status: OrderStatus;
}

const STEPS = [
  { id: 'pending', label: 'Order Placed', icon: Clock },
  { id: 'preparing', label: 'Preparing', icon: Package },
  { id: 'out-for-delivery', label: 'On the Way', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export const OrderStepper: React.FC<OrderStepperProps> = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 text-red-500 font-bold bg-red-500/10 p-4 rounded-2xl w-max">
        <XCircle className="w-6 h-6" />
        Order Cancelled
      </div>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.id === status);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-alt -translate-y-1/2 z-0 rounded-full"></div>
        
        {/* Active Progress Bar */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-accent -translate-y-1/2 z-0 transition-all duration-700 rounded-full"
          style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  isCompleted 
                    ? 'bg-accent border-accent text-bg' 
                    : isActive 
                      ? 'bg-surface border-accent text-accent scale-110 shadow-lg shadow-accent/20' 
                      : 'bg-surface border-surface-alt text-text-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${
                isActive ? 'text-accent' : isCompleted ? 'text-text-main' : 'text-text-muted'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
