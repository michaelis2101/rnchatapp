import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, TouchableOpacity, Image, ToastAndroid } from 'react-native';
//import { useRoute } from '@react-navigation/native';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import FileViewer from 'react-native-file-viewer';
import FilePickerManager from 'react-native-file-picker';
import { request, PERMISSIONS } from 'react-native-permissions';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  //const [currentDate, setCurrentDate] = useState(new Date());
  const [name,setName] = useState('Receiver');
  const [id_sender, setId_Sender] = useState('234');
  const [id_receiver, setId_Receiver] = useState('555');

  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  
  // const [id_sender, setId_Sender] = useState('555');
  // const [id_receiver, setId_Receiver] = useState('234');

  //const route = useRoute();
  //const { name,id_receiver,id_sender, name_sender } = route.params;

  useEffect(() => {
    const messagesRef = firebase
      .firestore()
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(handleSnapshot);

    function handleSnapshot(snapshot) {
      const messages = [];
      snapshot.forEach(doc => {
        const { text, user, createdAt, receiver, attachmentUrl, attachmentName } = doc.data();
        if (
          (user === id_sender && receiver === id_receiver) ||
          (user === id_receiver && receiver === id_sender)
        ) {
          messages.push({
            id: doc.id,
            text,
            user,
            createdAt,
            receiver,
            attachmentUrl,
            attachmentName,
          });
        }
      });
      setMessages(messages);
    }

    return () => {
      messagesRef();
    };
  }, [id_sender, id_receiver]);

//   useEffect(() => {
//   const messagesRef = firebase.firestore().collection('messages')
//     .orderBy('createdAt', 'desc')//sorting pesan berdasarkan timestamp dari firebase
//     .onSnapshot(handleSnapshot);

//   function handleSnapshot(snapshot) {
//     const messages = [];
//     snapshot.forEach(doc => {
//       //filter pesan
//       const { text, user, createdAt, receiver } = doc.data();
//       if (
//         (user === id_sender && receiver === id_receiver) ||
//         (user === id_receiver && receiver === id_sender)
//       ) {
//         messages.push({
//           id: doc.id,
//           text,
//           user,
//           createdAt,
//           receiver,
//         });
//       }
//     });
//     setMessages(messages);
//   }

//   return () => {
//     messagesRef();
//   };
// }, [id_sender, id_receiver]);

// fungsi untuk kirim pesan
  const sendMessage = async () => {
    if (inputText.length === 0 && !fileUri) {
      ToastAndroid.show('Isi Pesan atau Lampirkan File', ToastAndroid.SHORT);
      return;
    }

    if (fileUri) {
      const fileExtension = fileUri.split('.').pop();
      const storageRef = storage().ref(`attachments/${fileName}.${fileExtension}`);

      try {
        // Upload the file to Firebase Storage
        const response = await fetch(fileUri);
        const blob = await response.blob();
        await storageRef.put(blob);

        // Get the download URL of the uploaded file
        const downloadUrl = await storageRef.getDownloadURL();

        // Add a new message with the file attachment
        const messagesRef = firebase.firestore().collection('messages');
        messagesRef.add({
          text: inputText,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          user: id_sender,
          receiver: id_receiver,
          attachmentUrl: downloadUrl,
          attachmentName: fileName,
        });
      } catch (error) {
        console.log('Error uploading file:', error);
        ToastAndroid.show('Error uploading file', ToastAndroid.SHORT);
      }

      // reset state jadi kosong
      setFileUri('');
      setFileName('');
      setSelectedFileName('');
    } else {
      // buat kirim pesan kalo attachment kosong
      const messagesRef = firebase.firestore().collection('messages');
      messagesRef.add({
        text: inputText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        user: id_sender,
        receiver: id_receiver,
      });
    }

    // Reset input text
    setInputText('');
  };

  // const sendMessage = () => {

  //   if (inputText.length===0) {
  //     ToastAndroid.show('Isi Pesan Kosong', ToastAndroid.SHORT);
  //   } else {
  //     const messagesRef = firebase.firestore().collection('messages');

  //     messagesRef.add({
  //       text: inputText,
  //       createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  //       user: id_sender, // ini buat id pengirim
  //       receiver: id_receiver
      
  //     });

  //     setInputText('');
  //   }
  // };


// fungsi handler file
//===================================================================
const handleAttachment = () => {
  FilePickerManager.showFilePicker(null, (response) => {
    if (response.didCancel) {
      console.log('User cancelled file picker');
    } else if (response.error) {
      console.log('File picker error:', response.error);
    } else if (response.uri) {
      setFileUri(response.uri);
      setFileName(response.fileName);
      setSelectedFileName(response.fileName);
    }
  });
};
// =================================================================

// const handleAttachment = async () => {
//   try {
//     const res = await DocumentPicker.pick({
//       type: [DocumentPicker.types.allFiles],
//     });

//     setFileUri(res.uri);
//     setFileName(res.name);

//     setTimeout(() => {
//       console.log('File URI:', fileUri);
//       console.log('File Name:', fileName);
//     }, 0);
//   } catch (error) {
//     console.log('Error picking file:', error);
//     ToastAndroid.show('Error picking file', ToastAndroid.SHORT);
//   }
// };

//handler file downloader
const handleDownloadAttachment = async (attachmentUrl, attachmentName) => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'App needs access to your storage to download attachments.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const { dirs } = RNFetchBlob.fs;
        const dirToSave = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir;

        const fileExtension = attachmentName.split('.').pop();
        const fileDest = `${dirToSave}/${attachmentName}`;

        const res = await RNFetchBlob.config({
          fileCache: true,
          path: fileDest,
        }).fetch('GET', attachmentUrl);

        // Open the downloaded file using the appropriate app
        await FileViewer.open(fileDest);
      } else {
        console.log('Storage permission denied');
      }
    } catch (error) {
      console.log('Error downloading attachment:', error);
      ToastAndroid.show('Error downloading attachment', ToastAndroid.SHORT);
    }
  };




// pengkondisian pesan dan render item buat flatlist

const renderItem = ({ item }) => {
    const isSentByUser = item.user === id_sender;

    const messageContainerStyle = [
      styles.messageContainer,
      isSentByUser && styles.sentMessageContainer,
    ];

    const messageTextStyle = [
      styles.messageText,
      isSentByUser && styles.sentMessageText,
    ];

    return (
      <View style={messageContainerStyle}>
        {item.attachmentUrl && (
          <TouchableOpacity
            onPress={() => handleDownloadAttachment(item.attachmentUrl, item.attachmentName)}
            style={styles.attachmentContainer}
          >
            <Image
              source={require('./assets/attch.png')}
              style={styles.attachmentIcon}
            />
            <Text style={styles.attachmentName}>{item.attachmentName}</Text>
          </TouchableOpacity>
        )}
        <Text style={messageTextStyle}>{item.text}</Text>
      </View>
    );
  };

// const renderItem = ({ item }) => {
//   const isSentByUser = item.user === id_sender;

//   const messageContainerStyle = [
//     styles.messageContainer,
//     isSentByUser && styles.sentMessageContainer,
//   ];

//   const messageTextStyle = [
//     styles.messageText,
//     isSentByUser && styles.sentMessageText,
//   ];

//   return (
//     <View style={messageContainerStyle}>
//       <Text style={messageTextStyle}>
//         {item.text}
//       </Text>
//     </View>
//   );
// };




  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Image
            source={require('./assets/arrowleft.png')}
            //source={require('./assets/svg/arrowleft.svg')}
            style={styles.backbutton}
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image
            source={require('./assets/contact.png')}
            style={styles.profilepic}
          />
        </TouchableOpacity>

        <Text style={styles.name}>{name}</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        inverted
      />

      {selectedFileName && (
        <View style={styles.selectedFileContainer}>
          <Text style={styles.selectedFileName}>{selectedFileName}</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setFileUri('');
              setFileName('');
              setSelectedFileName('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton} onPress={handleAttachment}>
          <Image source={require('./assets/attch.png')} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          onChangeText={text => setInputText(text)}
          value={inputText}
          placeholder="Type your message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Image source={require('./assets/fill1.png')} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    marginRight: 8,
    padding: 8,
    borderWidth: 0,
    borderColor: '#ccc',
    borderRadius: 50,
    backgroundColor:'#DDDDDD'
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // messageText: {
  //   fontSize: 16,
  //   fontFamily:'Poppins-Regular',
  //   fontWeight: 'bold',
  // },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  sendButton:{
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6F8BED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft:5
  },

  attachmentButton:{
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6F8BED',
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft:5,
    marginRight:5
  },

  textButton:{
    color: '#FFFFFF',
    fontSize: 12,
  },
  imgBtn:{
    width: 30, height: 30
  },

  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#6F8BED',
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
    marginHorizontal: 5,
    
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 12,
    fontWeight: 300,
    color: '#fff',
    fontFamily:'Poppins-Regular',
  },
  sentMessageText: {
    color: '#000',
    fontFamily:'Poppins-Regular',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  name:{
    justifyContent:'center',
    alignItems:'center',
    marginLeft:6,
    fontSize:16,
    //marginVertical:5,
    fontFamily:'Poppins-Regular',
    marginTop:9,
    marginBottom:5,
    color:'#19192C'
  },
  backbutton:{
    marginLeft:4,
    marginRight:10,
    //marginVertical:10,
    marginTop:13,
    marginBottom:5
  },
  profilepic:{
    marginLeft:4,
    marginRight:1,
    // marginVertical:5,
    marginTop:6,
    marginBottom:5,
    borderRadius:50,
    borderWidth:1,
    borderColor:'#000'
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  attachmentName: {
    marginLeft: 5,
    color: '#036B27',
  },

  selectedFileContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 5,
  paddingHorizontal: 16,
  //marginTop:5,
  paddingTop:5,
  borderTopWidth:1,
  backgroundColor: '#ffff',
},
selectedFileName: {
  flex: 1,
  marginRight: 8,
  fontSize: 12,
  color: '#036B27',
},
cancelButton: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  backgroundColor: '#6F8BED',
  borderRadius: 4,
},
cancelButtonText: {
  color: '#FFFFFF',
  fontSize: 12,
},


});

export default ChatScreen;
