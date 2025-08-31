import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  icon?: React.ComponentType<{ size?: number }>;
  iconPosition?: 'left' | 'right';
}

const inputSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
};

const inputVariants = {
  default: 'bg-custom-black border border-custom-light-gray text-custom-white placeholder-custom-light-gray focus:border-custom-color focus:ring-2 focus:ring-custom-color focus:ring-offset-2 focus:ring-offset-custom-black',
  outline: 'bg-transparent border border-custom-light-gray text-custom-white placeholder-custom-light-gray focus:border-custom-color focus:ring-2 focus:ring-custom-color focus:ring-offset-2 focus:ring-offset-custom-black'
};

export default function Input({
  label,
  error,
  size = 'md',
  variant = 'default',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}: InputProps) {
  const baseClasses = 'w-full rounded font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClasses = inputSizes[size];
  const variantClasses = inputVariants[variant];
  
  const inputClasses = `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`;

  const renderIcon = () => {
    if (!Icon) return null;
    
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    
    return <Icon size={iconSize} />;
  };

  const renderInput = () => {
    if (Icon && iconPosition === 'left') {
      return (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-custom-light-gray">
            {renderIcon()}
          </div>
          <input
            {...props}
            className={`${inputClasses} pl-10`}
          />
        </div>
      );
    }

    if (Icon && iconPosition === 'right') {
      return (
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-custom-light-gray">
            {renderIcon()}
          </div>
          <input
            {...props}
            className={`${inputClasses} pr-10`}
          />
        </div>
      );
    }

    return (
      <input
        {...props}
        className={inputClasses}
      />
    );
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-custom-white mb-1">
          {label}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
