const _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

module.exports = (Ferdium, settings) => {
  const oneworld = {
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
    className: {
      ipt: ".markup-eYLPri.editor-H2NA06",
      main: ".scrollerInner-2PPAp2",
      allMsg: ".gvMessageItem-content",
      friendList: ".md-virtual-repeat-scroller",
      sendBtn: ".mat-primary.ng-star-inserte",
    },
  };
  const getMessages = () => {
    let directCount = 0;
    const directCountPerServer = document.querySelectorAll(
      '[class*="lowerBadge-"] [class*="numberBadge-"]'
    );

    for (const directCountBadge of directCountPerServer) {
      directCount += Ferdium.safeParseInt(directCountBadge.textContent);
    }

    const indirectCountPerServer = document.querySelectorAll(
      '[class*="modeUnread-"]'
    ).length;

    Ferdium.setBadge(directCount, indirectCountPerServer);
  };

  Ferdium.loop(getMessages);

  Ferdium.injectCSS(_path.default.join(__dirname, "service.css"));

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
        const skipDomains = [
          /^https:\/\/discordapp\.com\/channels\//i,
          /^https:\/\/discord\.com\/channels\//i,
        ];

        let stayInsideDiscord;
        skipDomains.every((skipDomain) => {
          stayInsideDiscord = skipDomain.test(url);
          return !stayInsideDiscord;
        });

        if (!Ferdium.isImage(link) && !stayInsideDiscord) {
          event.preventDefault();
          event.stopPropagation();

          if (settings.trapLinkClicks === true) {
            window.location.href = url;
          } else {
            Ferdium.openNewWindow(url);
          }
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
          // setTimeForFunc(addFreshEvent, 500);
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
    let msgList = document.querySelectorAll(oneworld.className.allMsg);
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
        if (body) {
          //显示翻译内容
          msgDiv.parentNode.getElementsByClassName("autofanyi")[0].innerHTML =
            "";
          msgDiv.parentNode.getElementsByClassName("autofanyi")[0].innerHTML =
            body.data;
        } else
          msgDiv.parentNode.getElementsByClassName(
            "autofanyi"
          )[0].style.display = "none";
      }
    }
  };

  const clickFanyi = async (e) => {
    let div = getEventTarget(e);
    let msg = div.parentNode.querySelector(oneworld.className.allMsg).value;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(res.err);
      return;
    }
    div.innerText = res.body.data;
    div.removeEventListener("click", clickFanyi);
  };

  const getMainView = () => {
    let view = document.querySelector(oneworld.className.main);
    return view;
  };

  const getFriendView = () => {
    let view = document.querySelector(oneworld.className.friendList);
    return view;
  };

  const addKeyDownAndTran = () => {
    document.addEventListener(
      "keydown",
      (event) => {
        let key = event.key;
        if (!oneworld.settingCfg.tranflag) return;
        if (key != "Enter") return;
        let msg = getIptSendMsg();
        msg = replaceAllHtml(msg);
        let ipt = document.querySelector(oneworld.className.ipt);
        handleSendMessage(ipt, msg, true);

        /**阻断事件 */
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      },
      true
    );
  };

  const getIptSendMsg = () => {
    let ipt = document.querySelector(oneworld.className.ipt);
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
    if (body.code === 200 && body.data) {
      let result = body.data;
      result = result.replace(/\</gi, "&lt;"); // 过滤所有的<
      result = result.replace(/\>/gi, "&gt;"); // 过滤所有的>
      document.innerHTML = result;
      let evtInput = window.document.createEvent("HTMLEvents");
      evtInput.initEvent("input", true, true);
      document.dispatchEvent(evtInput);

      // 点击发送
      setTimeout(() => {
        clickSendBtn(document);
      }, 500);
    }

  };

  const clickSendBtn = (document) => {
    const t = new KeyboardEvent("keydown", {
      keyCode: 13,
      key: "Enter",
      code: "Enter",
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(t);
    const e = new KeyboardEvent("keypress", {
      keyCode: 13,
      key: "Enter",
      code: "Enter",
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(e);
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
      ";margin-right:55px;'>" +
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
};
