import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  StatusBar,
  AppState
} from 'react-native';
import axios from 'axios'
import { FileLogger } from 'react-native-file-logger'


const padStart = (str) => {
  return String(str).padStart(2, '0')
}

/**
 * 
 * @param {Date} dateTime 
 */
function getDateStr(dateTime) {
  const YY = String(dateTime.getFullYear()).substr(2)
  const M = padStart(dateTime.getMonth() + 1)
  const d = padStart(dateTime.getDate())
  return `${d}/${M}/${YY}`
}

/**
 *  
 * @param {Date} dateTime 
 */
function getTimeStr(dateTime) {
  return `${padStart(dateTime.getHours())}:${padStart(dateTime.getMinutes())}:${padStart(dateTime.getSeconds())}`
}

class HKOTime extends Component {
  constructor(props) {
    super(props);
    const { width, height } = Dimensions.get('window')
    this.state = {
      dateTime: new Date(),
      err: false,
      appState: 'active',
      lastSync: null,
      ww: width,
      wh: height
    }
    this.appState = null
    this.syncTime = this.syncTime.bind(this)
    this.syncTime()
  }

  componentDidMount() {
    FileLogger.configure({
      maximumFileSize: 2 * 1024 * 1024, // 2MB
      captureConsole: false
    }).then(() => {
      this.dimensions = Dimensions.addEventListener('change', ({ window }) => {
        const { width, height } = window
        if (this.state.ww !== width) {
          this.setState({ ww: width, wh: height })
        }
      })
  
      StatusBar.setHidden(true)
      
      this.appState = AppState.addEventListener('change', (nextState) => {
        if (this.state.appState !== nextState) {
          if (nextState === 'active') {
            this.syncTime()
          }
          this.setState({ appState: nextState })
        }
      })
  
      FileLogger.info('Init: start timer to get HKO data')
      this.initTimer()
    })
  }

  componentWillUnmount() {
    FileLogger.info('Exit app')
    if (this.appState) {
      this.appState.remove()
    }
    if (this.dimensions) {
      this.dimensions.remove()
    }
    clearInterval(this.syncTimer)
  }


  initTimer = () => {
    clearInterval(this.syncTimer)
    const interval = 1000
    const syncInterval = 10 * 1000 / interval
    let t = 0

    this.syncTimer = setInterval(() => {
      if (t >= syncInterval) {
        t = 0
        this.syncTime()
      } else {
        const time = this.state.dateTime
        // time.setMilliseconds(time.getMilliseconds() + interval)
        time.setSeconds(time.getSeconds() + 1)
        this.setState({ dateTime: time })
      }

      t++
    }, interval)
  }

  syncTime = (initTimer) => {
    const sendTime = new Date().getTime()
    axios
      .get('https://www.hko.gov.hk/cgi-bin/gts/time5a.pr?')
      .then(res => {
        const receiveTime = new Date().getTime()
        const diff = (receiveTime - sendTime) + 300 // Also need to add processing & rendering time into diff
        const hkoTime = Number(res.data.split('=')[1]) + diff

        const dateTime = new Date(hkoTime)
        const lastSync = new Date(hkoTime) // Need to be a separate instance
        
        FileLogger.info(`${hkoTime}; diff: ${diff}`)

        this.setState({ dateTime, err: false, lastSync: lastSync }, () => {
          if (initTimer) this.initTimer()
        })
      })
      .catch(err => {
        FileLogger.error(`An error occurred when trying to sync time: ${err}`)
        this.setState({ dateTime: new Date(), err: true })
      })
  }

  onTouchStart = () => {
    this.syncTime(true)
  }

  render() {
    const { dateTime, err, lastSync, ww, wh } = this.state

    // Font sizes, scaled by screen width
    const fontScale = ww / 100
    const dateFontSize = 12 * fontScale // 96
    const timeFontSize = 20 * fontScale // 60
    const syncFontSize = 3.6 * fontScale // 12

    // Top & Btm borders, scaled by screen height
    const border = wh * 0.08

    // Left & Right text padding, scaled by screen width
    const paddingLeft = ww * 0.05
    const paddingRight = ww * 0.02

    // Color styles
    const borderBlue = 'rgb(0, 43, 84)'  // 'rgb(123, 160, 240)'
    const bgBlack = 'black'
    const textWhite = "#FAFAFA"
    const errorRed = '#F44336'

    const borderStyle = [ styles.padding, { backgroundColor: borderBlue, flexBasis: border } ]

    const date = getDateStr(dateTime)
    const time = getTimeStr(dateTime)

    const hasErr = err || !(lastSync instanceof Date)
    
    const syncStr = lastSync instanceof Date ? getTimeStr(lastSync) + ", " + getDateStr(lastSync) : 'Never'
    const syncColor = hasErr ? errorRed : textWhite
    const syncStyle = [ styles.sync, { color: syncColor, fontSize: syncFontSize } ]

    return (
      <View style={styles.root} onTouchStart={this.onTouchStart}>
        <View style={borderStyle} />
        <View style={[ styles.main,  { backgroundColor: bgBlack, paddingLeft } ]} >
          <Text style={[ styles.time, { color: textWhite, fontSize: timeFontSize } ]}>{time}</Text>
          <View style={[styles.dateSyncContainer, { color: textWhite, paddingRight }]}>
            <Text style={[ styles.date, { color: textWhite, fontSize: dateFontSize } ]}>{date}</Text>
            <View >
              {hasErr && <Text style={syncStyle} numberOfLines={1}>Connection Error</Text>}
              <Text style={syncStyle}>Last synchronization</Text>
              <Text style={syncStyle}>{syncStr}</Text>
            </View>
          </View>
        </View>
        <View style={borderStyle} />
      </View>
    )
  }
}


const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',

  },
  padding: {
    // flexBasis: '10%',
    flex: 0
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  dateSyncContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'nowrap',
    paddingBottom: 8
  },
  syncContainer: {

  },
  date: {
    fontFamily: 'Myriad Pro Semibold',
  },
  time: {
    fontFamily: 'Myriad Pro Semibold',
  },
  sync: {
    fontFamily: "Myriad Pro Semibold",
  }
});

export default HKOTime;