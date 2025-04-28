let width = 320;
let height = 0;

let streaming = false;
let currentStream;

async function startup() {
  const cameraVideo = document.getElementById('camera-video');
  const cameraCanvas = document.getElementById('camera-canvas');
  const cameraTakeButton = document.getElementById('camera-take-button');
  const cameraOutputList = document.getElementById('camera-list-output');
  const cameraListSelect = document.getElementById('camera-list-select');

  cameraVideo.addEventListener('canplay', () => {
    if (streaming) {
      return;
    }
    // Calculate height dynamically
    height = (cameraVideo.videoHeight * width) / cameraVideo.videoWidth;
    cameraVideo.setAttribute('width', width.toString());
    cameraVideo.setAttribute('height', height.toString());
    cameraCanvas.setAttribute('width', width.toString());
    cameraCanvas.setAttribute('height', height.toString());
    streaming = true;
  });

  function populateTakenPicture(image) {
    cameraOutputList.innerHTML += `
    <li>
      <img src="${image}" alt="">
      <a href="${image}" download="image.png">Download</a>
    </li>
    
  `;
  }

  async function getStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: streaming ? { exact: cameraListSelect.value } : undefined,
          aspectRatio: 16 / 9,
          width: 1280,
          height: 720,
        },
      });
      // Show available camera after camera permission granted
      await populateCameraList();
      return stream;
    } catch (error) {
      alert('Tidak dapat mengakses webcam, silakan periksa izin akses webcam.');
      throw error;
    }
  }

  async function populateCameraList() {
    try {
      // Get all available webcam
      const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
      console.log('enumeratedDevices', enumeratedDevices);
      const list = enumeratedDevices.filter((device) => device.kind === 'videoinput');
      cameraListSelect.innerHTML = list.reduce((accumulator, device, currentIndex) => {
        return accumulator.concat(`
          <option value="${device.deviceId}">
            ${device.label || `Camera ${currentIndex + 1}`}
          </option>
        `);
      }, '');
    } catch (error) {
      throw error;
    }
  }

  function cameraLaunch(stream) {
    cameraVideo.srcObject = stream;
    cameraVideo.play();

    const videoTrack = stream.getVideoTracks()[0];
    const activeDeviceId = videoTrack.getSettings().deviceId;
  
    // Set select ke kamera aktif
    cameraListSelect.value = activeDeviceId;
  }

  function cameraTakePicture() {
    const context = cameraCanvas.getContext('2d');
    cameraCanvas.width = width;
    cameraCanvas.height = height;
    context.drawImage(cameraVideo, 0, 0, width, height);

    return cameraCanvas.toDataURL('image/png');
  }

  function stopCurrentStream() {
    if (!(currentStream instanceof MediaStream)) {
      return;
    }
    currentStream.getTracks().forEach((track) => {
      track.stop();
    });
    streaming = false;
  }


  cameraListSelect.addEventListener('change', async (event) => {
    stopCurrentStream();

    currentStream = await getStream();
    cameraLaunch(currentStream);
  });

  cameraTakeButton.addEventListener('click', () => {
    const imageUrl = cameraTakePicture();
    populateTakenPicture(imageUrl);
  });

  async function init() {
    try {
      currentStream = await getStream();
      cameraLaunch(currentStream);
      
      currentStream.getVideoTracks().forEach((track) => {
        console.log(track.getSettings());
      });
    } catch (error) {
      console.error(error);
      alert('Error occurred:' + error.message);
    }
  }

  init();
}

window.onload = startup;
