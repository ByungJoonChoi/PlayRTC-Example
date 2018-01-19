//Create an account on Firebase, and use the credentials they give you in place of the following
document.addEventListener("DOMContentLoaded", function(){
  let config = {
   apiKey: "AIzaSyAewTR7oYq4Yx_8ny59p7prqC0tovB7wLY",
   authDomain: "rtcdemian.firebaseapp.com",
   databaseURL: "https://rtcdemian.firebaseio.com",
   projectId: "rtcdemian",
   storageBucket: "rtcdemian.appspot.com",
   messagingSenderId: "542134912696"
  };
  firebase.initializeApp(config);

  let database = firebase.database().ref();
  let yourVideo = document.getElementById("yourVideo");
  let friendsVideo = document.getElementById("friendsVideo");
  let yourId = Math.floor(Math.random()*1000000000); // TODO: 사용자 ID로 바꾸어야 함.
  let btnCall = document.getElementById("btnCall");

  //Create an account on Viagenie (http://numb.viagenie.ca/), and replace {'urls': 'turn:numb.viagenie.ca','credential': 'websitebeaver','username': 'websitebeaver@email.com'} with the information from your account
  let servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'websitebeaver','username': 'websitebeaver@email.com'}]};

  let pc = new RTCPeerConnection(servers);
  pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
  pc.onaddstream = (event => friendsVideo.srcObject = event.stream);

  function sendMessage(senderId, data) {
      let msg = database.push({ sender: senderId, message: data });
      msg.remove();
  }

  function readMessage(data) {
      let msg = JSON.parse(data.val().message);
      let sender = data.val().sender;
      if (sender != yourId) {
          if (msg.ice != undefined)
              pc.addIceCandidate(new RTCIceCandidate(msg.ice));
          else if (msg.sdp.type == "offer")
              pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
                .then(() => pc.createAnswer())
                .then(answer => pc.setLocalDescription(answer))
                .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
          else if (msg.sdp.type == "answer")
              pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }
  };

  database.on('child_added', readMessage);

  function showMyFace() {
    navigator.mediaDevices.getUserMedia({audio:true, video:true})
      .then(stream => yourVideo.srcObject = stream)
      .then(stream => pc.addStream(stream));
  }

  function showFriendsFace() {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer) )
      .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})) );
  }

  btnCall.addEventListener("click", function(){
    console.log("call button clicked!!");
    showFriendsFace();
  });

    showMyFace();
});
