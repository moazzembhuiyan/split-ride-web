import type { SVGProps } from "react";

export const PaypassIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6.5 8.5c3.5-3.2 7.5-3.2 11 0M8 11.25c2.4-2.2 5.6-2.2 8 0M9.5 14c1.5-1.3 3.5-1.3 5 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const MastercardIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="8" r="6.5" fill="#EB001B" />
      <circle cx="15" cy="8" r="6.5" fill="#F79E1B" />
      <path
        d="M12 3.2a6.5 6.5 0 0 1 0 9.6 6.5 6.5 0 0 1 0-9.6Z"
        fill="#FF5E00"
      />
    </svg>
  );
};

export const MastercardIconWhite = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="9" cy="8" r="6.5" fill="white" fillOpacity="0.55" />
      <circle cx="15" cy="8" r="6.5" fill="white" />
    </svg>
  );
};

export const VisaIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="36"
      height="12"
      viewBox="0 0 36 12"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M14.2 11.6H11.55L13.2.4h2.65l-1.65 11.2Zm8.55-11.45c-.52-.2-1.35-.42-2.38-.42-2.62 0-4.47 1.36-4.48 3.3-.02 1.44 1.32 2.24 2.32 2.72 1.03.49 1.38.82 1.38 1.26-.01.68-.83 1-1.6 1-1.07 0-1.64-.16-2.52-.54l-.35-.16-.38 2.3c.63.29 1.8.54 3.01.55 2.78 0 4.59-1.34 4.61-3.42.01-1.14-.7-2.01-2.23-2.73-.93-.46-1.5-.77-1.5-1.24.01-.43.48-.88 1.53-.88.87-.02 1.5.18 2 .37l.24.11.36-2.22Zm6.72 7.55c.23-.6.1-.5.01-.02.32-.84.33-.97.42-1.34h-2.9c-.1.3.14.97.18 1.16l.9 4.2h2.64l-1.25-6.55h-2.28c-.5 0-.92.3-1.05.78l-2.95 6.77h2.66l.41-1.14h3.25l.24 1.14h2.34L29.47.4h-2.64l-1.36 7.3ZM8.86.4 6.36 7.02l-.27-1.32C5.64 3.9 4.1 2.18 2.36 1.32L4.65 11.6h2.68L11.5.4H8.86Z"
        fill="currentColor"
      />
      <path
        d="M4.02.4H.04L0 .6c3.1.77 5.16 2.63 6.01 4.86L4.78.98C4.67.55 4.37.42 4.02.4Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const AmexIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="36"
      height="14"
      viewBox="0 0 36 14"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect width="36" height="14" rx="2" fill="currentColor" opacity="0.15" />
      <path
        d="M4.2 10.2V3.8h3.55c.95 0 1.62.22 2.08.66.42.4.66 1 .66 1.72 0 .74-.24 1.35-.7 1.76-.48.44-1.18.66-2.1.66H6.05v1.6H4.2Zm1.85-3.05h1.42c.42 0 .72-.08.92-.26.2-.18.3-.44.3-.78 0-.34-.1-.6-.3-.77-.2-.18-.5-.26-.94-.26H6.05v2.07ZM12.1 10.2 10.4 3.8h2.02l.72 3.38.78-3.38h1.92l-1.78 6.4h-1.96Zm5.35 0V3.8h4.55v1.55h-2.7v.95h2.52v1.48h-2.52v.87h2.78V10.2h-4.63Zm6.55 0V3.8h1.85l1.72 2.92V3.8h1.72v6.4h-1.78L25.6 7.1v3.1h-1.6Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const DiscoverIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="36"
      height="14"
      viewBox="0 0 36 14"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="28" cy="7" r="5" fill="#F76F1A" />
      <path
        d="M2.2 10.2V3.8h2.05c1.7 0 2.72.88 2.72 3.2 0 2.34-1.04 3.2-2.76 3.2H2.2Zm1.85-1.52h.22c.72 0 .98-.5.98-1.68 0-1.16-.26-1.68-.98-1.68h-.22v3.36ZM8.4 10.2V3.8h1.82v6.4H8.4Zm3.05 0V3.8h1.72l1.88 3.05V3.8h1.72v6.4h-1.72l-1.9-3.12v3.12h-1.7Zm6.55 0V3.8h4.4v1.52h-2.55v.9h2.38v1.42h-2.38v.98h2.62V10.2h-4.47Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GenericCardIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="30"
      height="19"
      viewBox="0 0 30 19"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="0.5"
        y="0.5"
        width="29"
        height="18"
        rx="3.5"
        stroke="currentColor"
        opacity="0.7"
      />
      <rect
        x="3"
        y="5"
        width="24"
        height="3"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="3"
        y="12"
        width="8"
        height="2"
        rx="0.5"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
};
