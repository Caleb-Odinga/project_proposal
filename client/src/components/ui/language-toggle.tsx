import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { Languages } from "@/lib/constants";

export default function LanguageToggle() {
  const { language, setLanguage } = useStore();

  const handleChangeLanguage = (lang: string) => {
    setLanguage(lang);
  };

  // Find the current language label
  const currentLanguage = Languages.find(l => l.value === language)?.label || "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => handleChangeLanguage(lang.value)}
            className="flex items-center justify-between"
          >
            {lang.label}
            {language === lang.value && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
