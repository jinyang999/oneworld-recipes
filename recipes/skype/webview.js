const _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  let oneworld = {
    token: "",
    settingCfg: {
      tranflag: true,
      groupflag: false,
      type: 1,
      fontsize: 12,
      fontcolor: "#000000",
      from: "zh-CHS",
      to: "en",
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

  const classnameCfg = {
    ipt: ".public-DraftStyleDefault-block.public-DraftStyleDefault-ltr",
    sendBtn: "button[title='发送消息']",
    main: ".rxCustomScroll.rxCustomScrollV.active",
    allMsg:
      "div[style='position: relative; display: flex; flex-direction: column; flex-grow: 0; flex-shrink: 0; overflow: hidden; align-items: stretch; padding-left: 11px; padding-right: 12px; padding-top: 9px;']",
    friendList:
      "div[style='will-change: padding-top, height, contents, scroll-position; height: 316px; overflow: hidden;']",
  }

  const getMessages = () => {
    let count = 0;
    const container = document.querySelector('[role="tablist"] > button > div');

    if (container) {
      const children = container.children;

      if (children.length === 3) {
        const elementContainer = children[children.length - 1];

        if (elementContainer) {
          const element = elementContainer.querySelector(
            "[data-text-as-pseudo-element]"
          );
          if (element && element.dataset) {
            count = Ferdium.safeParseInt(element.dataset.textAsPseudoElement);
          }
        }
      }
    }

    Ferdium.setBadge(count);
  };

  Ferdium.loop(getMessages);

  Ferdium.injectCSS(_path.default.join(__dirname, "service.css"));
  Ferdium.injectJSUnsafe(_path.default.join(__dirname, "webview-unsafe.js"));

  // TODO: See how this can be moved into the main ferdium app and sent as an ipc message for opening with a new window or same Ferdium recipe's webview based on user's preferences
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest('a[href^="http"]');
      const button = event.target.closest('button[title^="http"]');

      if (link || button) {
        const url = link
          ? link.getAttribute("href")
          : button.getAttribute("title");

        event.preventDefault();
        event.stopPropagation();

        if (settings.trapLinkClicks === true) {
          window.location.href = url;
        } else {
          Ferdium.openNewWindow(url);
        }
      }
    },
    true
  );

  Ferdium.initOneWorld(() => {

    console.log("ready to translation");
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
      "click",
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
      freshChatList();
      view.removeEventListener("DOMNodeInserted", freshChatList);
      view.addEventListener("DOMNodeInserted", freshChatList, true);
    }
  };

  const freshChatList = () => {
    let view = getMainView();
    if (!view) return;
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
    for (const msgDiv of msgList) {
      if (
        msgDiv.parentNode.getElementsByClassName("autofanyi").length > 0 ||
        msgDiv.parentNode.getElementsByClassName("autofanyi") > 0
      )
        continue;
      let msg = msgDiv.innerText;
      if (!msg) continue;
      if (
        !oneworld.settingCfg.tranflag ||
        (isGroup() && !oneworld.settingCfg.groupflag)
      ) {
        if (msgDiv.parentNode.children.length == 1) {
          insterDiv(msgDiv, "click-fanyi", "点击翻译");

          msgDiv.parentNode
            .getElementsByClassName("click-fanyi")[0]
            .addEventListener("click", clickFanyi);
        }
      } else {
        insterDiv(msgDiv, "autofanyi", "...");
        autoFanyi(msg, msgDiv);
      }
    }
  };

  const autoFanyi = async (msg, msgDiv) => {
    let autoFanyi = msgDiv.parentNode.getElementsByClassName("autofanyi")[0];
    if (!oneworld.settingCfg.tranflag) if (autoFanyi) autoFanyi.innerText = "";

    if (!isNumber(msg)) {
      let params = getResData(msg, false);
      let res = await Ferdium.getTran(params, oneworld.token)
      if (!res.err && res.body.code == 200) {
        if (res.body) {
          //显示翻译内容
          msgDiv.parentNode.getElementsByClassName("autofanyi")[0].innerHTML =
            "";
          msgDiv.parentNode.getElementsByClassName("autofanyi")[0].innerHTML =
            res.body.data;
        } else
          msgDiv.parentNode.getElementsByClassName(
            "autofanyi"
          )[0].style.display = "none";
      }
    }
  };

  const clickFanyi = async (e) => {
    let div = getEventTarget(e);
    let msg = div.parentNode.querySelector(classnameCfg.allMsg).value;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.innerText = body.res.data;
    div.removeEventListener("click", clickFanyi);
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
      "keydown",
      (event) => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (key == "Enter") {
          let msg = getIptSendMsg();
          msg = replaceAllHtml(msg);
          let ipt = document.querySelector(classnameCfg.ipt);
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
    let ipt = document.querySelector(classnameCfg.ipt);
    let text = ipt.innerHTML;
    return text;
  };

  /**
   * 发送消息
   * !本输入框使用的是textarea  修改innerHtml innerText均无效
   */
  const handleSendMessage = async (document, context) => {
    let params = getResData(context, true);

    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err, "md-error");
      return;
    }
    if (res.body.code === 200 && res.body.data) {
      let result = res.body.data;
      result = result.replace(/\</gi, "&lt;"); // 过滤所有的<
      result = result.replace(/\>/gi, "&gt;"); // 过滤所有的>
      document.querySelector("span[data-text='true']").innerHTML = result;
      mdInputFoucsLastIndex(document);
      let evtInput = window.document.createEvent("HTMLEvents");
      evtInput.initEvent("input", true, true);
      document.dispatchEvent(evtInput);

      // 点击发送
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  const clickSendBtn = () => {
    let sendBtn = document.querySelector(classnameCfg.sendBtn);
    sendBtn.click();
  };

  const insterDiv = (parent, className, msg) => {
    if (!parent || !parent.insertAdjacentHTML) return;
    parent.insertAdjacentHTML(
      "afterEnd",
      "<div class='" +
      className +
      "' style='font-size:  " +
      oneworld.settingCfg.fontsize +
      "px;color:  " +
      oneworld.settingCfg.fontcolor +
      ";margin-right:40px;margin-left:10px;'>" +
      msg +
      "</div>"
    );
  };

  const getEventTarget = (e) => {
    e = window.event || e;
    return e.srcElement || e.target;
  };

  //检测是否全数字
  const isNumber = (str) => {
    var patrn = /^(-)?\d+(\.\d+)?$/;
    if (patrn.exec(str) == null || str == "") {
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
    data = data.replace(/<\/?[^>]+>/g, ""); // 过滤所有html
    data = data.replace(/\&lt;/gi, "<"); // 过滤所有的&lt;
    data = data.replace(/\&gt;/gi, ">"); // 过滤所有的&gt;
    data = data.replace(/\s+/g, "\n"); // 过滤所有的空格
    return data;
  };

  /**
   * 获取聊天输入框焦点并定位光标到最后一个文本后面
   * @param {*} obj
   */
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


};
