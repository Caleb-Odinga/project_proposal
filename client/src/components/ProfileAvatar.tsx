import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string;
  avatar?: string;
}

interface ProfileAvatarProps {
  user: User | null;
  size?: "sm" | "md" | "lg";
}

export default function ProfileAvatar({ user, size = "md" }: ProfileAvatarProps) {
  const getSize = () => {
    switch (size) {
      case "sm": return "h-8 w-8";
      case "lg": return "h-12 w-12";
      default: return "h-10 w-10";
    }
  };

  const getFallbackSize = () => {
    switch (size) {
      case "sm": return "text-xs";
      case "lg": return "text-lg";
      default: return "text-sm";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <Avatar className={getSize()}>
        <AvatarFallback className="bg-neutral-200 text-neutral-600">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={getSize()}>
      <AvatarImage 
        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=E56B1F&color=fff`} 
        alt={user.fullName} 
      />
      <AvatarFallback className={`bg-primary text-white ${getFallbackSize()}`}>
        {getInitials(user.fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
