import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  return (
    <View style={styles.container}>
      {isSignup && (
        <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
      )}
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <Button
        title={isSignup ? 'Sign Up' : 'Login'}
        onPress={() =>
          isSignup ? signup(username, email, password) : login(email, password)
        }
      />

      <Button title="Switch Mode" onPress={() => setIsSignup(!isSignup)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, gap: 10 },
});
