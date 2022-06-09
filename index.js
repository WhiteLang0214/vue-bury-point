import { fmtDate } from './src/formatter.js';

let defaultUrl = '/ud.gif';

// 浏览器信息
const browserReg = {
  Chrome: /Chrome/,
  IE: /MSIE/,
  Edg: /Edg/,
  Firefox: /Firefox/,
  Opera: /Presto/,
  Safari: /Version\/([\d.]+).*Safari/,
  '360': /360SE/,
  QQBrowswe: /QQ/,
}

// 获取数据类型
function getType(data) {
  const type = Object.prototype.toString.call(data).split(" ")[1].slice(0, -1);
  return type;
}

// 获取当前登录用户信息
function getUserInfo() {
  const userInfo = sessionStorage.getItem("store");
  if (userInfo) {
    const loginUserInfo = JSON.parse(sessionStorage.getItem("store")).loginUserInfo;
    return loginUserInfo
  }
  return {}
}

// 编码
function setEncodeUri(obj) {
  let newObj = {};
  const type = getType(obj);
  if (type === 'Object') {
    for(let key in obj) {
      newObj[key] = encodeURIComponent(obj[key])
    }
  }
  return newObj;
}

// 用户数据 公共参数
function baseUserParmas() {
  const loginUserInfo = getUserInfo();
  const obj = {
    tt: 1,
    ai: "appId", // appId web端写死一个 不同应用不同
    uk: loginUserInfo.userId,
    pt: fmtDate(),
    ct: fmtDate(),
  }
  return setEncodeUri(obj)
}

// 设备信息 公共参数
function baseDeviceParams() {
  const loginUserInfo = getUserInfo();
  const { sysName, sysVersion, browserName, browserVersion } = getUserAgent();
  const obj =  { 
    tt: 0,
    ai: "appId", // appId
    uk: loginUserInfo.userId,
    ct: fmtDate(),
    sn: sysName, // system name 操作系统名称 Intel mac os
    sv: sysVersion, // system version 操作系统版本 x 10_15_7
    dt: browserName + "/" + browserVersion, // device type 设备类型 
    b: browserName, // brand code 浏览器的信息  Chrome/102.0.0.0 Safari/537.36 
    av: "0.1.0", // app version app版本
    ti: loginUserInfo.tenantId, // 用户租户 企业id
  }
  return setEncodeUri(obj)
}

// 获取浏览器代理信息
function getUserAgent() {
  const { userAgent } = navigator;
  const reg = /^([a-zA-Z]+\/[0-9]\d*\.?\d*)\s(\([^()]*\))\s([a-zA-Z]+\/[\d\\.]*)\s(\([^()]*\))\s(.+)/;
  userAgent.match(reg);

  return {
    ...getOs(RegExp.$2),
    ...getBrowser(RegExp.$5)
  }
}

// 获取操作系统
function getOs(regExpResult) {
  let os = {};
  // 处理操作系统的类型和版本号
  const osInfo = regExpResult.replace("(", "").replace(")", "").split(" ");
  // ['Macintosh;', 'Intel', 'Mac', 'OS', 'X', '10_15_7']
  // ['Windows', 'NT', '10.0;', 'Win64;', 'x64']
  const fOs = osInfo[0].toLowerCase();
  if (fOs.includes('mac')) {
    os.sysVersion = osInfo[osInfo.length - 1];
    os.sysName = "Mac";
  }

  if (fOs.includes('windows')) {
    os.sysVersion = osInfo[2];
    os.sysName = osInfo[0]
  }
  return os
}

// 处理浏览器信息 Chrome/102.0.0.0 Safari/537.36
function getBrowser(regExpResult) {
  let os = {};
  const browserStr = regExpResult;
  for (let key in browserReg) {
    if (browserReg[key].test(browserStr)) {
      os.browserName = key;
      if (key === 'Chrome') {
        os.browserVersion = browserStr.split("Chrome/")[1].split(" ")[0]
      } else if (key === "IE") {
        os.browserVersion = browserStr.split("MSIE ")[1].split(" ")[1]
      } else if (key === "Edg") {
        os.browserVersion = browserStr.split("Edg/")[1].split(" ")[0]
      } else if (key === 'Firefox') {
        os.browserVersion = browserStr.split('Firefox/')[1]
      } else if (key === 'Opera') {
        os.browserVersion = browserStr.split('Version/')[1]
      } else if (key === 'Safari') {
        os.browserVersion = browserStr.split('Version/')[1].split(' ')[0]
      } else if (key === '360') {
        os.browserVersion = ''
      } else if (key === 'QQBrowswe') {
        os.browserVersion = browserStr.split('Version/')[1].split(' ')[0]
      }
    }
  }

  return os
}

// 遍历对象value
function getObjectValue(data) {

  let str = '';
  const soCallback = (obj) => {
    const type = getType(obj);
    // 值为对象
    if (type === 'Object') {
      for (const key in obj) {
        const v = obj[key];
        const vType = getType(v);
        if (vType === 'String' || vType === 'Number') {
          str += `${key}=${v}&`
        }
        if (vType === 'Object') {
          str += `${key}=${JSON.stringify(v)}&`
        }
      }
    }

    // 后续扩展值为字符串/数字
    // 后续扩展值为数组

  }

  soCallback(data)
  return str

}

// 获取参数
/**
 * 
 * @param {*} data string array object 
 */
/**
 * 
 * @param {*} data 
 * @param {*} flag 0:设备信息 1:用户信息
 * @returns 
 */
function getParams(data, flag) {
  const type = getType(data);
  let str = "";
  let newObj = {};

  if (flag == 0) {
    newObj = baseDeviceParams();
  }

  if (flag == 1) {
    newObj = baseUserParmas();
  }

  switch (type) {
    case 'Object': {
      newObj = { ...newObj, ...data };
      str = getObjectValue(newObj);
      break;
    }
    case 'String':
      break;
    case 'Array':
      break;
    default: {
      str = getObjectValue(newObj);
    }
  }

  return str;
}

function sendUserPoint(url = defaultUrl, params) {
  let p = getParams(params, 1);
  p = p.slice(0, p.length - 1);
  sendData(url +'?'+ p);
}

function sendDevicePoint(url = defaultUrl, params) {
  let p = getParams(params, 0);
  p = p.slice(0, p.length - 1);
  sendData(url +'?'+ p);
}

/**
 * 发送数据
 * @param {*} data 
 */
function sendData(data) {
  const img = new Image();
  img.onload = function() {};
  img.src = data;
}

const Vbpoint = {
  install(Vue) {

    // 指令
    Vue.directive('vbpoint', {
      mounted(el, binding) {
        el.addEventListener(binding['arg'], () => {
          const value = binding.value;
          const { tt, url } = value;
          let ttValue = (tt == 0 || tt == 1) ? tt : 1; // 如果没有传tt 则认为是用户数据
          let urlValue = url || defaultUrl; // 如果没传url，默认 /ud.gif
        
          if (ttValue == 0) {
            sendDevicePoint(urlValue, value);
          }
          if (ttValue == 1) {
            sendUserPoint(urlValue, value);
          }
        })
      },
      unmounted(el, binding) {
        el.removeEventListener(binding['arg'], () => {})
      },
    })

    // 实例方法
    /**
     * 埋点用户数据
     * @param {*} params 发送的参数
     */
    Vue.config.globalProperties.sendUserPoint = (url, params) => sendUserPoint(url, params);

    /**
     * 埋点设备数据
     * @param {*} params 
     */
    Vue.config.globalProperties.sendDevicePoint = (url, params) => sendDevicePoint(url, params);

  }
}


export default Vbpoint

export {
  sendUserPoint,
  sendDevicePoint
}

