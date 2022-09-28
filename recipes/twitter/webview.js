module.exports = (Ferdium, settings) => {

  let oneworld = {
    token: '',
    settingCfg: {
      tranflag: true,
      groupflag: false,
      type: 1,
      fontsize: 12,
      fontcolor: '#000000',
      sfrom: 'zh-CHS',
      sto: 'en',
    },

  };

  oneworld = settings.userData;

  console.log("ready to translation", settings);

  const classnameCfg = {
    ipt: ".DraftEditor-editorContainer .public-DraftEditor-content span[data-text='true']",
    main: '.css-1dbjc4n.r-16y2uox.r-1h0z5md.r-1jgb5lz.r-1ye8kvj.r-ymttw5.r-hbs49y.r-13qz1uu',
    allMsg: '.card--text',
    friendList: '.css-1dbjc4n.r-14lw9ot.r-16y2uox.r-1jgb5lz.r-1ye8kvj.r-13qz1uu',
    sendBtn1: '.css-18t94o4.css-1dbjc4n.r-1niwhzg.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-13hce6t.r-2yi16.r-1qi8awa',
    sendBtn2: '.css-1dbjc4n.r-1niwhzg.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-13hce6t.r-2yi16.r-1qi8awa.r-icoktb.r-1ny4l3l.r-o7ynqc.r-6416eg.r-lrvibr'
  }
  const getMessages = () => {
    let direct = 0;

    // "Notifications" and "Messages" - aria-label ending in
    // "unread items". Sum the values for direct badge.
    const notificationsElement = document.querySelector(
      '[data-testid=AppTabBar_Notifications_Link] div div div'
    );
    if (notificationsElement) {
      direct += Ferdium.safeParseInt(notificationsElement.textContent);
    }
    const DMElement = document.querySelector(
      '[data-testid=AppTabBar_DirectMessage_Link] div div div'
    );
    if (DMElement) {
      direct += Ferdium.safeParseInt(DMElement.textContent);
    }

    Ferdium.setBadge(direct);
  };

  Ferdium.loop(getMessages);

  Ferdium.ipcRenderer.on('service-settings-update', (res, data) => {
    updateSettingData(data)
  })

  /**以下为翻译代码 */

  Ferdium.initOneWorld(() => {
    setTimeout(() => {
      setTimeout(() => {
        Ferdium.getToken();
        let mainLoop = setInterval(() => {
          if (!getMainView) return;
          let view = getMainView();
          if (view) {
            addKeyDownAndTran();
            setTimeForFunc(addFreshEvent, 500);
            clearInterval(mainLoop);
          }
        }, 500);
        setTimeForFunc(listerFriendList, 500);
      }, 1000);
    }, 500);
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
    let target = e.target;
    if (checkClickInFrendList(target)) setTimeForFunc(addFreshEvent, 500);
  };

  const addFreshEvent = () => {
    let view = getMainView();
    if (view) {
      view.removeEventListener('DOMNodeInserted', freshChatList);
      view.addEventListener('DOMNodeInserted', freshChatList, true);
    }
  };

  const freshChatList = () => {
    let msgList = getMsgList();
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

  const clickFanyi = async (e) => {
    let div = getEventTarget(e);
    let msg = div.parentNode.querySelector('.css-901oao.r-37j5jr.r-a023e6.r-16dba41.r-rjixqe.r-bcqeeo.r-1udh08x.r-bnwqim.r-fdjqy7.r-1rozpwm.r-qvutc0').innerText;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.innerText = res.body.data;
    div.removeEventListener('click', clickFanyi);

  };

  const autoFanyi =async  (msg, msgDiv) => {
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

  const getMainView = () => {
    let view = document.querySelector(classnameCfg.main);
    return view;
  };

  const checkClickInFrendList = (target) => {
    let view = document.querySelector(classnameCfg.friendList);;
    if (view && view.contains(target)) return true;
    return false;
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
          let ipt = getIpt();
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
    let ipt = getIpt();
    let text = ipt.innerHTML;
    return text;
  };

  const getIpt = () => {
    let ipt = document.querySelector(classnameCfg.ipt);
    return ipt;
  };

  /**
   * 发送消息
   * !本输入框使用的是textarea  修改innerHtml innerText均无效
   */
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
        mdInputFoucsLastIndex(document);

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
    let sendBtn1 = document.querySelector(classnameCfg.sendBtn1);
    let sendBtn2 = document.querySelector(classnameCfg.sendBtn2);
    let sendBtn = sendBtn1 ? sendBtn1 : sendBtn2
    sendBtn.click();
  };

  function getMsgList() {
    let list = [];
    let list1 = [];
    let list2 = [];
    list1 = document.getElementsByClassName(
      'css-901oao r-jwli3a r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-1udh08x r-bnwqim r-fdjqy7 r-qvutc0'
    );
    if (list1.length <= 0) {
      list1 = document.getElementsByClassName('css-1dbjc4n r-obd0qt r-1wbh5a2');
    }
    list2 = document.getElementsByClassName(
      'css-901oao r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-1udh08x r-bnwqim r-fdjqy7 r-1rozpwm r-qvutc0'
    );
    for (const key of list1) {
      list.push(key);
    }
    for (const key of list2) {
      list.push(key);
    }
    return list;
  }

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

  const mdInputFoucsLastIndex = (obj) => {
    if (window.getSelection) {
      //ie11 10 9 ff safari
      obj.focus(); //解决ff不获取焦点无法定位问题
      var range = window.getSelection(); //创建range
      range.selectAllChildren(obj); //range 选择obj下所有子内容
      range.collapseToEnd(); //光标移至最后
    } else if (document.selection) {
      //ie10 9 8 7 6 5
      var range = document.selection.createRange(); //创建选择对象
      //var range = document.body.createTextRange();
      range.moveToElementText(obj); //range定位到obj
      range.collapse(false); //光标移至最后
      range.select();
    }
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
