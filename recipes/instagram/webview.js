const _path = _interopRequireDefault(require('path'));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  let oneworld = {
    token: '',
    settingCfg: {
      tranflag: true,
      groupflag: false,
      type: 1,
      fontsize: 12,
      fontcolor: '#000000',
      from: 'zh-CHS',
      to: 'en',
    },
  };

  oneworld = settings.userData;

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data)
  })

  const classnameCfg = {
    ipt: '_ab8w  _ab94 _ab99 _ab9f _ab9m _ab9o  _abbh _abcm',
    main: '._aa5b',
    allMsg: '_aacl _aaco _aacu _aacx _aad9 _aadf',
    friendList: '._abyk',
  }

  const getMessages = () => {
    const element = document.querySelector('a[href^="/direct/inbox"]');
    Ferdium.setBadge(element ? Ferdium.safeParseInt(element.textContent) : 0);
  };

  Ferdium.loop(getMessages);

  // https://github.com/ferdium/ferdium-recipes/blob/9d715597a600710c20f75412d3dcd8cdb7b3c39e/docs/frontend_api.md#usage-4
  // Helper that activates DarkReader and injects your darkmode.css at the same time
  Ferdium.handleDarkMode((isEnabled) => {
    var url = new URL(window.location.href);
    var searchParams = url.searchParams;
    var isDarkModeParam = searchParams.get('theme');
    var changedParams = false;

    if (isEnabled) {
      isDarkModeParam
        ? null
        : (searchParams.set('theme', 'dark'), (changedParams = true));
    } else {
      isDarkModeParam
        ? (searchParams.delete('theme', 'dark'), (changedParams = true))
        : null;
    }

    changedParams
      ? ((url.search = searchParams.toString()),
        (window.location.href = url.toString()))
      : null;
  });

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));
  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    setTimeout(() => {
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
    }, 1500);
  });

  const listerFriendList = () => {
    document.addEventListener(
      'click',
      (e) => {
        setTimeForFunc(() => {
          addClickLister(e);
        }, 1000);
      },
      true
    );
  };

  const addClickLister = (e) => {
    let parent = getFriendView();
    let target = e.target;
    if (parent && target && parent.contains(target)) addFreshEvent();
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  const freshChatList = () => {
    let view = document.querySelector('._ab5w');
    if (!view) return;
    let msgList = view.getElementsByClassName(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      if (
        msgDiv.parentNode.getElementsByClassName('autofanyi').length > 0 ||
        msgDiv.parentNode.getElementsByClassName('autofanyi') > 0
      )
        continue;
      let msg = msgDiv.innerText;
      if (!msg) continue;
      if (
        !oneworld.settingCfg.tranflag ||
        (isGroup() && !oneworld.settingCfg.groupflag)
      ) {
        if (msgDiv.parentNode.children.length == 1) {
          insterDiv(msgDiv, 'click-fanyi', '点击翻译');

          msgDiv.parentNode
            .getElementsByClassName('click-fanyi')[0]
            .addEventListener('click', clickFanyi);
        }
      } else {
        insterDiv(msgDiv, 'autofanyi', '...');
        autoFanyi(msg, msgDiv);
      }
    }
  };

  const autoFanyi = (msg, msgDiv) => {
    let autoFanyi = msgDiv.parentNode.getElementsByClassName('autofanyi')[0];
    if (!oneworld.settingCfg.tranflag) if (autoFanyi) autoFanyi.innerText = '';

    if (!isNumber(msg)) {
      let params = getResData(msg, false);
      let res = await Ferdium.getTran(params, oneworld.token)
      if (!res.err && res.body.code == 200) {
        if (res.body) {
          //显示翻译内容
          msgDiv.parentNode.getElementsByClassName('autofanyi')[0].innerHTML =
            '';
          msgDiv.parentNode.getElementsByClassName('autofanyi')[0].innerHTML =
            res.body.data;
        } else
          msgDiv.parentNode.getElementsByClassName(
            'autofanyi'
          )[0].style.display = 'none';
      }
    }
  };

  const clickFanyi = async (e) => {
    let div = getEventTarget(e);
    let msg = div.getElementsByClassName(classnameCfg.allMsg)[0]
      .innerText;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.querySelector('click-fanyi').innerText = res.body.data;
    div.removeEventListener('click', clickFanyi);
};

const getMainView = () => {
  let view = document.querySelector(classnameCfg.main);
  return view;
};

const getFriendView = () => {
  let view = document.querySelector(classnameCfg.friendList);
  return view;
};

const addKeyDownAndTran = () => {
  document.addEventListener(
    'keydown',
    (event) => {
      let key = event.key;
      if (!oneworld.settingCfg.tranflag) return;
      if (key == 'Enter') {
        let msg = getIptSendMsg();
        msg = replaceAllHtml(msg);
        let ipt = document.getElementsByClassName(classnameCfg.ipt)[0]
          .childNodes[0];
        handleSendMessage(ipt, msg, true);


        /**阻断事件 */
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

    },
    true
  );
};

const getIptSendMsg = () => {
  let ipt = document.getElementsByClassName(classnameCfg.ipt)[0];
  let text = ipt.childNodes[0].innerHTML;
  return text;
};

/**
 * 发送消息
 * !本输入框使用的是textarea  修改innerHtml innerText均无效
 */
const handleSendMessage =async  (document, context) => {
  let params = getResData(context, true);
 
  let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    if (err.body.code === 200 && err.body.data) {
      let result = err.body.data;
      result = result.replace(/\</gi, '&lt;'); // 过滤所有的<
      result = result.replace(/\>/gi, '&gt;'); // 过滤所有的>
      document.value = result;
      let evtInput = window.document.createEvent('HTMLEvents');
      evtInput.initEvent('input', true, true);
      document.dispatchEvent(evtInput);

      // 点击发送
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
};

const clickSendBtn = () => {
  let sendBtn =
    document.querySelectorAll('._acan')[
    document.querySelectorAll('._acan').length - 1
    ];
  sendBtn.click();
};

const insterDiv = (parent, className, msg) => {
  if (!parent || !parent.insertAdjacentHTML) return;
  parent.insertAdjacentHTML(
    'afterEnd',
    "<div class='" +
    className +
    "' style='font-size:  " +
    oneworld.settingCfg.fontsize +
    'px;color:  ' +
    oneworld.settingCfg.fontcolor +
    ";margin-right:55px;'>" +
    msg +
    '</div>'
  );
};

const getEventTarget = (e) => {
  e = window.event || e;
  return e.srcElement || e.target;
};

//检测是否全数字
const isNumber = (str) => {
  var patrn = /^(-)?\d+(\.\d+)?$/;
  if (patrn.exec(str) == null || str == '') {
    return false;
  } else {
    return true;
  }
};
// 掩饰
const setTimeForFunc = (func, time) => {
  setTimeout(func, time);
};
const isGroup = () => {
  return false;
};

const getResData = (msgText, isAuto) => {
  let params = {
    word: msgText,
    from: isAuto ? oneworld.settingCfg.sfrom : oneworld.settingCfg.sto,
    to: isAuto ? oneworld.settingCfg.sto : oneworld.settingCfg.sfrom,
    type: oneworld.settingCfg.type,
  };
  return params;
};

const replaceAllHtml = (data) => {
  data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
  data = data.replace(/\&lt;/gi, '<'); // 过滤所有的&lt;
  data = data.replace(/\&gt;/gi, '>'); // 过滤所有的&gt;
  data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
  return data;
};



const updateSettingData = (data) => {
  oneworld.settingCfg.tranflag = data.tranflag
  oneworld.settingCfg.groupflag = data.groupflag
  oneworld.settingCfg.type = data.type
  oneworld.settingCfg.fontsize = data.fontsize
  oneworld.settingCfg.fontcolor = data.fontcolor
  oneworld.settingCfg.sfrom = data.sfrom
  oneworld.settingCfg.sto = data.sto
}
};
