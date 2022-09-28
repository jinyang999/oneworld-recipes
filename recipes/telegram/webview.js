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

  // 文件名
  let classname = {
    friendList: '.chat-list.custom-scroll',
    ipt: "#editable-message-text",
    main: ".MessageList.custom-scroll",
    allMsg: '.text-content.with-meta',
    sendBtn: '.Button.send.default.secondary.round.click-allowed',
  }

  oneworld = settings.userData;

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data)
  })

  const telegramVersion = document
    .querySelector('meta[property="og:url"]')
    ?.getAttribute('content');

  const isWebK = telegramVersion?.includes('/k/');

  // There are two different Telegram versions for internal competition
  // Read more: https://bugs.telegram.org/c/4002/public
  const webZCount = () => {
    let directCount = 0;
    let groupCount = 0;

    const directCountSelector = document.querySelectorAll(
      '.chat-list .ListItem.private .Badge.unread:not(.muted)',
    );
    const groupCountSelector = document.querySelectorAll(
      '.chat-list .ListItem.group .Badge.unread:not(.muted)',
    );

    for (const badge of directCountSelector) {
      directCount += Ferdium.safeParseInt(badge.textContent);
    }

    for (const badge of groupCountSelector) {
      groupCount += Ferdium.safeParseInt(badge.textContent);
    }

    Ferdium.setBadge(directCount, groupCount);
  };

  const webKCount = () => {
    let directCount = 0;
    let groupCount = 0;

    const elements = document.querySelectorAll('.rp:not(.is-muted)');

    for (const element of elements) {
      const subtitleBadge = element.querySelector('.dialog-subtitle-badge');

      if (subtitleBadge) {
        const parsedValue = Ferdium.safeParseInt(subtitleBadge.textContent);

        if (element.dataset.peerId > 0) {
          directCount += parsedValue;
        } else {
          groupCount += parsedValue;
        }
      }
    }

    Ferdium.setBadge(directCount, groupCount);
  };

  const getMessages = () => {
    if (isWebK) {
      webKCount();
    } else {
      webZCount();
    }
  };

  const getActiveDialogTitle = () => {
    let element;

    element = isWebK
      ? document.querySelector('.top .peer-title')
      : document.querySelector('.chat-list .ListItem .title > h3');

    Ferdium.setDialogTitle(element ? element.textContent : '');
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  //初始化
  Ferdium.initOneWorld(() => {
    setTimeout(() => {
      console.log("ready to translation");
      setTimeForFunc(listerFriendList, 500);
      let mainLoop = setInterval(() => {
        let main = getMainView();
        if (main) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);
    }, 500)
  });

  //获取主消息列表
  const getMainView = () => {
    let view = document.querySelector(classname.main)
    return view;
  };

  //获取好友列表
  const getFriendView = () => {
    let view = document.querySelectorAll(classname.friendList);
    return view;
  };

  //好友列表监听
  const listerFriendList = () => {
    document.addEventListener(
      'click',
      e => {
        setTimeForFunc(() => {
          addClickLister(e);
        }, 1000);
      },
      true,
    );
  };

  //监听是否点击到好友列表
  const addClickLister = e => {
    let target = e.target;
    let friendView = getFriendView();
    if (friendView[0] && friendView[0].contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
    if (friendView[1] && friendView[1].contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  const freshChatList = () => {
    let msgList = document.querySelectorAll(classname.allMsg);
    for (const msg of msgList) {
      if (
        msg.parentNode.getElementsByClassName('autofanyi').length > 0 ||
        msg.parentNode.getElementsByClassName('autofanyi') > 0
      )
        continue;
      let text = msg.innerText.split('\n')[0];
      if (!text) continue;
      if (
        oneworld.settingCfg.tranflag ||
        (isGroup() && !oneworld.settingCfg.groupflag)
      ) {
        insterDiv(msg, 'autofanyi', '...');
        autoFanyi(text, msg);
      } else {
        insterDiv(msg, 'click-fanyi', '点击翻译');
        msg.parentNode
          .getElementsByClassName('click-fanyi')[0]
          .addEventListener('click', clickFanyi, true);
      }
    }
  };

  const clickFanyi = async e => {
    let div = getEventTarget(e);
    let msg = div.parent.querySelector(classname.allMsg).inner;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.innerText = res.body.data;
    div.removeEventListener('click', clickFanyi);
  };

  const autoFanyi = async (msg, msgDiv) => {
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
            'autofanyi',
          )[0].style.display = 'none';
      }
    }
  };

  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (key == 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          handleSendMessage(
            document.querySelector(classname.ipt),
            msg,
            true,
          );
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }


      },
      true,
    );
  };

  const getIptSendMsg = () => {
    let ipt = document.querySelector(classname.ipt);
    let msg = ipt.innerText;
    return msg;
  };

  /**发送消息 */
  const handleSendMessage = async (document, context) => {
    let params = getResData(context, true);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err, 'md-error');
      return;
    }
    if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/\</gi, '&lt;'); // 过滤所有的<
      result = result.replace(/\>/gi, '&gt;'); // 过滤所有的>
      document.innerHTML = result;

      let evtInput = window.document.createEvent("HTMLEvents");
      evtInput.initEvent("input", true, true);
      document.dispatchEvent(evtInput);
      // 点击发送
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  // 获取事件目标
  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
  };
  const clickSendBtn = () => {
    let sendBtn = document.querySelector(classname.sendBtn);
    let evtClick = document.createEvent('MouseEvents');
    evtClick.initEvent('click', true, true);
    sendBtn.dispatchEvent(evtClick)
  };

  //检测是否全数字
  const isNumber = str => {
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

  const getResData = (msgText, isAuto) => {
    let params = {
      word: msgText,
      from: isAuto ? oneworld.settingCfg.sfrom : oneworld.settingCfg.sto,
      to: isAuto ? oneworld.settingCfg.sto : oneworld.settingCfg.sfrom,
      type: oneworld.settingCfg.type,
    };
    return params;
  };

  const insterDiv = (parent, className, msg) => {
    parent.insertAdjacentHTML(
      'afterEnd',
      "<div class='" +
      className +
      "' style='font-size:  " +
      oneworld.settingCfg.fontsize +
      'px;color:  ' +
      oneworld.settingCfg.fontcolor +
      ";margin-left:10px;margin-right:45px;'>" +
      msg +
      '</div>',
    );
  };

  /**删除所有HTML */
  const replaceAllHtml = data => {
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
