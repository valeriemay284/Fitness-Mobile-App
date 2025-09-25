// constants/formStyles.js
import { StyleSheet } from 'react-native';
import colors from './colors';

const formStyles = StyleSheet.create({
  // the card "sheet" look
  card: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 30,
    paddingTop: 60,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  // wrapper around each input
  inputWrap: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E3E6EB',
    backgroundColor: '#FDFDFE',
    borderRadius: 14,
    paddingHorizontal: 44,
    height: 52,
    justifyContent: 'center',
  },

  // the text inside <TextInput>
  input: {
    fontSize: 16,
    color: '#111827',
  },

  // primary action button (login/register)
  button: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonDisabled: { opacity: 0.5 },

  // button text
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  // row for “Don’t have an account? Sign Up”
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },

  // muted gray text (hints, small labels)
  mutedText: {
    color: colors.textMuted,
  },
});

export default formStyles;
