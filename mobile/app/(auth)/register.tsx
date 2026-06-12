import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { updateProfile } from '../../lib/api';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 fields
  const [address, setAddress] = useState('');
  const [pib, setPib] = useState('');

  async function handleStep1() {
    if (!email.trim() || !password.trim() || !companyName.trim()) {
      Alert.alert('Greška', 'Email, lozinka i naziv firme su obavezni');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Greška', 'Lozinka mora imati najmanje 6 karaktera');
      return;
    }
    setLoading(true);
    try {
      await register({ email: email.trim(), password, company_name: companyName.trim(), phone: phone.trim() || undefined });
      setStep(2);
    } catch (err: any) {
      Alert.alert('Greška pri registraciji', err.message || 'Pokušajte ponovo');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    setLoading(true);
    try {
      if (address.trim() || pib.trim()) {
        await updateProfile({ address: address.trim() || undefined, pib: pib.trim() || undefined });
      }
      router.replace('/(tabs)/');
    } catch {
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  }

  function skipStep2() {
    router.replace('/(tabs)/');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>SP</Text>
          <Text style={styles.appName}>Servis Ponuda</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.title}>Kreirajte nalog</Text>
              <Text style={styles.stepLabel}>Korak 1 od 2 — Osnovni podaci</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email adresa *</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail}
                  placeholder="ime@firma.rs" autoCapitalize="none" keyboardType="email-address" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lozinka *</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword}
                  placeholder="Minimum 6 karaktera" secureTextEntry />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Naziv firme / Ime i prezime *</Text>
                <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName}
                  placeholder="Npr. Vodoinstalater Petrović" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone}
                  placeholder="+381 60 123 4567" keyboardType="phone-pad" />
              </View>

              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleStep1} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Dalje →</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Podaci o firmi</Text>
              <Text style={styles.stepLabel}>Korak 2 od 2 — Opcioni podaci</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresa</Text>
                <TextInput style={styles.input} value={address} onChangeText={setAddress}
                  placeholder="Ulica i broj, grad" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIB (poreski identifikacioni broj)</Text>
                <TextInput style={styles.input} value={pib} onChangeText={setPib}
                  placeholder="123456789" keyboardType="numeric" />
              </View>

              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleStep2} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Završi registraciju</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={skipStep2}>
                <Text style={styles.skipText}>Preskoči, dodaj kasnije</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 1 && (
            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Već imate nalog? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLinkText}>Prijavite se</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 64, height: 64, backgroundColor: '#2563EB', borderRadius: 18,
    textAlign: 'center', lineHeight: 64, fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 10,
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#1e3a8a' },
  form: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#d1d5db' },
  stepDotActive: { backgroundColor: '#2563EB' },
  stepLine: { flex: 1, maxWidth: 60, height: 2, backgroundColor: '#d1d5db', marginHorizontal: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  stepLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  button: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipButton: { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  skipText: { fontSize: 14, color: '#9ca3af' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { fontSize: 14, color: '#6b7280' },
  loginLinkText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
});
