import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const Wrtc = () => {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef();
  const peerConnectionRef = useRef();

  useEffect(() => {
        var configuration = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    }
    const peerConnection = new RTCPeerConnection({ configuration });
    peerConnectionRef.current = peerConnection;

    // Get user media (video) and add it to the peer connection
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        localVideoRef.current.srcObject = stream;
        console.log('Local video stream added to peer connection:', stream.getTracks());

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      })
      .catch(error => console.error('Error accessing the camera:', error));

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socketRef.current.emit('iceCandidate', event.candidate);
      }
    };

    // Handle remote tracks
    peerConnection.ontrack = event => {
        console.log(event.track)
      if (remoteVideoRef.current) {
        const remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    socketRef.current = io.connect('http://localhost:8000');

    socketRef.current.on('iceCandidate', candidate => {
        console.log("Server Ice Candidate")
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Handle SDP offer from the server
    socketRef.current.on('sdp', async description => {
        console.log(description.type)
      try {
        if (description.type === 'offer') {
          await peerConnection.setRemoteDescription(description);
          const answer = await peerConnection.createAnswer();
          console.log(answer)
          await peerConnection.setLocalDescription(answer);
          socketRef.current.emit('sdp', peerConnection.localDescription);
        } else if (description.type === 'answer') {
            console.log(description)
          await peerConnection.setRemoteDescription(description);
        }
      } catch (error) {
        console.error('Error setting SDP:', error);
      }
    });

    // Create and send SDP offer to the server
    peerConnection.createOffer()
      .then(offer => {
        console.log('Local SDP offer created:', offer);
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        socketRef.current.emit('sdp', peerConnection.localDescription);
      });

      console.log(peerConnection)
    return () => {
      peerConnection.close();
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div>
      <video id="localVideo" ref={localVideoRef} autoPlay muted />
      <video id="remoteVideo" ref={remoteVideoRef} autoPlay />
    </div>
  );
};

export default Wrtc;
