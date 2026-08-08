import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === 'dealer@b2b.com' && password === '123456') {
      router.replace('/(dealer)/home');
    } else {
      Alert.alert('Login Gagal', 'Silakan gunakan Akun Demo atau hubungi Admin.');
    }
  };

  const autofillDemo = () => {
    setEmail('dealer@b2b.com');
    setPassword('123456');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>B2B Retail App</Text>
      <Text style={styles.subtitle}>Login Dealer</Text>

      <View style={styles.formContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Email / No. Handphone"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Masuk</Text>
        </TouchableOpacity>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Belum punya akun? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Daftar sekarang</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity onPress={autofillDemo} style={styles.demoBtn}>
          <Text style={styles.demoText}>Gunakan Akun Demo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6fbf0',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a6b22',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 48,
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcf0c3',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#8ec44a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#64748b',
    fontSize: 14,
  },
  registerLink: {
    color: '#8ec44a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#white',
    borderWidth: 1,
    borderColor: '#dcf0c3',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  demoText: {
    color: '#8ec44a',
    fontSize: 13,
    fontWeight: '600',
  }
});
