import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../navigation/types';
import { useProfile } from '../context/ProfileContext';
import { PROFILE_LABELS } from '../storage/profiles';
import { AppButton } from '../ui/primitives/AppButton';
import { AppCard } from '../ui/primitives/AppCard';
import { ScreenScaffold } from '../ui/primitives/ScreenScaffold';
import { colors, spacing } from '../ui/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { activeProfile, setActiveProfile } = useProfile();

  return (
    <ScreenScaffold>
      <AppCard>
        <Text style={styles.eyebrow}>SETTINGS</Text>
        <Text style={styles.title}>Preferences skeleton</Text>
        <Text style={styles.subtitle}>Ready for weight unit, haptics, sounds and export controls.</Text>
      </AppCard>

      <AppCard>
        <SettingRow
          label="Profilo attivo"
          value={activeProfile ? PROFILE_LABELS[activeProfile] : '—'}
        />
        <View style={styles.profileAction}>
          <AppButton
            variant="ghost"
            onPress={async () => {
              await setActiveProfile(null);
            }}
          >
            Cambia profilo
          </AppButton>
        </View>
        <SettingRow label="Weight unit" value="kg (default)" />
        <SettingRow label="Haptics" value="planned" />
        <SettingRow label="Sound cues" value="planned" />
        <SettingRow label="Data export" value="planned" />
      </AppCard>

      <AppCard>
        <AppButton variant="ghost" onPress={() => navigation.navigate('VictoryTest')}>
          Victory Test (legacy)
        </AppButton>
      </AppCard>

      <View style={styles.actions}>
        <AppButton variant="ghost" onPress={() => navigation.navigate('Home')}>
          Back home
        </AppButton>
      </View>
    </ScreenScaffold>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 10,
    color: colors.quiet,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    color: colors.ink900,
    fontWeight: '300',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  profileAction: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingVertical: spacing.xs,
    alignItems: 'flex-start',
  },
  rowLabel: {
    color: colors.ink800,
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    color: colors.quiet,
    fontSize: 13,
  },
  actions: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
