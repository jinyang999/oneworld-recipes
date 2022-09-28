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

  const updateSettingData = (data) => {
    oneworld.settingCfg.tranflag = data.tranflag
    oneworld.settingCfg.groupflag = data.groupflag
    oneworld.settingCfg.type = data.type
    oneworld.settingCfg.fontsize = data.fontsize
    oneworld.settingCfg.fontcolor = data.fontcolor
    oneworld.settingCfg.sfrom = data.sfrom
    oneworld.settingCfg.sto = data.sto
  }

  const getMessages = () => {
    let count = 0;
    let indirectCount = 0;

    const parentChatElem = [
      ...document.querySelectorAll('div[aria-label]'),
    ].sort((a, b) => (a.offsetHeight < b.offsetHeight ? 1 : -1))[0];
    if (!parentChatElem) {
      return;
    }

    const unreadSpans = parentChatElem.querySelectorAll('span[aria-label]');
    for (const unreadElem of unreadSpans) {
      const countValue = Ferdium.safeParseInt(unreadElem.textContent);
      if (countValue > 0) {
        if (
          !unreadElem.parentNode.previousSibling ||
          unreadElem.parentNode.previousSibling.querySelectorAll(
            '[data-icon=muted]',
          ).length === 0
        ) {
          count += countValue;
        } else {
          indirectCount += countValue;
        }
      }
    }

    Ferdium.setBadge(count, indirectCount);
  };

  // inject webview hacking script
  Ferdium.injectJSUnsafe(_path.default.join(__dirname, 'webview-unsafe.js'));

  const getActiveDialogTitle = () => {
    const element = document.querySelector('header .emoji-texttt');

    Ferdium.setDialogTitle(element ? element.textContent : '');
  };

  const loopFunc = () => {
    getMessages();
    getActiveDialogTitle();
  };

  window.addEventListener('beforeunload', async () => {
    Ferdium.releaseServiceWorkers();
  });

  Ferdium.handleDarkMode(isEnabled => {
    if (isEnabled) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  });

  Ferdium.loop(loopFunc);

  Ferdium.injectCSS(_path.default.join(__dirname, 'service.css'));

  /**初始化翻译接口 */
  Ferdium.initOneWorld(() => {
    setTimeForFunc(addFreshEvent, 500);

    let mainLoop = setInterval(() => {
      let main = getMainView();
      if (main) {
        addKeyDownAndTran();
        setTimeForFunc(listerFriendList, 500);
        clearInterval(mainLoop);
      }
    }, 500);
  });

  const getMainView = () => {
    let main = document.getElementsByClassName('_3K4-L')[0];
    return main;
  };

  /**获取好友列表 */
  const getFriendView = () => {
    let friendList = document.querySelector('._3Bc7H');
    return friendList;
  };

  /**监听键盘输入 */
  const addKeyDownAndTran = () => {
    document.addEventListener(
      'keydown',
      event => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (key == 'Enter') {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          handleSendMessage(document.querySelector('._2cYbV'), msg, true);

          /**阻断事件 */
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  };

  const getIpt = () => {
    let msgInput = document.querySelector('.fd365im1');
    return msgInput.children[0].children[0];
  };

  /**获取输入框消息 */
  const getIptSendMsg = () => {
    let sendDom = document
      .querySelector('._2cYbV')
      .querySelector('._1Ae7k')
      .querySelector('button');
    if (sendDom) {
      if (document.querySelector('._2cYbV').querySelector('.fd365im1')) {
        content = document
          .querySelector('._2cYbV')
          .querySelector('.fd365im1').innerHTML;
      } else {
        content = document.querySelector(
          "div[role='textbox'] .selectable-text[data-lexical-text='true']",
        ).innerHTML;
      }
    }
    return content;
  };
  const displayEnterEvent = () => {
    let evtClick = document.createEvent('MouseEvents');
    evtClick.initEvent('click', true, true);
    document.querySelector('._1Ae7k').dispatchEvent(evtClick);
  };

  const displayIptEvent = () => {
    let ipt = getIpt();
    let iptEvent = document.createEvent('HTMLEvents');
    iptEvent.initEvent('input', true, true);
    document.querySelector('.fd365im1').dispatchEvent(iptEvent);
  };

  /**删除所有HTML */
  const replaceAllHtml = data => {
    data = data.replace(/<\/?[^>]+>/g, ''); // 过滤所有html
    data = data.replace(/\&lt;/gi, '<'); // 过滤所有的&lt;
    data = data.replace(/\&gt;/gi, '>'); // 过滤所有的&gt;
    data = data.replace(/\s+/g, '\n'); // 过滤所有的空格
    return data;
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
      if (document.querySelector('._13NKt')) {
        document.querySelector('._13NKt').children[0].children[0].innerHTML =
          result;
        let evtInput = window.document.createEvent('HTMLEvents');
        evtInput.initEvent('input', true, true);
        ddocument.querySelector('._13NKt').dispatchEvent(evtInput);
      } else {
        let evtInput = window.document.createEvent('HTMLEvents');
        evtInput.initEvent('input', true, true);
        document.querySelector("div[role='textbox']").dispatchEvent(evtInput);
        let chatInputDom = document.querySelector("div[role='textbox']");
        let inputDOM = chatInputDom['childNodes'][0]['childNodes'][0];
        let parentNode = inputDOM['parentNode'];
        let childNodes = parentNode['childNodes'];
        for (let len = childNodes['length'] - 1; len >= 0; len--) {
          if (
            childNodes['item'](len)['attributes']['data-lexical-text'] &&
            childNodes['item'](len)['attributes']['data-lexical-text']
              .value === 'true'
          ) {
            childNodes['item'](len)['childNodes'][0]['data'] = result;
          } else {
            childNodes['item'](len)['childNodes'][0]['data'] = '';
          }
        }
        let HTMLEvents = window.document['createEvent']('HTMLEvents');
        HTMLEvents['initEvent']('input', true, true);
      }

      // 点击发送
      setTimeout(() => {
        let evtClick = window.document.createEvent('MouseEvents');
        evtClick.initEvent('click', true, true);
        document
          .querySelector('._1Ae7k')
          .querySelector('button')
          .dispatchEvent(evtClick);
      }, 500);
    }
  };

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

  /** 监听用户点击操作  判断是否是好友列表 如果是 刷新界面   */
  const addClickLister = e => {
    let parent = document.querySelector('._3Bc7H');
    let target = e.target;
    if (target && parent.contains(target)) {
      setTimeForFunc(addFreshEvent, 500);
    }
  };

  /** 插入文字 */
  const insterDiv = (parent, className, msg) => {
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
      '</div>',
    );
  };

  //自动翻译
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

  /**用户点击其他位置 重新监听页面变化 */
  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  /**刷新聊天栏 插入翻译 */
  const freshChatList = () => {
    let msgList = document.querySelectorAll('._22Msk');
    for (const message of msgList) {
      let msgDiv = message.getElementsByClassName('_1Gy50')[0];
      if (!msgDiv) continue;
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
          /** 点击翻译，点击事件 */
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

  /**请求参数 */
  const getResData = (msgText, isAuto) => {
    let params = {
      word: msgText,
      from: isAuto ? oneworld.settingCfg.sfrom : oneworld.settingCfg.sto,
      to: isAuto ? oneworld.settingCfg.sto : oneworld.settingCfg.sfrom,
      type: oneworld.settingCfg.type,
    };
    return params;
  };

  const clickFanyi = async  e => {
    let div = getEventTarget(e);
    let msg = div.querySelector('._1Gy50').innerText;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.querySelector('click-fanyi').innerText = res.body.data;
    div.removeEventListener('click', clickFanyi)

  };

  // 判断群聊
  const isGroup = () => {
    let isGroup = false;
    let text = document.getElementsByClassName(
      '_2YPr_ i0jNr selectable-text copyable-text',
    )[0];
    isGroup =
      text &&
      text.innerText &&
      (text.innerText.indexOf('群组') > -1 ||
        text.innerText.indexOf('，') > -1);

    return isGroup;
  };
  // 获取事件目标
  const getEventTarget = e => {
    e = window.event || e;
    return e.srcElement || e.target;
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


};
