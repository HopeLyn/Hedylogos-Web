// 如果不存在消息DIV容器，新建一个
checkChatExist = function (id) {
  if ($('#conversation-' + id).length === 0) {
    Blaze.renderWithData(Template.conversation, {'id': id}, $('.im-chat-info-container')[0]);
  }
  return;
}

/*
 * 显示己方分送的信息
 */
showSendMsg = function (receiverId, content) {
  // 还不存在会话窗口，新建dom容器
  checkChatExist(receiverId);
  var senderInfo = Meteor.user();
  senderInfo = _.extend(senderInfo, {'contents': content});
  Blaze.renderWithData(Template.sendedMsg, senderInfo, $('#conversation-' + receiverId)[0]);
}


/* 显示收到的信息
chatType: "single"
className: "models.Message"
contents: "你好"
conversation: LocalCollection._ObjectID
msgId: 21
msgType: 0
receiverId: 100009
senderId: 100074
timestamp: 1434512239556
*/

showRecievedMsg = function(msg) {
  var senderId = msg.senderId;
  lxpUser.isInChatHistory(senderId);
  if (msg.chatType === 'single') {
    /*
      不再从session取值
    */
    var chatWith = lxpUser.chatWith;
    var chatWithId = chatWith.userId || chatWith.groupId;

    // TODO 优化
    // 如果该信息来自当前会话，就直接显示，如果不是，在会话列表里提示有信息，往用户的会话列表update
    if (chatWithId === senderId) {
      msg = _.extend(msg, {'avatar': chatWith.avatar});
      Blaze.renderWithData(Template.receivedMsg, msg, $('#conversation-' + senderId)[0]);
    } else {
      // 如果不在会话列表中，就新建一个
      checkChatExist(senderId);
      // 提示新消息+render新消息
      msg = _.extend(msg, {'avatar': chatWith.avatar});
      Blaze.renderWithData(Template.receivedMsg, msg, $('#conversation-' + senderId)[0]);
      // TODO 提示新消息
      // TODO 新消息置顶
    }
  } else {
    // TODO 群信息
  }
}

/*
 * Meteor.users 表
   字段 conversations: Array
   [
   {
      id: 对方的ID
      avatar: url
      newMsg: boolean
      nickName: String
   }
   ]
 */

/*
 * 消息输入框，绑定回车键进行信息发布
 * TODO：绑定shift+enter进行换行
 */
bindSendMsg = function() {
  $('#J-im-input-text').on('keydown', function(e) {
    if (e.which == 13 || e.keyCode == 13) {
      if (e.shiftKey) {
        console.log('shift + enter');
        console.log($(e.target).val() + '//EOM');
        $(e.target).val($(e.target).val() + '\n');
        console.log($(e.target).val() + '//EOM');
      } else {
        e.preventDefault();
        e.stopPropagation();
        var contents = $.trim($(e.target).val());
        if (!contents) {
          return;
        }
        var chatWith = Session.get('chatWith');
        var receiver = chatWith.userId || chatWith.groupId,
            sender = lxpUser.getUserId();

        if (!receiver || ! sender) {
          return;
        }

        var msgType = 0,
            chatType = 'single',
            msg = {
              'receiver': receiver,
              'sender': sender,
              'msgType': msgType,
              'contents': contents,
              'chatType': chatType
            },
            header = {
              'Content-Type': 'application/json',
            },
            option = {
              'header': header,
              'data': msg
            };
        Meteor.call('sendMsg', option, function(err, res) {
          if (err) {
            throwError('发送失败，请重试');
            return;
          }
          if (res.code === 0) {
            console.log(res);
            // 清空
            $('#J-im-input-text').val('');
            // 在聊天记录中显示该信息
            showSendMsg(receiver, contents);
          }
        });
      }
    }
  });
}