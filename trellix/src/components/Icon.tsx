interface Props {
  name: 'sun' | 'moon' | 'board' | 'calendar' | 'user' | 'check' | 'plus';
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 20, className }: Props) {
  const style = { display: 'inline-block', verticalAlign: 'middle' };
  
  const icons: Record<string, JSX.Element> = {
    sun: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} className={className}>
        <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 2V5M10 15V18M18 10H15M5 10H2M15.66 4.34L13.54 6.46M6.46 13.54L4.34 15.66M15.66 15.66L13.54 13.54M6.46 6.46L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    moon: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} className={className}>
        <path d="M17 10.5A7 7 0 1 1 9.5 3a5.5 5.5 0 0 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    board: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} className={className}>
        <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6.5 7V13M10 7V11M13.5 7V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} className={className}>
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 7H14" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} className={className}>
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 14.5C2 11.74 4.69 9.5 8 9.5C11.31 9.5 14 11.74 14 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} className={className}>
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style} className={className}>
        <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };

  return icons[name];
}
