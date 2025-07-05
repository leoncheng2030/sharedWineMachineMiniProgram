let _loading = false

function $uni (api, opts) {
  return new Promise(resolve => {
    uni[api](Object.assign({}, opts, {
      success: res => resolve({ data: res, status: 'success' }),
      fail: res => resolve({ data: res, status: 'fail' })
    }))
  })
}

function showLoading () {
  if (!_loading) {
    uni.showLoading({
      title: '加载中',
      complete: () => setTimeout(() => {
        _loading && uni.hideLoading()
        _loading = false
      }, 10000)
    })
  }
  _loading = true
}

function hideLoading () {
  _loading && uni.hideLoading()
  _loading = false
}

function failCallback () {
  uni.showToast({ title: '请求错误' })
}

function isFunction (val) {
  return typeof val === 'function'
}

function postData (url, data, successCallback, failCallback) {
  showLoading()
  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: 'POST',
      data: data,
      header: { 'Content-Type': 'application/json' },
      success: res => {
        isFunction(successCallback) && successCallback(res.data)
        hideLoading()
        return resolve(res.data)
      },
      fail: res => {
        isFunction(failCallback) && failCallback()
        hideLoading()
        return reject(res)
      }
    })
  })
}

function isChargeDevice (view) {
  let CHECK
  const PRE = byteChar2String([view[0]])
  const VID = byteChar2String([view[5], view[6], view[7], view[8]])
  const MYVID = byteChar2String([view[8], view[9], view[10]])
  if (VID === '002C' || VID === '003C') {
    const ID = hex2Int(int2Hex(view[11]) + '' + int2Hex(view[12]) + '' + int2Hex(view[13]))
    if (Number(ID) === 0) {
      const UUID = byteChar2String([view[14], view[15], view[16], view[17], view[18], view[19], view[20], view[21]])
      CHECK = int2Hex(view[25]) + '' + int2Hex(view[26]) + '' + int2Hex(view[27]) + '' + int2Hex(view[28])

      return { VID: VID, ID: ID, MYVID: MYVID, UUID: UUID, CHECK: CHECK }
    } else {
      const STATUS = hex2Int(int2Hex(view[14]))
      const ORDERID = hex2Int(int2Hex(view[15]) + '' + int2Hex(view[16]) + '' + int2Hex(view[17]) + '' + int2Hex(view[18]))
      let REMAINTIME = 0
      let REMAINQUANTITY = 0
      let REMAINSHOW = ''
      if (Number(view[19]) === 255 && Number(view[20]) === 255 && Number(view[21]) === 255) {
        // FFFFFF，旧固件返回-1
        REMAINTIME = 0
        REMAINQUANTITY = 0
      } else {
        if (view[19] / 128 >= 1) { // 剩余电量
          REMAINQUANTITY = hex2Int(int2Hex(view[19] % 128) + '' + int2Hex(view[20]) + '' + int2Hex(view[21]))
        } else { // 剩余时长
          REMAINTIME = hex2Int(int2Hex(view[19]) + '' + int2Hex(view[20]) + '' + int2Hex(view[21]))
          // 剩余时间超过一定值，则按天进行核算
          if (REMAINTIME >= 8323072) REMAINTIME = (REMAINTIME - 8323072) * 3600 * 24

          let MYTIME = REMAINTIME
          if (MYTIME > 86400) {
            const day = Math.floor(MYTIME / 86400)
            MYTIME -= day * 86400
            REMAINSHOW += day + '天'
          }
          if (MYTIME > 3600) {
            const hour = Math.floor(MYTIME / 3600)
            MYTIME -= hour * 3600
            REMAINSHOW += hour + '小时'
          }
          if (MYTIME > 60) {
            const minute = Math.floor(MYTIME / 60)
            MYTIME -= minute * 60
            REMAINSHOW += minute + '分钟'
          }
          if (MYTIME > 0) {
            REMAINSHOW += MYTIME + '秒'
          }
        }
      }

      const USEQUANTITY = hex2Int(int2Hex(view[22]) + '' + int2Hex(view[23]) + '' + int2Hex(view[24]))
      CHECK = int2Hex(view[25]) + '' + int2Hex(view[26]) + '' + int2Hex(view[27]) + '' + int2Hex(view[28])

      return {
        PRE,
        VID,
        ID,
        MYVID,
        STATUS,
        ORDERID,
        REMAINTIME,
        REMAINSHOW,
        REMAINQUANTITY,
        USEQUANTITY,
        CHECK
      }
    }
  }
}

function getDataArrayBuffer (dataString) {
  let data
  const arr = []
  while (dataString.length > 40) {
    data = dataString.substring(0, 40)
    const buffer = new ArrayBuffer(20)
    const dataView = new DataView(buffer)
    for (let i = 0; i < 20; i++) {
      dataView.setUint8(i, parseInt(data.substring(i * 2, i * 2 + 2), 16))
    }
    arr.push(buffer)
    dataString = dataString.substring(40, dataString.length)
  }

  data = dataString
  const buffer = new ArrayBuffer(data.length / 2)
  const dataView = new DataView(buffer)

  for (let i = 0; i < data.length / 2; i++) {
    dataView.setUint8(i, parseInt(data.substring(i * 2, i * 2 + 2), 16))
  }
  arr.push(buffer)
  return arr
}

function checkBluetooth () {
  return new Promise((resolve, reject) => {
    uni.getSetting({
      success: res => {
        if (typeof res.authSetting['scope.bluetooth'] === 'undefined') {
          uni.authorize({
            scope: 'scope.bluetooth',
            complete () {
              uni.showModal({
                content: '蓝牙授权后重试',
                showCancel: false,
                confirmText: '我知道了'
              })
              reject()
            }
          })
        }
        if (res.authSetting['scope.bluetooth'] === false) {
          uni.openSetting({
            success: () => {
              uni.showModal({
                content: '蓝牙授权后重试',
                showCancel: false,
                confirmText: '我知道了'
              })
              reject()
            }
          })
        }
        if (res.authSetting['scope.bluetooth'] === true) {
          resolve(true)
        }
      },
      fail: () => reject()
    })
  })
}

async function writeChargeData (deiceId, CMD) {
  // #ifdef MP-WEIXIN
  const res = await checkBluetooth().catch(_ => false)
  if (!res) { return }
  // #endif
  uni.showLoading({ title: '准备连接...' })
  let myDevice
  let tryCnt = 0
  let isFound = 0
  uni.openBluetoothAdapter({
    success: () => {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        interval: 100,
        complete: () => {
          uni.showLoading({ title: '发现设备中.' })
          uni.onBluetoothDeviceFound(res => {
            uni.showLoading({ title: '发现设备中(' + tryCnt + ')' })
            const devices = res.devices
            for (let i = 0; i < devices.length; i++) {
              if (devices[i].advertisData) {
                const view = new Uint8Array(devices[i].advertisData)
                const checkDevice = isChargeDevice(view)
                if (checkDevice) {
                  if (Number(checkDevice.ID) === Number(deiceId)) {
                    myDevice = devices[i]
                    if (isFound) tryCnt = 0
                    else tryCnt = 100
                    isFound = 1
                    break
                  }
                }
              }
            }
            if (tryCnt >= 20) {
              tryCnt = 0
              uni.stopBluetoothDevicesDiscovery({
                fail: res => {
                  failWrite(myDevice, res.errCode, res.errMsg)
                },
                success: () => {
                  if (myDevice) {
                    uni.showLoading({ title: '发现设备...' })
                    uni.createBLEConnection({
                      deviceId: myDevice.deviceId,
                      fail: res => {
                        failWrite(myDevice, res.errCode, res.errMsg)
                      },
                      success: async () => {
                        uni.showLoading({ title: '连接设备...' })
                        const serviceId = '00000001-0000-1000-8000-00805F9B34FB'
                        const wcharacteristicId = '00000003-0000-1000-8000-00805F9B34FB'
                        let successNum = 0
                        let failNum = 0
                        let hasService = false
                        let nowTime = 0
                        let diffTime = 0
                        const startTime = Date.now()
                        // uni.getBLEDeviceServices 在 App 中需要延时使用才能得到services
                        while (nowTime - startTime < 10000) {
                          nowTime = Date.now()
                          if (nowTime - diffTime < 1000) { continue }
                          const res = await $uni('getBLEDeviceServices', { deviceId: myDevice.deviceId })
                          if (res.status === 'fail') {
                            failWrite(myDevice, res.data.errCode, res.data.errMsg)
                            break
                          }
                          if (res.status === 'success' && res.data.services.length > 0) {
                            hasService = true
                            break
                          }
                          diffTime = nowTime
                        }
                        if (!hasService) { return }
                        uni.showLoading({ title: '连接设备...' })
                        uni.getBLEDeviceCharacteristics({
                          deviceId: myDevice.deviceId,
                          serviceId,
                          fail: res => {
                            failWrite(myDevice, res.errCode, res.errMsg)
                          },
                          success: () => {
                            uni.showLoading({ title: '连接设备...' })
                            const dataArr = getDataArrayBuffer(CMD)
                            for (let i = 0; i < dataArr.length; i++) {
                              const data = dataArr[i]
                              console.log('data: ', data)
                              uni.showLoading({ title: '发送指令...' })
                              uni.writeBLECharacteristicValue({
                                deviceId: myDevice.deviceId,
                                serviceId,
                                characteristicId: wcharacteristicId,
                                value: data,
                                success: () => successNum++,
                                fail: res => {
                                  failNum++
                                  failWrite(myDevice, res.errCode, res.errMsg)
                                },
                                complete: () => {
                                  if (successNum === dataArr.length) {
                                    successWrite(myDevice)
                                  }
                                }
                              })
                              if (failNum > 0) { break }
                              sleep(100)
                            }
                          }
                        })
                      }
                    })
                  } else {
                    uni.hideLoading()
                    uni.showModal({
                      content: '未检测到对应通电设备，请重试',
                      showCancel: false,
                      confirmText: '我知道了'
                    })
                    uni.closeBluetoothAdapter({ complete: _ => null })
                  }
                }
              })
            }
            tryCnt++
          })
        }
      })
    },
    fail: () => {
      uni.hideLoading()
      uni.showModal({
        content: '蓝牙启动失败，请开启重试',
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  })
}

function successWrite (myDevice) {
  uni.hideLoading()
  uni.showModal({
    content: '通电启动成功',
    showCancel: false,
    confirmText: '我知道了'
  })
  uni.closeBLEConnection({
    deviceId: myDevice.deviceId,
    complete: _ => null
  })
}

function failWrite (myDevice, errCode, errMsg) {
  uni.hideLoading()
  uni.showModal({
    content: errMsg,
    showCancel: false,
    confirmText: '我知道了'
  })
  uni.closeBLEConnection({
    deviceId: myDevice.deviceId,
    complete: _ => null
  })
}

function byteChar2String (byteArr) {
  const arrs = []
  for (let i = 0; i < byteArr.length; i++) {
    arrs.push(String.fromCharCode(byteArr[i]))
  }
  return arrs.join('')
}

function int2Hex (i) {
  const hex = Math.abs(i).toString(16)
  if (hex.length === 1) {
    return '0' + hex
  } else {
    return hex
  }
}

function hex2Int (hex) {
  const len = hex.length
  const a = new Array(len)
  let code
  for (let i = 0; i < len; i++) {
    code = hex.charCodeAt(i)
    if (code >= 48 && code < 58) {
      code -= 48
    } else {
      code = (code & 0xdf) - 65 + 10
    }
    a[i] = code
  }

  return a.reduce(function (acc, c) {
    acc = 16 * acc + c
    return acc
  }, 0)
}

function sleep (time) {
  const startTime = new Date().getTime() + parseInt(time, 10)
  while (new Date().getTime() < startTime) {}
}

function postCMD (data, successCallback) {
  const url = 'https://gateway.biandianxia.com/encrypt/sharedevice'
  return postData(url, data, successCallback, failCallback)
}

function postGateway (data, successCallback) {
  const url = 'https://gateway.biandianxia.com/encrypt/gateway'
  return postData(url, data, successCallback, failCallback)
}

function postUpdateKey (data, successCallback) {
  const url = 'https://gateway.biandianxia.com/updateKey'
  return postData(url, data, successCallback, failCallback)
}

export default {
  postCMD,
  postGateway,
  postUpdateKey,
  isChargeDevice,
  writeChargeData,
  checkBluetooth
}
