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
    ipt: 'pbevjfx6 icdlwmnq om3e55n1 l4e6dv8b cgu29s5g effxes4x lgak1ieh aeinzg81 mm05nxu8 notranslate',
    sendBtn:
      'qi72231t o9w3sbdw nu7423ey tav9wjvu flwp5yud tghlliq5 gkg15gwv s9ok87oh s9ljgwtm lxqftegz bf1zulr9 frfouenu bonavkto djs4p424 r7bn319e bdao358l fsf7x5fv tgm57n0e s5oniofx m8h3af8h kjdc1dyq dnr7xe2t aeinzg81 om3e55n1 cr00lzj9 rn8ck1ys s3jn8y49 g4tp4svg o9erhkwx dzqi5evh hupbnkgi hvb2xoa8 fxk3tzhb jl2a5g8c f14ij5to l3ldwz01 icdlwmnq jez8cy9q c7y9u1f0 q46jt4gp b0eko5f3 r5g9zsuq fwlpnqze b7mnygb8 iec8yc8l',
    main: 'hkn4rbhj qmz08dgh lq84ybu9 hf30pyar',
    allMsg: '.ne6e0wym',
    friendList1:
      'alzwoclg cqf1kptm cgu29s5g i15ihif8 sl4bvocy lq84ybu9 efm7ts3d om3e55n1 mfclru0v',
    friendList2: 'ssrb_rhc_start',
  }
  const getNotifications = function getNotifications() {
    let count = 0;

    const queryList = document.querySelectorAll(
      '.bp9cbjyn.bwm1u5wc.pq6dq46d.datstx6m.taijpn5t.jb3vyjys.jxrgncrl.qt6c0cv9.qnrpqo6b.k4urcfbm',
    );
    for (const element of queryList) {
      count += Ferdium.safeParseInt(element.textContent);
    }

    Ferdium.setBadge(count);
  };

  const getActiveDialogTitle = () => {
    const element = [
      document.querySelector(
        '.cbu4d94t:not(.kr9hpln1) .l9j0dhe7 .pfnyh3mw .g5gj957u .ni8dbmo4.stjgntxs.g0qnabr5.ltmttdrg.ekzkrbhg.mdldhsdk.oo9gr5id',
      ),
      document.querySelector(
        '.j83agx80.cbu4d94t.d6urw2fd.dp1hu0rb.l9j0dhe7.du4w35lb:not(.kr9hpln1) .rq0escxv[role="main"] .t6p9ggj4.tkr6xdv7 .d2edcug0.j83agx80.bp9cbjyn.aahdfvyu.bi6gxh9e .a8c37x1j.ni8dbmo4.stjgntxs.l9j0dhe7.ltmttdrg.g0qnabr5.ojkyduve a.lzcic4wl.gmql0nx0.gpro0wi8.lrazzd5p',
      ),
    ].find(Boolean);

    Ferdium.setDialogTitle(element ? element.textContent : null);
  };

  const loopFunc = () => {
    getNotifications();
    getActiveDialogTitle();
  };

  Ferdium.loop(loopFunc);

  Ferdium.initOneWorld(() => {
    console.log('ready to translation');
    setTimeout(() => {
      let mainLoop = setInterval(() => {
        let view = getMainView();
        if (view) {
          addKeyDownAndTran();
          setTimeForFunc(addFreshEvent, 500);
          clearInterval(mainLoop);
        }
      }, 500);

      setTimeForFunc(listerFriendList, 500);
    }, 500);
  });

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

  const addClickLister = e => {
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
    let msgList = document.querySelectorAll(classnameCfg.allMsg);
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

  const clickFanyi = async e => {
    let div = getEventTarget(e);
    let msg = div.querySelector(classnameCfg.allMsg).innerText;
    let params = getResData(msg);
    let res = await Ferdium.getTran(params, oneworld.token)
    if (res.err) {
      console.log(err);
      return;
    }
    div.querySelector('click-fanyi').innerText = res.body.data;
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

  const getMainView = () => {
    let view = document.getElementsByClassName(classnameCfg.main)[0];
    return view;
  };

  const checkClickInFrendList = target => {
    let view1 = document.getElementsByClassName(
      classnameCfg.friendList1,
    )[0];
    let view2 = document.getElementById(classnameCfg.friendList2);
    if (view1 && view1.contains(target)) return true;
    if (view2 && view2.parentNode && view2.contains(target)) return true;
    return false;
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
          let ipt = document.getElementsByClassName(classnameCfg.ipt)[0];
          handleSendMessage(ipt, msg, true);
        }

        /**阻断事件 */
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      },
      true,
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
      let chatInputDom = document;
      let inputDOM = chatInputDom['childNodes'][0]['childNodes'][0];
      let parentNode = inputDOM['parentNode'];
      let childNodes = parentNode['childNodes'];
      for (let len = childNodes['length'] - 1; len >= 0; len--) {
        if (
          childNodes['item'](len)['attributes']['data-lexical-text'] &&
          childNodes['item'](len)['attributes']['data-lexical-text'].value ===
          'true'
        ) {
          childNodes['item'](len)['childNodes'][0]['data'] = result;
        } else {
          childNodes['item'](len)['childNodes'][0]['data'] = '';
        }
      }
      let HTMLEvents = window.document['createEvent']('HTMLEvents');
      HTMLEvents['initEvent']('input', true, true);

      // 点击发送
      setTimeout(() => {
        clickSendBtn();
      }, 500);
    }
  };

  const clickSendBtn = () => {
    let sendBtn = document.getElementsByClassName(
      classnameCfg.sendBtn,
    )[0];
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
      '</div>',
    );
  };

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
