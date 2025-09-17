import React from 'react';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'primary' | 'secondary' | 'link' | 'outline' | 'icon';
  icon?: React.ComponentType<{ size?: number }>;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const buttonVariants = {
  ghost: 'bg-transparent hover:bg-custom-light-gray text-custom-white hover:text-custom-white',
  primary: 'bg-custom-color hover:bg-custom-color-dark text-custom-white border border-black shadow-button',
  secondary: 'bg-custom-light-gray hover:bg-custom-black text-custom-white shadow-button',
  link: 'bg-transparent text-custom-color hover:text-custom-color-dark underline',
  outline: 'bg-transparent border border-custom-light-gray hover:bg-custom-light-gray text-custom-white shadow-button',
  icon: 'bg-transparent hover:bg-custom-light-gray text-custom-light-gray hover:text-custom-white p-2'
};

const buttonSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-custom-color focus:ring-offset-2 focus:ring-offset-custom-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = buttonVariants[variant];
  const sizeClasses = variant === 'icon' ? 'p-2' : buttonSizes[size];
  
  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;

  const renderIcon = () => {
    if (!Icon) return null;
    
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    
    return <Icon size={iconSize} />;
  };

  const renderContent = () => {
    if (variant === 'icon') {
      return renderIcon();
    }

    if (Icon && iconPosition === 'left') {
      return (
        <>
          {renderIcon()}
          {children}
        </>
      );
    }

    if (Icon && iconPosition === 'right') {
      return (
        <>
          {children}
          {renderIcon()}
        </>
      );
    }

    return children;
  };

  return (
    <button className={classes} {...props}>
      {renderContent()}
    </button>
  );
}
