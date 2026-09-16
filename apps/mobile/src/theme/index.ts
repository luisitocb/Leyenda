import { colors } from './colors';
import { spacing } from './spacing';
import { radii } from './radii';
import { typography } from './typography';

export const theme = { colors, spacing, radii, typography } as const;

export { colors, spacing, radii, typography };
export type { TextVariant } from './typography';
