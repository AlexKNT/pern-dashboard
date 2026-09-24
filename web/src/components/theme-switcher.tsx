import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

const LABELS: Record<ThemePreference, { label: string; Icon: LucideIcon }> = {
  light: { label: "Light", Icon: SunIcon },
  dark: { label: "Dark", Icon: MoonIcon },
  system: { label: "System", Icon: MonitorIcon },
};

/**
 * The app's single theme control: one dropdown that offers light, dark and system.
 *
 * It reads and writes the preference through the theme context, which stores it
 * under `pern-dashboard-theme` and applies the resolved theme to the document.
 */
export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();
  const { Icon } = LABELS[preference];

  return (
    <Select value={preference} onValueChange={(next) => setPreference(next as ThemePreference)}>
      <SelectTrigger size="sm" aria-label="Theme" className="w-32">
        <Icon aria-hidden="true" data-icon="inline-start" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {THEME_PREFERENCES.map((option) => (
            <SelectItem key={option} value={option}>
              {LABELS[option].label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
