import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import AWS from 'aws-sdk/dist/aws-sdk-react-native';
import {Buffer} from 'buffer';
import axios from 'axios';
import {ACCESS_KEY_ID, SECRET_ACCESS_KEY} from 'react-native-dotenv';

const sageMakerRuntime = new AWS.SageMakerRuntime({
  region: 'us-east-1',
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});

const App = () => {
  const [loading, setLoading] = React.useState(false);

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}>
        {({camera}) => {
          return (
            <>
              <ActivityIndicator
                size="large"
                style={styles.loadingIndicator}
                color="#fff"
                animating={loading}
              />
              <View
                style={{
                  flex: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => this.takePicture(camera, setLoading)}
                  style={styles.capture}>
                  <Text style={{fontSize: 14}}> CAPTURE </Text>
                </TouchableOpacity>
              </View>
            </>
          );
        }}
      </RNCamera>
    </View>
  );
};

takePicture = async function (camera, setLoading) {
  setLoading(true);
  const options = {quality: 0.5, base64: true};
  const data = await camera.takePictureAsync(options);
  let buffer = Buffer.from(data.base64, 'base64');
  sendToSagemaker(buffer, setLoading);
};

sendToSagemaker = (bitmap, setLoading) => {
  var params = {
    Body: bitmap,
    EndpointName: 'wireframe-to-code',
    ContentType: 'image/jpeg',
  };

  sageMakerRuntime.invokeEndpoint(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      setLoading(false);
      Alert.alert('Could not process image', '');
    } else {
      responseData = JSON.parse(Buffer.from(data.Body).toString());
      saveToDatabase(responseData, setLoading);
    }
  });
};

saveToDatabase = (data, setLoading) => {
  axios
    .post(
      'https://t5pckgftce.execute-api.us-east-1.amazonaws.com/dev/prototype',
      {
        generated_webpage_html: data.generated_webpage_html,
        generated_webpage_css: data.generated_webpage_css,
      },
    )
    .then(function (response) {
      setLoading(false);
      Alert.alert('VS Code Pin', response.data.id);
    })
    .catch(function (error) {
      console.log(error);
      setLoading(false);
      Alert.alert('Could not save data', '');
    });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
    marginBottom: 90,
  },
  loadingIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
