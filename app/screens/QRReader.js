import React, {useEffect} from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text, View,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';

import base64 from 'react-native-base64'

import QRCodeScanner from 'react-native-qrcode-scanner';
import RNSimpleCrypto from "react-native-simple-crypto";
import AsyncStorage from '@react-native-community/async-storage';
import {useTheme} from '../themes/ThemeProvider';

const screenHeight = Math.round(Dimensions.get('window').height);

function QRReader({ navigation }) {
  const {colors, isDark} = useTheme();

  const onVaccineRead = async (e) => {
    const msg = e.data.split("?");
    const what = msg[0].split(":");
    if (what[0] != "healthpass") {
      return;
    }

    var regex = /[?&]([^=#]+)=([^&#]*)/g,
      params = {},
      match;
    while (match = regex.exec(e.data)) {
      params[match[1]] = match[2];
      console.log(match[1], params[match[1]]);
    }

    try {
      let pub_key_response = await fetch(params.vaccinator_pub_key);
      let pub_key = await pub_key_response.text();

      console.log(params.signature);
      
      const message = e.data.replace("&signature="+params.signature, "");    
      const signedCert = base64.decode(decodeURIComponent(params.signature).replace(/\n/g, ''));
      const validSignature2 = await RNSimpleCrypto.RSA.verify(
        signedCert,
        message,
        pub_key,
        "SHA256"
      );

      const vaccine = { type: what[1],
                date: params.date, 
                name: decodeURIComponent(params.name).replace(/\+/g, ' '), 
                manufacturer: decodeURIComponent(params.manuf).replace(/\+/g, ' '), 
                lot: decodeURIComponent(params.lot).replace(/\+/g, ' '),
                route: decodeURIComponent(params.route).replace(/\+/g, ' '),
                site: decodeURIComponent(params.site).replace(/\+/g, ' '),
                dose: decodeURIComponent(params.dose).replace(/\+/g, ' '),
                vaccinee: decodeURIComponent(params.vaccinee).replace(/\+/g, ' '), 
                vaccinator: decodeURIComponent(params.vaccinator).replace(/\+/g, ' '),
                vaccinator_pub_key: params.vaccinator_pub_key,
                signature: signedCert, 
                scanDate: new Date().toJSON(),
                verified: validSignature2 ? "Valid" : "Not Valid" };

      AsyncStorage.setItem('CARDS'+signedCert, JSON.stringify(vaccine));
    } catch (error) {
      console.error("Could not verify.", error);
    }

    navigation.goBack();
  }

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: colors.background }, 
      headerTintColor: colors.text, 
      headerTitleStyle: {
          fontFamily: 'Cochin',
          fontWeight: 'normal',
          fontSize: 20,
      },
    });
  });

  return (
    <QRCodeScanner
        onRead={onVaccineRead}
        reactivate={true}
        reactivateTimeout={5000}
        containerStyle={{backgroundColor: colors.background}}
        cameraStyle={{ height: screenHeight }}
        topViewStyle={{height: 0, flex: 0}}
        bottomViewStyle={{height: 0, flex: 0}}
      />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centerText: {
    flex: 0,
    fontSize: 18,
    padding: 30,
    color: '#777',
  },
});

export default QRReader;