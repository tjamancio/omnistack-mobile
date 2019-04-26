import React, { Component } from 'react';
import { Text, View, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { distanceInWords } from 'date-fns';
import pt from 'date-fns/locale/pt';

import styles from './styles'
import api from '../../services/api';
import ImagePicker from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import socket from 'socket.io-client';

export default class Box extends Component {

    state = {
        box: {}
    }

    async componentDidMount() {
        this.subscribeToNewFiles();
        const box = await AsyncStorage.getItem('@RocketBox:box');
        const response = await api.get(`boxes/${box}`);

        this.setState({ box: response.data });
    }

    subscribeToNewFiles = async () => {
        const boxId = await AsyncStorage.getItem('@RocketBox:box');
        const io = socket("https://omnistack-backend102.herokuapp.com");

        io.emit('connectRoom', boxId);

        io.on('file', data => {
            this.setState({ box: { ...this.state.box, files: [data, ...this.state.box.files] } })
        })

    }

    handleUpload = () => {
        ImagePicker.launchImageLibrary({}, async upload => {
            if (upload.error) {
                console.log('ImagePIcker error');
            } else if (upload.didCancel) {
                console.log('Canceled by user')
            } else {

                const data = new FormData();
                const [prefix, suffix] = upload.fileName.split('.');
                const ext = suffix.toLocaleLowerCase() === 'heic' ? 'jpg' : suffix;
                data.append('file', {
                    uri: upload.uri,
                    type: upload.type,
                    name: `${prefix}.${ext}`
                });

                api.post(`boxes/${this.state.box._id}/files`, data);
            }
        })
    }

    openFile = async file => {
        try {

            const filePath = `${RNFS.DocumentDirectoryPath}/${file.title}`;
            console.log(file.url);
            console.log(filePath);
            RNFS.downloadFile({
                fromUrl: file.url,
                toFile: filePath,
                background: true
            }).promise.then(success => {
                console.log('fim');
            });

            await FileViewer.open(filePath);


        } catch (err) {
            console.log(err);
            console.log('Arquivo não suportado')
        }
    }

    renderItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => this.openFile(item)}
            style={styles.file}
        >
            <View style={styles.fileInfo}>
                <Icon name='insert-drive-file' size={24} color='#a5cfff' />
                <Text style={styles.fileTitle}>{item.title}</Text>
            </View>
            <Text style={styles.fileDate}>
                há {distanceInWords(item.createdAt, new Date(), {
                    locale: pt
                })}
            </Text>
        </TouchableOpacity>
    )

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.boxTitle}> {this.state.box.title} </Text>
                <FlatList
                    style={styles.list}
                    data={this.state.box.files}
                    keyExtractor={file => file._id}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    renderItem={this.renderItem}
                />

                <TouchableOpacity style={styles.fab} onPress={this.handleUpload}>
                    <Icon name='cloud-upload' size={24} color='#fff' />

                </TouchableOpacity>
            </View>
        )
    }
}
