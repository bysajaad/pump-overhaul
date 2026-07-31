import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Chevron = (props: IconProps) => <Icon {...props}><path d="m9 6 6 6-6 6" /></Icon>;
export const Question = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.3 2.2c-.8.4-1.1.9-1.1 1.8M12 17h.01" /></Icon>;
export const Users = (props: IconProps) => <Icon {...props}><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 8a2.5 2.5 0 0 1 0 5M19.5 19v-1a3 3 0 0 0-2.2-2.9" /></Icon>;
export const Play = (props: IconProps) => <Icon {...props}><rect x="3" y="5" width="18" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></Icon>;
export const Gamepad = (props: IconProps) => <Icon {...props}><path d="M8 8h8a5 5 0 0 1 4.8 6.4l-.7 2.3a2 2 0 0 1-3.4.8L15.3 16H8.7l-1.4 1.5a2 2 0 0 1-3.4-.8l-.7-2.3A5 5 0 0 1 8 8Z" /><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" /></Icon>;
export const Gift = (props: IconProps) => <Icon {...props}><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7H8.5A2.5 2.5 0 1 1 11 4.5ZM12 7h3.5A2.5 2.5 0 1 0 13 4.5Z" /></Icon>;
export const Clock = (props: IconProps) => <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
export const EthGlyph = (props: IconProps) => <Icon {...props}><path d="m12 3-5 9 5 3 5-3-5-9ZM7 13l5 8 5-8-5 3-5-3Z" /></Icon>;
