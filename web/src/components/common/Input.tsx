import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-lumera-luminoso mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg transition-all bg-white/[0.03] text-lumera-luminoso placeholder:text-lumera-muted',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:shadow-[0_0_0_3px_rgba(123,46,255,0.15),0_0_20px_rgba(123,46,255,0.1)]',
            'disabled:bg-white/[0.02] disabled:cursor-not-allowed',
            {
              'border-red-500 focus:ring-red-500': error,
              'border-lumera-border': !error,
            },
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-lumera-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
