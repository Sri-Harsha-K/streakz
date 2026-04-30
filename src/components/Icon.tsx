import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'list'
  | 'gear'
  | 'user'
  | 'plus'
  | 'check'
  | 'flame'
  | 'snow'
  | 'bell'
  | 'moon'
  | 'sun'
  | 'chevron'
  | 'search'
  | 'sort'
  | 'archive'
  | 'export'
  | 'import'
  | 'trash'
  | 'edit'
  | 'star'
  | 'target'
  | 'calendar';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}

export function Icon({ name, size = 22, color = '#000', stroke = 1.6, fill = 'none' }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: fill,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'home':
      return (
        <Svg {...common}>
          <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...common}>
          <Path d="M8 6h13M8 12h13M8 18h13" />
          <Circle cx="4" cy="6" r="1.2" fill={color} stroke="none" />
          <Circle cx="4" cy="12" r="1.2" fill={color} stroke="none" />
          <Circle cx="4" cy="18" r="1.2" fill={color} stroke="none" />
        </Svg>
      );
    case 'gear':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M5 13l4 4L19 7" />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...common}>
          <Path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 1-9z" />
        </Svg>
      );
    case 'snow':
      return (
        <Svg {...common}>
          <Path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
          <Path d="M9 4l3 2 3-2M9 20l3-2 3 2M2 9l2 3-2 3M22 9l-2 3 2 3" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common}>
          <Path d="M6 9a6 6 0 0 1 12 0v4l2 3H4l2-3z" />
          <Path d="M10 19a2 2 0 0 0 4 0" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...common}>
          <Path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="4.5" />
          <Path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...common}>
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="M20 20l-3.5-3.5" />
        </Svg>
      );
    case 'sort':
      return (
        <Svg {...common}>
          <G translateX={-4}>
            <Path d="M3 6h13M3 12h9M3 18h5M17 14l4 4 4-4M21 4v14" />
          </G>
        </Svg>
      );
    case 'archive':
      return (
        <Svg {...common}>
          <Path d="M3 6h18v4H3zM5 10v10h14V10M10 14h4" />
        </Svg>
      );
    case 'export':
      return (
        <Svg {...common}>
          <Path d="M12 3v13M7 8l5-5 5 5M5 21h14" />
        </Svg>
      );
    case 'import':
      return (
        <Svg {...common}>
          <Path d="M12 16V3M7 11l5 5 5-5M5 21h14" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...common}>
          <Path d="M4 20l4-1L20 7l-3-3L5 16l-1 4z" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path d="M12 3l2.7 5.5 6 .9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3 9.4l6-.9z" />
        </Svg>
      );
    case 'target':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Circle cx="12" cy="12" r="5" />
          <Circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common}>
          <Rect x="3" y="5" width="18" height="16" rx="2" />
          <Path d="M3 10h18M8 3v4M16 3v4" />
        </Svg>
      );
    default:
      return null;
  }
}
