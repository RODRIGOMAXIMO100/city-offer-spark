import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isValid?: boolean | null;
  showValidation?: boolean;
  errorMessage?: string;
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, isValid, showValidation = false, errorMessage, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          className={cn(
            "pr-10",
            showValidation && isValid === true && "border-green-500 focus-visible:ring-green-500",
            showValidation && isValid === false && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {showValidation && isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
        {showValidation && isValid === false && errorMessage && (
          <p className="text-xs text-destructive mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

export { ValidatedInput };
