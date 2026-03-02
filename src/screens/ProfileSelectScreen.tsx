import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../ui/primitives/AppButton';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';
import type { ProfileId } from '../storage/profiles';
import { PROFILE_LABELS } from '../storage/profiles';

interface ProfileSelectScreenProps {
  onSelect: (profile: ProfileId) => void;
}

export function ProfileSelectScreen({ onSelect }: ProfileSelectScreenProps) {
  return (
    <ScreenScaffold scroll={false}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>THE GIANT</Text>
        <Text style={styles.title}>Chi sta usando l'app?</Text>
        <Text style={styles.subtitle}>
          Scegli il profilo per accedere ai tuoi dati. Ogni telefono può usare un profilo diverso.
        </Text>

        <View style={styles.buttons}>
          <AppButton variant="primary" onPress={() => onSelect('pier')}>
            {PROFILE_LABELS.pier}
          </AppButton>
          <AppButton variant="primary" onPress={() => onSelect('luigi')}>
            {PROFILE_LABELS.luigi}
          </AppButton>
          <AppButton variant="ghost" onPress={() => onSelect('test')}>
            {PROFILE_LABELS.test}
          </AppButton>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    color: colors.ink900,
    fontWeight: '300',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
});
