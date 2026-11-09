import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@project/components/lib/utils';

const options = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark', icon: Moon, label: 'Dark' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center rounded-full border bg-background/50 p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center transition-colors',
            theme === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
