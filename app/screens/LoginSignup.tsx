import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const user_icon = require('../../assets/images/person.png');
const password_icon = require('../../assets/images/hide.png');
const email_icon = require('../../assets/images/email.png');


const LoginSignup = () => {
	return (
		<View style={styles.container}>
    		<View style={styles.header}>
    			<Text style={styles.text}>Sign Up</Text>
        		<View style={styles.underline} />
      		</View>

      		<View style={styles.inputs}>
        		<View style={styles.input}>
          			<Image source={user_icon} style={styles.icon} />
          			<TextInput
            			style={styles.textInput}
            			placeholder="Username"
           				placeholderTextColor="#999"
          			/>
        		</View>

        		<View style={styles.input}>
          			<Image source={email_icon} style={styles.icon} />
          			<TextInput
            			style={styles.textInput}
            			placeholder="Email"
            			placeholderTextColor="#999"
            			keyboardType="email-address"
          			/>
        		</View>

        		<View style={styles.input}>
          			<Image source={password_icon} style={styles.icon} />
          			<TextInput
            			style={styles.textInput}
            			placeholder="Password"
            			placeholderTextColor="#999"
            			secureTextEntry
          			/>
        		</View>	
        		<Text style={styles.forgotPassword}>
          			Lost Password? <Text style={styles.link}>Click Here!</Text>
        		</Text>

        		<View style={styles.submitContainer}>
          			<TouchableOpacity style={styles.submit}>
            			<Text style={styles.submitText}>Sign Up</Text>
          			</TouchableOpacity>

          			<TouchableOpacity style={styles.submit}>
            			<Text style={styles.submitText}>Login</Text>
          			</TouchableOpacity>
        		</View>
      		</View>
    	</View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  underline: {
    width: 60,
    height: 4,
    backgroundColor: "#4c00b4",
    marginTop: 8,
    borderRadius: 2,
  },
  inputs: {
    gap: 20,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10,
    resizeMode: "contain",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  forgotPassword: {
    marginTop: 10,
    color: "#555",
    fontSize: 14,
  },
  link: {
    color: "#4c00b4",
    fontWeight: "600",
  },
  submitContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  submit: {
    flex: 1,
    backgroundColor: "#4c00b4",
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginSignup
