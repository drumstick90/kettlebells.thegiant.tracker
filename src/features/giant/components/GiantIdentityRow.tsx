import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../ui/primitives/AppButton';
import { colors, radius, spacing } from '../../../ui/theme/tokens';

export function GiantIdentityRow() {
  return (
    <View style={styles.row}>
      <View style={styles.brandWrap}>
        <View style={styles.brandTile}>
          <Text style={styles.brandLetter}>G</Text>
        </View>
        <Text style={styles.brandText}>THE GIANT TRACKER</Text>
      </View>
      <View style={styles.links}>
        <AppButton variant="pill" onPress={() => {}}>
          FLOW
        </AppButton>
        <AppButton variant="pill" onPress={() => {}}>
          STATS
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTile: {
    width: 26,
    height: 26,
    backgroundColor: colors.ink800,
    borderRadius: radius.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLetter: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  brandText: {
    color: colors.ink800,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '600',
  },
  links: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
