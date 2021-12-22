{/* <script src="http://localhost:8097"></script> */}
import React from 'react';
import { PermissionsAndroid, StatusBar, ScrollView, ToastAndroid, FlatList, StyleSheet, Text, TextInput, View, TouchableNativeFeedback, Modal, Alert } from 'react-native';
import { Tabs, Icon, Switch, Button, ActivityIndicator } from '@ant-design/react-native';
import { MenuView } from '@react-native-menu/menu';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const utf8tohex = (str) => {
  const buffer = Buffer.from(str, 'utf8');
  return buffer.toString('hex');
}

const hexToUtf8 = (str) => {
  const buffer = Buffer.from(str, 'hex');
  return buffer.toString('utf8');
}

const getHitokoto = async () => {
  try {
    const response = await fetch('https://v1.hitokoto.cn/?c=a');
    const json = await response.json();
    return `${json.hitokoto}  ——  《${json.from}》`;
  } catch (e) {
    return `${e.message}  ——  《这下出错了》`;
  }
}

const getFormatTime = () => {
  let date = new Date();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();
  if (hour < 10) {
    hour = '0' + hour;
  }
  if (minute < 10) {
    minute = '0' + minute;
  }
  if (second < 10) {
    second = '0' + second;
  }
  return `${hour}:${minute}:${second}`;
}


class PickerOrInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selectedValue: '' }
  }

  setSelectedValue(device) {
    this.setState({ selectedValue: device.id });
    this.props.setSelectedDevice(device);
  }

  render() {
    const btnStyle = {
      flex: 1,
      margin: 10,
    }

    return (
      <View style={styles.centeredView}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.props.modalVisible}
          onRequestClose={() => { this.props.setModalInvisible() }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <FlatList
                data={this.props.data}
                renderItem={({ item }) => {
                  return <PickerItem
                    setSelectedValue={this.setSelectedValue.bind(this)}
                    item={item}
                  />
                }}
              />

              <View>
                <View>
                  <TextInput
                    onChangeText={(text) => this.setSelectedValue({ id: text })}
                    value={this.state.selectedValue}
                    placeholder='可以在此输入MAC捏🥺'
                    editable={this.props.needInput}
                    style={{
                      height: 40,
                      borderWidth: 1,
                      borderColor: 'grey',
                      marginHorizontal: 10,
                      marginTop: 10,
                      borderRadius: 5,
                    }}
                  />
                </View>


                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <View style={{ ...btnStyle, display: this.props.loading ? 'flex' : 'none' }} ><ActivityIndicator /></View>
                  <Button
                    size="small"
                    type='ghost'
                    style={btnStyle}
                    onPress={() => this.props.setModalInvisible()}
                  >取消
                  </Button>
                  <Button
                    size="small"
                    type='primary'
                    style={btnStyle}
                    onPress={() => this.props.OkBtnPress()}
                  >
                    {this.props.OkBtnText}
                  </Button>
                </View>
              </View>

            </View>
          </View>
        </Modal>
      </View>
    )
  }
}

class PickerItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TouchableNativeFeedback
        onPress={() => this.props.setSelectedValue(this.props.item)}
      >
        <View style={styles.pickerItem}>
          <Text style={{ color: 'black', fontSize: 18, fontWeight: '500' }}>{this.props.item.id}</Text>
          <Text>{this.props.item.id === this.props.item.name ? 'Unkown' : this.props.item.name}</Text>
        </View>
      </TouchableNativeFeedback>
    )
  }
}

class Block extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <TouchableNativeFeedback
        onPress={() => this.props.onBlockPress()}
      >
        <View
          style={{ ...styles.block, backgroundColor: this.props.greenBackground ? '#4CAF50' : 'white' }}
        >
          <View style={styles.blockIcon}><Icon name={this.props.iconName} size={22} color={this.props.iconColor} /></View>
          <View style={{ marginVertical: 10, marginLeft: 15 }}>
            <Text style={{ ...styles.blockTitle, color: this.props.greenBackground ? 'white' : 'black' }}>{this.props.title}</Text>
            <Text style={{ color: this.props.greenBackground ? 'white' : 'grey' }}>{this.props.desc}</Text>
          </View>

        </View>
      </TouchableNativeFeedback>

    );
  }
}

class More extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const actions = {
      help: () => {
        ToastAndroid.show('这还要帮助？', ToastAndroid.SHORT);
      },
      about: () => {
        Alert.alert('关于', `🖊：xizeyoupan\n📕：blog.2333332.xyz\n📫：me@2333332.xyz` +
          `\n\nknown issue(s):\n二刺螈浓度过低\n` +
          `\n请@quantum818 来设计或许能解决此问题`)
      },
    }
    return (
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple('#ccc', true)}
      >
        <View >
          <MenuView
            actions={[
              {
                id: 'help',
                title: '帮助',
              },
              {
                id: 'about',
                title: '关于',
              },
            ]}

            onPressAction={({ nativeEvent }) => {
              actions[nativeEvent.event]();
            }}
          >
            <View >
              <Icon name="more" size={24} color='black' />
            </View>
          </MenuView>
        </View>
      </TouchableNativeFeedback>
    )
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      device: undefined,
      selectedDevice: undefined,
      discovering: false,
      bluetoothEnabled: false,
      paired: [],
      unpaired: [],
      pairModalVisible: false,
      connectModalVisible: false,
      loading: false,
      hexChecked: true,
      inputData: '',
      sendData: '',
      infoData: '',
      readSubscription: undefined,
    };
  }

  componentDidMount() {
    this.checkBluetootEnabled().then(() => {
      if (!this.state.bluetoothEnabled) {
        Alert.alert('笑了', '不打开蓝牙你怎么玩？', [{ text: '确定' }]);
      }
    })
  }

  componentWillUnmount() {
    if (this.state.device) {
      if (this.state.device.isConnected) {
        this.state.device.disconnect();
      }
    }

    if (this.state.readSubscription) {
      this.state.readSubscription.remove();
      this.setState({ readSubscription: undefined });
    }
  }

  setSelectedDevice(device) {
    this.setState({ selectedDevice: device });
  }

  async checkBluetootEnabled() {
    try {
      let enabled = await RNBluetoothClassic.isBluetoothEnabled();
      this.setState({ bluetoothEnabled: enabled });
    } catch (error) {
      this.setState({ bluetoothEnabled: false });
    }
  }

  async requestAccessFineLocationPermission() {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Access fine location required for discovery',
        message:
          'In order to perform discovery, you must enable/allow ' +
          'fine location access.',
        buttonNeutral: 'Ask Me Later"',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK'
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  startDiscovery = async () => {
    try {
      let granted = await this.requestAccessFineLocationPermission();

      if (!granted) {
        throw new Error(`Access fine location was not granted`);
      }

      if (this.state.discovering) {
        ToastAndroid.show('逆天，已经在找了捏', ToastAndroid.SHORT);
        return;
      }

      this.setState({ discovering: true, loading: true });
      ToastAndroid.show('正在扫描捏', ToastAndroid.SHORT);
      try {
        let unpaired = await RNBluetoothClassic.startDiscovery();
        this.setState({
          unpaired: unpaired.filter(device => device.bonded === false)
        });

        ToastAndroid.show(`哈哈，竟然找到了${unpaired.length}个未配对的设备`, ToastAndroid.SHORT);

      } finally {
        this.setState({ discovering: false, loading: false });
      }
    } catch (err) {
      Alert.alert('出错了捏', err.message);
    }
  }

  getBondedDevices = async () => {
    try {
      let paired = await RNBluetoothClassic.getBondedDevices();
      this.setState({ paired });
    } catch (err) {
      Alert.alert('出错了捏', err.message);
    }
  }

  pairDevice = async () => {
    try {
      ToastAndroid.show("配对中", ToastAndroid.SHORT);
      this.setState({ loading: true });
      let device = await RNBluetoothClassic.pairDevice(this.state.selectedDevice.id);
      if (device.bonded) {
        ToastAndroid.show("配对成功:" + device.name, ToastAndroid.SHORT);
      } else {
        Alert("西巴", "另一侧设备不同意配对只能说");
      }

    } catch (err) {
      Alert.alert("出错了捏", err.message);
    } finally {
      this.setState({ loading: false });
    }

  }

  connectDevice = async () => {
    try {
      this.setState({ loading: true });

      if (this.state.device) {

        if (this.state.device.isConnected) {
          await this.state.device.disconnect();
        }
        if (this.state.readSubscription) {
          this.state.readSubscription.remove();
          this.setState({ readSubscription: undefined });
        }
        this.setState({ device: undefined });
      }

      let connected = await this.state.selectedDevice.isConnected();
      if (!connected) {
        connected = await this.state.selectedDevice.connect({
          CONNECTION_TYPE: 'binary'
          // DELIMITER: "",
        });
      }

      this.setState({ device: this.state.selectedDevice });
      let readSubscription = this.state.device.onDataReceived((data) => this.onDataReceived(data));
      this.setState({ readSubscription: readSubscription });

    } catch (error) {
      throw error;
    } finally {
      this.setState({ loading: false });
    }
  }

  onDataReceived = (data) => {
    const buffer = Buffer.from(data.data, 'base64');
    const bufHexString = buffer.toString('hex');
    const bufUtf8String = buffer.toString('utf-8');

    if (this.state.hexChecked) {
      data = bufHexString;
    } else {
      data = bufUtf8String;
    }
    this.setState((state, props) => {
      return {
        infoData: state.infoData + `\n${getFormatTime()}  接受 -> ${data}`,
      }
    });
  }

  writeDtat = async (data) => {
    try {
      let succeed = await this.state.device.write(data, this.state.hexChecked ? 'hex' : 'utf8');
      if (succeed) {
        this.setState((state, props) => {
          return {
            infoData: state.infoData + `\n${getFormatTime()}  发送 -> ${data}`,
          }
        });
      }
    } catch (err) {
      Alert.alert('出错了捏', err.message);
    }
  }

  render() {
    const tabs = [
      { title: '设置' },
      { title: '读写' },
    ];
    let cnt = 0;
    return (
      <View style={{ flex: 1, paddingHorizontal: 15, backgroundColor: 'white' }}>
        <StatusBar backgroundColor='white' barStyle='dark-content' />
        <View style={styles.header}>
          <Text style={styles.title}>Bluetooth Tool</Text>
          <More />
        </View>
        <Tabs tabs={tabs}
          style={{ flex: 14, }}
          tabBarPosition="bottom"
          tabBarTextStyle={{ color: '#757575' }}
        >

          <View style={styles.tabView}>
            <Block
              onBlockPress={() => {
                cnt++;
                if (cnt === 5) { ToastAndroid.show('你点的很好，下次不要再点了', ToastAndroid.SHORT); }
                else if (cnt === 10) { ToastAndroid.show('怎么会有这么无聊的人', ToastAndroid.SHORT); }
                else if (cnt === 20) { ToastAndroid.show('我真的怀疑有些人闲的程度啊', ToastAndroid.SHORT); }
                else if (cnt === 30) { ToastAndroid.show('新水平、新境界、新举措、新发展、新突破、新成绩、新成效、新方法、新成果、新形势、新要求、新期待、新关系、新体制、新机制、新知识、新本领、新进展、新实践、新风貌、新事物、新高度', ToastAndroid.SHORT); }
                else if (cnt === 50) { ToastAndroid.show('重要性、紧迫性、自觉性、主动性、坚定性、民族性、时代性、实践性、针对性、全局性、前瞻性、战略性、积极性、创造性、长期性、复杂性、艰巨性、可讲性、鼓动性、计划性、敏锐性、有效性', ToastAndroid.SHORT); }
                else if (cnt === 80) { ToastAndroid.show('法制化、规范化、制度化、程序化、集约化、正常化、有序化、智能化、优质化、常态化、科学化、年轻化、知识化、专业化', ToastAndroid.SHORT); }
                else if (cnt === 120) { ToastAndroid.show('政治意识、政权意识、大局意识、忧患意识、责任意识、法律意识、廉洁意识、学习意识、上进意识、管理意识', ToastAndroid.SHORT); }
                else if (cnt === 150) { ToastAndroid.show('出发点、切入点、落脚点、着眼点、结合点、关键点、着重点、着力点、根本点、支撑点', ToastAndroid.SHORT); }
                else if (cnt === 200) { ToastAndroid.show('全面推进，统筹兼顾，综合治理，融入其中，贯穿始终，切实抓好，扎实推进，加快发展，持续增收，积极稳妥，狠抓落实，从严控制， 严格执行，坚决制止，明确职责，高举旗帜，坚定不移，牢牢把握，积极争取，深入开展，注重强化，规范程序，改进作风，积极发展，努力建设，依法实行，良性 互动，优势互补，率先发展，互惠互利，做深、做细、做实、全面分析，全面贯彻，持续推进，全面落实、全面实施，逐步扭转，基本形成，普遍增加，基本建立， 更加完备，逐步完善，明显提高，逐渐好转，逐步形成，不断加强，持续增效，巩固深化，大幅提高，显著改善，不断增强，日趋完善，比较圆满', ToastAndroid.SHORT); }
                else if (cnt === 250) { ToastAndroid.show('我发现你这个人是真鸡巴无聊', ToastAndroid.SHORT); }
                else if (cnt === 280) { ToastAndroid.show('我发现你这个人是真鸡巴无聊', ToastAndroid.SHORT); }
                else if (cnt === 290) { ToastAndroid.show('我发现你这个人是真鸡巴无聊', ToastAndroid.SHORT); }
                else if (cnt === 300) { ToastAndroid.show('我发现你这个人是真鸡巴无聊', ToastAndroid.SHORT); }
                else if (cnt === 320) { ToastAndroid.show('妈的，绝了', ToastAndroid.SHORT); cnt = 0; }
              }}
              greenBackground={this.state.device}
              iconName={this.state.device ? 'check-circle' : 'close-circle'}
              iconColor={this.state.device ? 'white' : 'red'}
              title={this.state.device ? '已连接' : '未连接'}
              desc={this.state.device ? this.state.device.id : '没有连接到蓝牙'}
            />
            <Block
              iconName='import'
              iconColor='#03A9F4'
              title="扫描并配对"
              onBlockPress={async () => {
                if (this.state.unpaired.length === 0 && !this.state.discovering) {
                  this.startDiscovery();
                  this.setState({ pairModalVisible: true });
                } else if (this.state.unpaired.length !== 0 && !this.state.discovering) {
                  Alert.alert('那么问题来了', '重新扫描φ(*￣0￣)？', [
                    { text: '取消', onPress: () => { this.setState({ pairModalVisible: true }); } },
                    {
                      text: '确定', onPress: () => {
                        this.startDiscovery();
                        this.setState({ pairModalVisible: true, unpaired: [] });
                      }
                    },])
                } else if (this.state.discovering) {
                  this.setState({ pairModalVisible: true });
                }

              }}
              desc={'如果已经配对就不用这一步\n扫描过程可能会有点长\n当然你也可以手动输入MAC'}
            />
            <Block
              iconName='link'
              iconColor='#03A9F4'
              title="连接"
              desc={'如果不在列表中，请先配对\n连接过程或许会很短'}
              onBlockPress={() => {
                this.getBondedDevices();
                this.setState({ connectModalVisible: true });
              }}
            />

            <PickerOrInput
              loading={this.state.loading}
              OkBtnText="配对"
              needInput={true}
              modalVisible={this.state.pairModalVisible}
              data={this.state.unpaired}
              setSelectedDevice={device => this.setSelectedDevice(device)}
              setModalInvisible={() => { this.setState({ pairModalVisible: false }) }}
              OkBtnPress={async () => {
                await this.pairDevice();
                this.setState({ pairModalVisible: false });
              }}
            />

            <PickerOrInput
              loading={this.state.loading}
              OkBtnText="连接"
              needInput={false}
              modalVisible={this.state.connectModalVisible}
              setSelectedDevice={device => this.setSelectedDevice(device)}
              data={this.state.paired}
              setModalInvisible={() => { this.setState({ connectModalVisible: false }) }}
              OkBtnPress={async () => {
                try {
                  await this.connectDevice();
                } catch (err) {
                  Alert.alert('出错了捏', err.message);
                }
                this.setState({ connectModalVisible: false })
              }}
            />
          </View>

          <View style={styles.tabView}>
            <View style={{ ...styles.textInputContainer, flex: 2 }}>
              <TextInput
                style={styles.textInput}
                multiline={true}
                value={this.state.inputData}
                placeholder={'请在这里输入原始的数据( •̀ ω •́ )✧\n会从UTF-8编码成HEX'}
                onChangeText={(text) => {
                  this.setState({ inputData: text });
                  if (this.state.hexChecked) {
                    this.setState({ sendData: utf8tohex(text) });
                  } else {
                    this.setState({ sendData: text });
                  }
                }}
              />
              <Text style={{ textAlign: 'center', marginTop: 10 }}>👆输入框 / 👇发送框</Text>
            </View>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                multiline={true}
                value={this.state.sendData}
                placeholder={'编码后的数据在这里ヾ(≧▽≦*)o\n注意：输入框和发送框都是响应式的，修改其中任何一个另一个都会实时变化'}
                onChangeText={(text) => {
                  this.setState({ sendData: text });
                  if (this.state.hexChecked) {
                    this.setState({ inputData: hexToUtf8(text) });
                  } else {
                    this.setState({ inputData: text });
                  }
                }}
              />
            </View>

            <View style={styles.textInputContainer}>
              <ScrollView style={styles.textInput}>
                <Text>
                  {this.state.infoData}
                </Text>
              </ScrollView>
            </View>

            <View style={{ marginVertical: 5, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>

              <Button
                type='primary'
                onPress={() => {
                  if (this.state.device && this.state.device.isConnected()) {
                    this.writeDtat(this.state.sendData);
                  } else {
                    Alert.alert('你怎么那么逆天', '还没连蓝牙就开始送🐎(划掉) 码？');
                  }
                }}
              >发送
              </Button>

              <Button
                type='ghost'
                onPress={async () => {
                  const hitokoto = await getHitokoto();
                  this.setState({ inputData: hitokoto });
                  if (this.state.hexChecked) {
                    this.setState({ sendData: utf8tohex(hitokoto) });
                  } else {
                    this.setState({ sendData: hitokoto });
                  }
                }}
              >试试这个
              </Button>

              <Button
                onPress={() => {
                  this.setState({ inputData: '', sendData: '', infoData: '' });
                }}
              >清屏
              </Button>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text>Hex</Text>
                <Switch
                  checked={this.state.hexChecked}
                  onChange={() => {
                    if (!this.state.hexChecked) {
                      this.setState({ sendData: utf8tohex(this.state.inputData), hexChecked: true });
                    } else {
                      this.setState({ sendData: this.state.inputData, hexChecked: false });
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </Tabs>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tabView: {
    flex: 1,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    alignItems: 'center',
    fontWeight: '500',
    color: '#000',
  },
  block: {
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
    marginVertical: 10,
    paddingVertical: 8,
    borderColor: '#CCCCCC',
    flexDirection: 'row',
  },
  blockIcon: {
    marginTop: 15,
    marginLeft: 15,
  },
  blockTitle: {
    fontSize: 18,
    color: 'black',
    marginBottom: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
  },
  modalView: {
    maxWidth: '60%',
    maxHeight: '55%',
    left: '20%',
    borderColor: 'grey',
    borderWidth: 2,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 15,
  },
  pickerItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  textInputContainer: {
    flex: 3,
    justifyContent: 'center',
    marginTop: 10,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    flex: 1,
    textAlignVertical: 'top',
  },
});