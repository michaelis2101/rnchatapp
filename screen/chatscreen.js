import React, { useState, useEffect } from 'reactn';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore'

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // setInterval(() => {
  //   setCurrentDate(new Date());
  // }, 1000);

  const route = useRoute();
  const { name,id_receiver,id_sender, name_sender } = route.params;

  useEffect(() => {
    //const messagesRef = firebase.firestore().collection('messages');
    const messagesRef = firebase.firestore().collection('messages')
    .where('user', 'in', [id_sender, id_receiver])
    .where('receiver', 'in', [id_sender, id_receiver]);

    messagesRef.onSnapshot(querySnapshot => {
    const messages = querySnapshot.docs.map(doc => {
      const { text, user, createdAt, receiver } = doc.data();
      return {
        id: doc.id,
        text,
        user,
        createdAt,
        receiver,
      };
    }).filter(message => message !== null);

    setMessages(messages);
    // messagesRef.onSnapshot(querySnapshot => {
    //   const messages = querySnapshot.docs.map(doc => {
    //     const { text, user, createdAt } = doc.data();
    //     if(name==user){
    //         return {
    //         id: doc.id,
    //         text,
    //         user,
    //         //createdAt: createdAt.toDate(),
    //         createdAt,
    //         receiver,
    //       };
    //     }
    //     return null;
    //   }).filter(message => message !== null);
    });

    // messagesRef.onSnapshot(querySnapshot => {
    //   const messages = querySnapshot.docs.map(doc => {
    //     const { text, user, createdAt } = doc.data();
        
    //     return {
    //       id: doc.id,
    //       text,
    //       user,
    //       createdAt: createdAt.toDate(),
    //     };
    //   });

    //   setMessages(messages);
    // });


  }, []);

  const sendMessage = () => {
    const messagesRef = firebase.firestore().collection('messages');

    messagesRef.add({
      text: inputText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      user: id_sender, // ini buat id pengirim
      receiver: id_receiver
      
    });

    setInputText('');
  };



 const renderItem = ({ item }) => {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{item.user}: {item.text}</Text>
        <Text style={styles.messageTime}>{item.createdAt.toString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          onChangeText={text => setInputText(text)}
          value={inputText}
          placeholder="Type your message..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default ChatScreen;
