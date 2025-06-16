// // // // // // // // //join call

// import React, { useState, useRef, useEffect } from 'react';
// import AgoraRTC from 'agora-rtc-sdk-ng';
// import axios from 'axios';
// import { Button, TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

// const createAgoraClient = () => {
//   try {
//     return AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
//   } catch (error) {
//     console.warn('Failed to create client with vp8, trying h264:', error);
//     return AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
//   }
// };

// const VideoCall = () => {
//   const [channelName, setChannelName] = useState('');
//   const [userId, setUserId] = useState(Math.floor(Math.random() * 10000));
//   const [joined, setJoined] = useState(false);
//   const [selectedCamera, setSelectedCamera] = useState('');
//   const [cameras, setCameras] = useState([]);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const localTracksRef = useRef([]);
//   const clientRef = useRef(createAgoraClient());

//   useEffect(() => {
//     const updateDevices = async () => {
//       try {
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const videoDevices = devices.filter(d => d.kind === 'videoinput');
//         console.log('Available cameras:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
//         setCameras(videoDevices);
//         // Prioritize virtual cameras (e.g., OBS Virtual Camera)
//         const virtualCamera = videoDevices.find(d => d.label.toLowerCase().includes('obs') || d.label.toLowerCase().includes('virtual'));
//         setSelectedCamera(virtualCamera ? virtualCamera.deviceId : videoDevices[0]?.deviceId || '');
//       } catch (err) {
//         console.error('Error enumerating devices:', err);
//         alert('Failed to list cameras. Ensure camera permissions are granted.');
//       }
//     };
//     updateDevices();

//     const client = clientRef.current;
//     client.on('user-published', handleUserPublished);
//     client.on('user-unpublished', handleUserUnpublished);
//     client.on('network-quality', handleNetworkQuality);
//     client.on('exception', handleException);
//     client.on('connection-state-change', handleConnectionStateChange);

//     return () => {
//       handleLeave();
//       client.removeAllListeners();
//     };
//   }, []);

//   const handleUserPublished = async (user, mediaType) => {
//     console.log(`Remote user published: ${user.uid}, mediaType: ${mediaType}`, {
//       hasVideo: !!user.videoTrack,
//       hasAudio: !!user.audioTrack,
//       videoMuted: user.videoTrack?.isMuted
//     });
//     let subscribeAttempts = 3;
//     while (subscribeAttempts > 0) {
//       try {
//         await clientRef.current.subscribe(user, mediaType);
//         console.log(`Subscribed to remote ${mediaType} track for user ${user.uid}`);
//         if (mediaType === 'video' && remoteVideoRef.current) {
//           if (user.videoTrack.isMuted) {
//             console.warn(`Remote video track for user ${user.uid} is muted`);
//             return;
//           }
//           await user.videoTrack.play(remoteVideoRef.current);
//           const videoElement = remoteVideoRef.current.querySelector('video');
//           if (videoElement) {
//             videoElement.setAttribute('playsinline', '');
//             videoElement.setAttribute('autoplay', '');
//             videoElement.style.width = '100%';
//             videoElement.style.height = '100%';
//             videoElement.style.objectFit = 'cover';
//             console.log('Remote video playing:', !videoElement.paused, 'for user:', user.uid);
//           } else {
//             console.error('No video element found in remoteVideoRef for user:', user.uid);
//             throw new Error('No video element found');
//           }
//         } else if (mediaType === 'audio') {
//           user.audioTrack.play();
//           console.log('Remote audio track played for user:', user.uid);
//         }
//         break;
//       } catch (error) {
//         console.warn(`Subscription attempt failed, retries left: ${subscribeAttempts - 1}`, error);
//         subscribeAttempts--;
//         if (subscribeAttempts === 0) {
//           console.error(`Error subscribing to remote ${mediaType} track for user ${user.uid}:`, error);
//           alert(`Failed to subscribe to remote ${mediaType} for user ${user.uid}. Check network or browser settings.`);
//         }
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }
//     }
//   };

//   const handleUserUnpublished = (user, mediaType) => {
//     console.log(`Remote user unpublished: ${user.uid}, mediaType: ${mediaType}`);
//     if (mediaType === 'video' && remoteVideoRef.current) {
//       remoteVideoRef.current.innerHTML = '';
//       console.log('Remote video cleared for user:', user.uid);
//     }
//   };

//   const handleNetworkQuality = (stats) => {
//     console.log('Network quality:', {
//       uplink: stats.uplinkNetworkQuality,
//       downlink: stats.downlinkNetworkQuality,
//       rtt: stats.rtt
//     });
//     if (stats.uplinkNetworkQuality > 3) {
//       console.warn('Poor uplink quality may affect video transmission');
//       alert('Poor network quality detected. Video may not work properly.');
//     }
//   };

//   const handleException = (event) => {
//     console.error('Agora SDK exception:', event);
//   };

//   const handleConnectionStateChange = (curState, prevState) => {
//     console.log('Connection state changed:', { curState, prevState });
//   };

//   const handleJoin = async () => {
//     try {
//       // Check available devices
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const videoDevices = devices.filter(device => device.kind === 'videoinput');
//       console.log('Available video devices:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
//       if (!videoDevices.length) {
//         console.warn('No video devices found. Attempting to join with audio only.');
//         alert('No cameras detected. Connect a camera or start OBS Virtual Camera.');
//       }

//       // Request permissions with retry
//       let stream;
//       let attempts = 3;
//       while (attempts > 0) {
//         try {
//           stream = await navigator.mediaDevices.getUserMedia({
//             video: selectedCamera ? { deviceId: selectedCamera } : true,
//             audio: true
//           });
//           console.log('Camera access granted:', {
//             video: stream.getVideoTracks().length ? stream.getVideoTracks()[0].label : 'none',
//             audio: stream.getAudioTracks().length ? 'yes' : 'no'
//           });
//           break;
//         } catch (permError) {
//           console.error('Permission error:', permError.name, permError.message);
//           if (permError.name === 'NotAllowedError') {
//             throw new Error('Camera access denied. Please allow camera permissions in browser settings.');
//           } else if (permError.name === 'NotFoundError' || permError.name === 'OverconstrainedError') {
//             console.warn('No camera available. Falling back to audio-only.');
//             stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             console.log('Camera access failed: No camera available, using audio only');
//             alert('No cameras available. Start OBS Virtual Camera or connect a camera.');
//             break;
//           } else if (permError.name === 'NotReadableError' || permError.name === 'AbortError') {
//             console.warn(`${permError.name} on attempt ${4 - attempts}. Retrying...`);
//             attempts--;
//             if (attempts === 0) {
//               console.warn('Camera access failed due to NotReadableError. Falling back to audio-only.');
//               stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//               console.log('Camera access failed: Using audio only after retries');
//               alert('Camera is in use by another app (e.g., Brave). Select OBS Virtual Camera in the dropdown, ensure it’s running, or close other apps.');
//               break;
//             }
//             await new Promise(resolve => setTimeout(resolve, 1000));
//           } else {
//             throw permError;
//           }
//         }
//       }
//       stream.getTracks().forEach(track => track.stop());

//       const trimmedChannelName = channelName.trim();
//       if (!trimmedChannelName) {
//         throw new Error('Channel name cannot be empty');
//       }

//       console.log('Requesting token with params:', { channelName: trimmedChannelName, userId });
//       const response = await axios.get('http://localhost:5000/api/generate-token', {
//         params: { channelName: trimmedChannelName, userId }
//       });

//       const { token, appId } = response.data;
//       if (!token || !appId || typeof token !== 'string' || typeof appId !== 'string') {
//         throw new Error('Invalid token or appId received from backend');
//       }
//       console.log('Received token:', token.slice(0, 10) + '...', 'appId:', appId);

//       // Reset client state
//       const client = clientRef.current;
//       if (client.connectionState !== 'DISCONNECTED') {
//         await client.leave();
//         console.log('Client reset: Left previous channel');
//       }

//       // Join with retry mechanism
//       attempts = 3;
//       while (attempts > 0) {
//         try {
//           await client.join(appId, trimmedChannelName, token, parseInt(userId));
//           console.log('Joined channel successfully with userId:', userId);
//           break;
//         } catch (joinError) {
//           console.warn(`Join attempt failed, retries left: ${attempts - 1}`, joinError);
//           attempts--;
//           if (attempts === 0) {
//             throw new Error(`Failed to join after retries: ${joinError.message}`);
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         }
//       }

//       // Create tracks
//       let microphoneTrack, cameraTrack;
//       try {
//         [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
//           { cameraId: selectedCamera || undefined },
//           { encoderConfig: '240p_1' }
//         );
//         console.log('Tracks created:', { audio: !!microphoneTrack, video: !!cameraTrack });
//         if (cameraTrack) {
//           cameraTrack.setMuted(false);
//           cameraTrack.setEnabled(true);
//           console.log('Video track state:', {
//             isMuted: cameraTrack.isMuted,
//             enabled: cameraTrack.enabled,
//             label: cameraTrack.getTrackLabel()
//           });
//         }
//       } catch (trackError) {
//         console.error('Failed to create video track:', trackError);
//         microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
//         console.log('Created audio-only track due to error:', trackError.name);
//         alert('Failed to access camera. Only audio will be transmitted. Ensure OBS Virtual Camera is running or select a different camera.');
//       }
//       localTracksRef.current = [microphoneTrack, ...(cameraTrack ? [cameraTrack] : [])];

//       if (cameraTrack && localVideoRef.current) {
//         let playAttempts = 3;
//         while (playAttempts > 0) {
//           try {
//             await cameraTrack.play(localVideoRef.current);
//             const videoElement = localVideoRef.current.querySelector('video');
//             if (videoElement) {
//               videoElement.setAttribute('playsinline', '');
//               videoElement.setAttribute('autoplay', '');
//               videoElement.muted = true;
//               videoElement.style.width = '100%';
//               videoElement.style.height = '100%';
//               videoElement.style.objectFit = 'cover';
//               console.log('Local video playing:', !videoElement.paused);
//               break;
//             } else {
//               console.error('No video element found in localVideoRef');
//               throw new Error('No video element found');
//             }
//           } catch (playError) {
//             console.warn(`Local video play attempt failed, retries left: ${playAttempts - 1}`, playError);
//             playAttempts--;
//             if (playAttempts === 0) {
//               console.error('Failed to play local video:', playError);
//               alert('Failed to display local video. Check camera access or try another browser.');
//             }
//             await new Promise(resolve => setTimeout(resolve, 1000));
//           }
//         }
//       } else {
//         console.log('No local video track available for playback');
//       }

//       // Publish tracks with retry
//       let publishAttempts = 3;
//       while (publishAttempts > 0) {
//         try {
//           await client.publish(localTracksRef.current);
//           console.log('Local tracks published:', localTracksRef.current.map(t => ({
//             type: t.trackMediaType,
//             isMuted: t.isMuted,
//             enabled: t.enabled
//           })));
//           break;
//         } catch (publishError) {
//           console.warn(`Publish attempt failed, retries left: ${publishAttempts - 1}`, publishError);
//           publishAttempts--;
//           if (publishAttempts === 0) {
//             throw new Error(`Failed to publish tracks: ${publishError.message}`);
//           }
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         }
//       }

//       setJoined(true);
//     } catch (error) {
//       console.error('Error joining channel:', error.response || error);
//       alert(`Failed to join the call: ${error.message || 'Check console for details'}`);
//     }
//   };

//   const handleLeave = async () => {
//     try {
//       for (const track of localTracksRef.current) {
//         track.stop();
//         track.close();
//       }
//       localTracksRef.current = [];

//       await clientRef.current.leave();

//       if (localVideoRef.current) localVideoRef.current.innerHTML = '';
//       if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = '';

//       setJoined(false);
//       console.log('Left channel successfully');
//     } catch (error) {
//       console.error('Error leaving channel:', error);
//     }
//   };

//   return (
//     <Box sx={{ mb: 3, textAlign: 'center' }}>
//       <TextField
//         label="Channel Name"
//         variant="outlined"
//         value={channelName}
//         onChange={(e) => setChannelName(e.target.value)}
//         fullWidth
//         disabled={joined}
//         sx={{ mb: 2 }}
//       />
//       <TextField
//         label="User ID"
//         variant="outlined"
//         value={userId}
//         onChange={(e) => setUserId(e.target.value)}
//         fullWidth
//         disabled={joined}
//         sx={{ mb: 2 }}
//       />
//       <FormControl fullWidth sx={{ mb: 2 }} disabled={joined}>
//         <InputLabel>Camera</InputLabel>
//         <Select
//           value={selectedCamera}
//           onChange={(e) => setSelectedCamera(e.target.value)}
//           label="Camera"
//         >
//           {cameras.map(device => (
//             <MenuItem key={device.deviceId} value={device.deviceId}>
//               {device.label || `Camera ${device.deviceId}`}
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//       <Button
//         variant="contained"
//         color="primary"
//         onClick={joined ? handleLeave : handleJoin}
//         fullWidth
//         disabled={!channelName.trim() || !userId}
//       >
//         {joined ? 'Leave Call' : 'Join Call'}
//       </Button>

//       {joined && localTracksRef.current.length === 1 && (
//         <Typography color="error" sx={{ mt: 2 }}>
//           No local video. Camera may be in use by another app (e.g., Brave). Select OBS Virtual Camera, ensure it’s running, or close other apps. In Brave, ensure WebRTC is enabled and Shields are disabled.
//         </Typography>
//       )}

//       <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
//         <Box>
//           <Typography variant="h6">Local Video</Typography>
//           <div
//             ref={localVideoRef}
//             style={{
//               width: '300px',
//               height: '200px',
//               backgroundColor: '#000',
//               position: 'relative',
//               overflow: 'visible'
//             }}
//           />
//         </Box>
//         <Box>
//           <Typography variant="h6">Remote Video</Typography>
//           <div
//             ref={remoteVideoRef}
//             style={{
//               width: '300px',
//               height: '200px',
//               backgroundColor: '#000',
//               position: 'relative',
//               overflow: 'visible'
//             }}
//           />
//         </Box>
//       </Box>
//     </Box>
//   );
// };
// export default VideoCall;


//group call and one 2 one call successfullyy..

import React, { useState, useRef, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import { Button, TextField, Box, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';

const createAgoraClient = () => {
  try {
    return AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  } catch (error) {
    console.warn('Failed to create client with vp8, trying h264:', error);
    return AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
  }
};

const VideoCall = () => {
  const [channelName, setChannelName] = useState('');
  const [userId] = useState(Math.floor(Math.random() * 10000));
  const [joined, setJoined] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameras, setCameras] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoContainerRef = useRef(null);
  const localTracksRef = useRef([]);
  const clientRef = useRef(createAgoraClient());

  useEffect(() => {
    const updateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log('Available cameras:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
        setCameras(videoDevices);
        const virtualCamera = videoDevices.find(d => d.label.toLowerCase().includes('obs') || d.label.toLowerCase().includes('virtual'));
        setSelectedCamera(virtualCamera ? virtualCamera.deviceId : videoDevices[0]?.deviceId || '');
      } catch (err) {
        console.error('Error enumerating devices:', err);
        alert('Failed to list cameras. Ensure camera permissions are granted in your browser settings.');
      }
    };
    updateDevices();

    const client = clientRef.current;
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('network-quality', handleNetworkQuality);
    client.on('exception', handleException);
    client.on('connection-state-change', handleConnectionStateChange);

    return () => {
      handleLeave();
      client.removeAllListeners();
    };
  }, []);

  const handleUserPublished = async (user, mediaType) => {
    console.log(`User ${user.uid} published ${mediaType} in channel ${channelName}`);
    let subscribeAttempts = 10;
    while (subscribeAttempts > 0) {
      try {
        await clientRef.current.subscribe(user, mediaType);
        console.log(`Subscribed to ${mediaType} for user ${user.uid}`);
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            const existingUser = prev.find(u => u.uid === user.uid);
            if (existingUser) {
              return prev.map(u => (u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u));
            }
            return [...prev, { uid: user.uid, videoTrack: user.videoTrack, audioTrack: null }];
          });
        } else if (mediaType === 'audio') {
          setRemoteUsers(prev => {
            const existingUser = prev.find(u => u.uid === user.uid);
            if (existingUser) {
              return prev.map(u => (u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u));
            }
            return [...prev, { uid: user.uid, videoTrack: null, audioTrack: user.audioTrack }];
          });
          user.audioTrack.play();
          console.log(`Playing audio for user ${user.uid}`);
        }
        break;
      } catch (error) {
        console.warn(`Failed to subscribe to ${mediaType} for user ${user.uid}, attempts left: ${subscribeAttempts - 1}`, error);
        subscribeAttempts--;
        if (subscribeAttempts === 0) {
          console.error(`Failed to subscribe to ${mediaType} for user ${user.uid} after retries`, error);
          alert(`Failed to subscribe to ${mediaType} for user ${user.uid}. Ensure the other user is publishing their stream and both are in the same channel.`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log(`User ${user.uid} unpublished ${mediaType}`);
    if (mediaType === 'video') {
      setRemoteUsers(prev => prev.map(u => (u.uid === user.uid ? { ...u, videoTrack: null } : u)));
    } else if (mediaType === 'audio') {
      setRemoteUsers(prev => prev.map(u => (u.uid === user.uid ? { ...u, audioTrack: null } : u)));
    }
  };

  const handleNetworkQuality = (stats) => {
    console.log('Network quality:', stats);
    if (stats.uplinkNetworkQuality > 3 || stats.downlinkNetworkQuality > 3) {
      alert('Poor network quality detected. Video may not work properly. Check your internet connection.');
    }
  };

  const handleException = (event) => {
    console.error('Agora SDK exception:', event);
    alert('An error occurred with the video call. Check the console for details and ensure your Agora configuration is correct.');
  };

  const handleConnectionStateChange = (curState, prevState) => {
    console.log('Connection state changed:', { curState, prevState });
    if (curState === 'DISCONNECTED') {
      alert('Disconnected from the call. Try rejoining or check your network.');
    }
  };

  const handleJoin = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
      if (!videoDevices.length) {
        alert('No cameras detected. Connect a camera or start OBS Virtual Camera.');
      }

      let stream;
      let cameraAvailable = true;
      let attempts = 10;
      while (attempts > 0) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
            audio: true
          });
          console.log('Media stream acquired:', {
            video: stream.getVideoTracks().length > 0 ? stream.getVideoTracks()[0].label : 'none',
            audio: stream.getAudioTracks().length > 0 ? 'yes' : 'no'
          });
          break;
        } catch (permError) {
          console.error('Failed to access media devices:', permError);
          attempts--;
          if (permError.name === 'NotReadableError') {
            cameraAvailable = false;
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Camera unavailable (NotReadableError), falling back to audio-only');
            alert(
              'Camera is already in use by another tab or application. Joining with audio only. To enable video:\n' +
              '1. Close other tabs or apps using the camera (e.g., Zoom, Skype, or the first browser tab).\n' +
              '2. Use a different browser for each tab (e.g., Chrome for Tab 1, Firefox for Tab 2).\n' +
              '3. Use OBS Virtual Camera as an alternative camera source.\n' +
              '4. Check browser camera permissions in your settings.'
            );
            break;
          }
          if (attempts === 0) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Falling back to audio-only after retries');
            alert(
              'Camera access failed after retries. Joining with audio only. To enable video:\n' +
              '1. Close other tabs or apps using the camera.\n' +
              '2. Use a different browser for each tab (e.g., Chrome for Tab 1, Firefox for Tab 2).\n' +
              '3. Use OBS Virtual Camera as an alternative camera source.\n' +
              '4. Check browser camera permissions in your settings.'
            );
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      stream.getTracks().forEach(track => track.stop());

      const trimmedChannelName = channelName.trim();
      if (!trimmedChannelName) {
        throw new Error('Channel name cannot be empty');
      }

      let token, appId;
      attempts = 3;
      while (attempts > 0) {
        try {
          console.log('Requesting token:', { channelName: trimmedChannelName, userId });
          const response = await axios.get('http://localhost:5000/api/generate-token', {
            params: { channelName: trimmedChannelName, userId }
          });
          token = response.data.token;
          appId = response.data.appId;
          if (!token || !appId || typeof token !== 'string' || typeof appId !== 'string') {
            throw new Error('Invalid token or appId received from backend');
          }
          console.log('Token received:', { token: token.slice(0, 10) + '...', appId });
          break;
        } catch (tokenError) {
          console.warn(`Failed to fetch token, attempts left: ${attempts - 1}`, tokenError);
          attempts--;
          if (attempts === 0) {
            throw new Error(`Failed to fetch token after retries: ${tokenError.message}. Ensure the backend server is running at http://localhost:5000.`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const client = clientRef.current;
      if (client.connectionState !== 'DISCONNECTED') {
        try {
          await client.leave();
          console.log('Left previous channel');
        } catch (leaveError) {
          console.warn('Failed to leave previous channel:', leaveError);
        }
      }

      attempts = 5;
      while (attempts > 0) {
        try {
          await client.join(appId, trimmedChannelName, token, parseInt(userId));
          console.log('Joined channel successfully:', { userId, channelName: trimmedChannelName });
          break;
        } catch (joinError) {
          console.warn(`Failed to join channel, attempts left: ${attempts - 1}`, joinError);
          attempts--;
          if (attempts === 0) {
            const errorMessage = `Failed to join channel after retries: ${joinError.message}. This may be due to a network issue. Please try the following:\n` +
                                 '1. Disable any ad blockers or browser extensions that might block requests (e.g., to statscollector.sd-rtn.com).\n' +
                                 '2. Check your browser privacy settings (e.g., Enhanced Tracking Protection in Firefox, or Brave Shields).\n' +
                                 '3. Ensure your network allows WebSocket connections on port 443 (check firewall, proxy, or VPN settings).\n' +
                                 '4. Verify your internet connection is stable.';
            throw new Error(errorMessage);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      let microphoneTrack, cameraTrack;
      if (cameraAvailable) {
        try {
          [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            { cameraId: selectedCamera || undefined },
            { encoderConfig: '720p_1' }
          );
          console.log('Tracks created:', {
            audio: !!microphoneTrack,
            video: !!cameraTrack
          });
        } catch (trackError) {
          if (trackError.code === 'NOT_READABLE' || trackError.name === 'NotReadableError') {
            console.warn('Camera unavailable during track creation (NotReadableError), falling back to audio-only');
            microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
            alert(
              'Camera is already in use by another tab or application during track creation. Proceeding with audio only. To enable video:\n' +
              '1. Close other tabs or apps using the camera (e.g., Zoom, Skype, or the first browser tab).\n' +
              '2. Use a different browser for each tab (e.g., Chrome for Tab 1, Firefox for Tab 2).\n' +
              '3. Use OBS Virtual Camera as an alternative camera source.\n' +
              '4. Check browser camera permissions in your settings.'
            );
          } else {
            throw trackError;
          }
        }
      } else {
        microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('Camera already marked as unavailable, created audio-only track');
      }
      localTracksRef.current = [microphoneTrack, ...(cameraTrack ? [cameraTrack] : [])];
      setLocalVideoTrack(cameraTrack);

      setJoined(true);

      attempts = 10;
      while (attempts > 0) {
        try {
          await client.publish(localTracksRef.current);
          console.log('Tracks published successfully:', localTracksRef.current.map(t => t.trackMediaType));
          break;
        } catch (publishError) {
          console.warn(`Failed to publish tracks, attempts left: ${attempts - 1}`, publishError);
          attempts--;
          if (attempts === 0) {
            throw new Error(`Failed to publish tracks after retries: ${publishError.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      console.error('Error joining call:', error);
      alert(`Failed to join the call: ${error.message}`);
    }
  };

  const handleLeave = async () => {
    try {
      for (const track of localTracksRef.current) {
        track.stop();
        track.close();
      }
      localTracksRef.current = [];
      setLocalVideoTrack(null);

      await clientRef.current.leave();
      if (localVideoRef.current) localVideoRef.current.innerHTML = '';
      setRemoteUsers([]);
      setJoined(false);
      console.log('Left channel successfully');
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  const toggleMic = () => {
    const micTrack = localTracksRef.current.find(track => track.trackMediaType === 'audio');
    if (micTrack) {
      micTrack.setEnabled(!micEnabled);
      setMicEnabled(!micEnabled);
      console.log('Microphone toggled:', micEnabled ? 'off' : 'on');
    }
  };

  const toggleVideo = () => {
    const videoTrack = localTracksRef.current.find(track => track.trackMediaType === 'video');
    if (videoTrack) {
      videoTrack.setEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
      console.log('Video toggled:', videoEnabled ? 'off' : 'on');
      if (!videoEnabled) {
        setLocalVideoTrack(videoTrack);
      } else {
        setLocalVideoTrack(null);
      }
    }
  };

  useEffect(() => {
    if (joined && localVideoTrack && localVideoRef.current) {
      let attempts = 5;
      const playLocalVideo = async () => {
        while (attempts > 0) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            await localVideoTrack.play(localVideoRef.current);
            const videoElement = localVideoRef.current.querySelector('video');
            if (videoElement) {
              videoElement.muted = true;
              videoElement.setAttribute('playsinline', '');
              videoElement.style.width = '100%';
              videoElement.style.height = '100%';
              videoElement.style.objectFit = 'cover';
              console.log('Local video playing:', !videoElement.paused);
            } else {
              console.error('No video element found in localVideoRef');
              throw new Error('No video element found');
            }
            break;
          } catch (playError) {
            console.warn(`Failed to play local video, attempts left: ${attempts - 1}`, playError);
            attempts--;
            if (attempts === 0) {
              console.error('Failed to play local video after retries', playError);
              alert('Failed to play local video. Check camera access and ensure no other tab or app is using the camera.');
              setLocalVideoTrack(null);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      };
      playLocalVideo();
    } else {
      console.log('No local video track available for playback');
    }
  }, [joined, localVideoTrack]);

  useEffect(() => {
    console.log('Remote users updated:', remoteUsers.map(u => ({ uid: u.uid, hasVideo: !!u.videoTrack, hasAudio: !!u.audioTrack })));
    if (remoteVideoContainerRef.current) {
      remoteVideoContainerRef.current.innerHTML = '';
    }
    remoteUsers.forEach(user => {
      const playerContainer = document.createElement('div');
      playerContainer.style.position = 'relative';
      playerContainer.style.width = remoteUsers.length === 1 ? '100%' : remoteUsers.length === 2 ? '50%' : '33%';
      playerContainer.style.height = remoteUsers.length <= 2 ? '100%' : '50%';
      playerContainer.style.backgroundColor = '#000';
      playerContainer.style.boxSizing = 'border-box';
      playerContainer.style.padding = '5px';

      const label = document.createElement('div');
      label.textContent = `User ${user.uid}${user.videoTrack ? '' : ' (Audio Only)'}`;
      label.style.position = 'absolute';
      label.style.top = '10px';
      label.style.left = '10px';
      label.style.color = '#fff';
      label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      label.style.padding = '5px';
      label.style.borderRadius = '3px';
      label.style.zIndex = '10';
      playerContainer.appendChild(label);

      if (user.videoTrack) {
        const videoContainer = document.createElement('div');
        videoContainer.id = `remote-${user.uid}`;
        videoContainer.style.width = '100%';
        videoContainer.style.height = '100%';
        playerContainer.appendChild(videoContainer);

        remoteVideoContainerRef.current.appendChild(playerContainer);
        console.log(`Created video container for remote user ${user.uid}`);

        let playAttempts = 10;
        const playVideo = async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          while (playAttempts > 0) {
            try {
              await user.videoTrack.play(`remote-${user.uid}`);
              const videoElement = document.getElementById(`remote-${user.uid}`).querySelector('video');
              if (videoElement) {
                videoElement.setAttribute('playsinline', '');
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.objectFit = 'cover';
                console.log(`Remote video playing for user ${user.uid}:`, !videoElement.paused);
              } else {
                console.error(`No video element found for remote user ${user.uid}`);
                throw new Error('No video element found');
              }
              break;
            } catch (playError) {
              console.warn(`Failed to play remote video for user ${user.uid}, attempts left: ${playAttempts - 1}`, playError);
              playAttempts--;
              if (playAttempts === 0) {
                console.error(`Failed to play remote video for user ${user.uid} after retries`, playError);
                alert(`Failed to play remote video for user ${user.uid}. Ensure the remote user is publishing their video.`);
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        };
        playVideo();
      } else {
        const placeholder = document.createElement('div');
        placeholder.style.width = '100%';
        placeholder.style.height = '100%';
        placeholder.style.display = 'flex';
        placeholder.style.justifyContent = 'center';
        placeholder.style.alignItems = 'center';
        placeholder.style.color = '#fff';
        placeholder.style.textAlign = 'center';
        placeholder.style.fontSize = '14px';
        placeholder.textContent = `User ${user.uid} (Audio Only)`;
        playerContainer.appendChild(placeholder);

        remoteVideoContainerRef.current.appendChild(playerContainer);
        console.log(`Created placeholder for audio-only user ${user.uid}`);
      }
    });
  }, [remoteUsers]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#fff', p: 2 }}>
        <Box
          ref={remoteVideoContainerRef}
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: '#000',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            gap: 0,
            overflow: 'auto'
          }}
        >
          {remoteUsers.length === 0 && joined && (
            <Box sx={{ color: '#fff', textAlign: 'center' }}>
              Waiting for other users to join...
            </Box>
          )}
        </Box>

        {joined && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              width: '200px',
              height: '150px',
              bgcolor: '#000',
              border: '2px solid #fff',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
            {!localVideoTrack && (
              <Box sx={{ color: '#fff', textAlign: 'center', position: 'absolute', p: 1 }}>
                Camera Unavailable: In use by another tab/app. Close other tabs or use a different browser.
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 2, bgcolor: '#fff' }}>
        <IconButton onClick={toggleMic} color={micEnabled ? 'primary' : 'error'}>
          {micEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton onClick={toggleVideo} color={videoEnabled ? 'primary' : 'error'}>
          {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton onClick={handleLeave} color="error">
          <CallEndIcon />
        </IconButton>
      </Box>

      {!joined && (
        <Box sx={{ p: 3, bgcolor: '#fff', borderTop: '1px solid #ddd' }}>
          <TextField
            label="Channel Name"
            variant="outlined"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Camera</InputLabel>
            <Select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              label="Camera"
            >
              {cameras.map(device => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleJoin}
            fullWidth
            disabled={!channelName.trim()}
          >
            Join Call
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default VideoCall;