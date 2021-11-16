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

    this.initTimer()
  }

  componentWillUnmount() {
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
    axios
      .get('https://www.hko.gov.hk/cgi-bin/gts/time5a.pr?')
      .then(res => {
        const unixDate = Number(res.data.split('=')[1]) + 700
        const time = new Date(unixDate)
        const lastSync = new Date(unixDate)
        this.setState({ dateTime: time, err: false, lastSync: lastSync }, () => {
          if (initTimer) this.initTimer()
        })
      })
      .catch(err => {
        this.setState({ dateTime: new Date(), err: true })
      })
  }

  onTouchStart = () => {
    this.syncTime(true)
  }

  render() {
    const { dateTime, err, lastSync, ww, wh } = this.state

    // Scale font size by width of screen
    const fontScale = ww / 100
    const dateFontSize = 12 * fontScale
    const timeFontSize = 20 * fontScale
    const syncFontSize = 3.6 * fontScale

    const border = wh * 0.08
    const borderStyle = [ styles.padding, { flexBasis: border } ]

    const date = getDateStr(dateTime)
    const time = getTimeStr(dateTime)

    const hasErr = err || !(lastSync instanceof Date)
    
    const syncStr = `${hasErr ? "Connection Error \n Last synchronized" : "Last Synchronized"}: \n${lastSync instanceof Date ? 
      getTimeStr(lastSync) + ", " + getDateStr(lastSync) : 'Never '}`
    const syncStyle = hasErr ? [ styles.sync, styles.err, { fontSize: syncFontSize } ] : [ styles.sync, { fontSize: syncFontSize }]


    return (
      <View style={styles.root} onTouchStart={this.onTouchStart}>
        <View style={borderStyle} />
        <View style={[ styles.main,  { paddingLeft: ww * 0.05 } ]} >
          <Text style={[ styles.time, { fontSize: timeFontSize } ]}>{time}</Text>
          <View style={[styles.dateSyncContainer, { paddingRight: ww * 0.02 }]}>
            <Text style={[ styles.date, { fontSize: dateFontSize } ]}>{date}</Text>
            <Text style={syncStyle}>{syncStr}</Text>
          </View>
        </View>
        <View style={borderStyle} />
      </View>
    )
  }
}

const blue = 'rgb(0, 43, 84)'  // 'rgb(123, 160, 240)'
const black = 'black'
const textColor = "#FAFAFA"

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',

  },
  padding: {
    backgroundColor: blue,
    // flexBasis: '10%',
    flex: 0
  },
  main: {
    backgroundColor: black,
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
    flexWrap: 'wrap'
  },
  date: {
    fontFamily: 'Myriad Pro Semibold',
    color: textColor,
  },
  time: {
    fontFamily: 'Myriad Pro Semibold',
    color: textColor,
  },
  sync: {
    fontFamily: "Myriad Pro Semibold",
    color: textColor,
  },
  err: {
    color: '#f44336',
  }
});

export default HKOTime;