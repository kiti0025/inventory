<script setup>
import { ref, onBeforeUnmount, nextTick, onMounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useRouter } from 'vue-router'

const router = useRouter()
const scanning = ref(false)
const qrRegionId = 'html5qr-reader'
const html5Qr = ref(null)
const selectedCameraId = ref(null)
const debugLog = ref([])

const videoRef = ref(null) // kept for layout compatibility

function pushDebug(msg){
  debugLog.value.unshift({ time: new Date().toLocaleTimeString(), msg })
  if(debugLog.value.length > 20) debugLog.value.length = 20
}

function parseBinFromQr(text){
  if(!text) return ''
  const parts = text.split('.')
  if(parts.length >= 2) return parts[1].trim()
  return text.trim()
}

async function startScan(){
  if(scanning.value) return
  scanning.value = true
  try{
      // 等待 DOM 更新，确保 <video> 已挂载并可用（多次尝试以应对某些移动浏览器渲染延迟）
      await nextTick()
      // 等待挂载的扫描容器存在
      let attempts = 0
      while(!document.getElementById(qrRegionId) && attempts < 5){
        await new Promise(r => setTimeout(r, 100))
        attempts++
      }
      if(!document.getElementById(qrRegionId)){
        console.error('scan container not ready after retries')
        scanning.value = false
        alert('扫码容器无法初始化，请重试或检查浏览器权限/证书')
        return
      }
      // 使用 html5-qrcode
      try{
        const devices = await Html5Qrcode.getCameras()
        pushDebug('cameras found: ' + (devices && devices.length ? devices.length : 0))
        // 优先选择包含 back/rear 的 label，其次选择最后一个设备（通常为后置）
        let camId = undefined
        if(devices && devices.length){
          camId = devices.find(d => /back|rear|后|后置/i.test(d.label))?.id || devices[devices.length-1].id
          selectedCameraId.value = camId
        }

        // 创建 Html5Qrcode 实例并开始扫描
        html5Qr.value = new Html5Qrcode(qrRegionId)
        await html5Qr.value.start(
          camId,
          { fps: 10, qrbox: { width: 300, height: 300 }, experimentalFeatures: { useBarCodeDetectorIfSupported: false } },
          (decodedText, decodedResult) => {
            // 成功回调
            pushDebug('decoded: ' + decodedText)
            try{
              stopScan()
            }catch(_){ }
            const bin = parseBinFromQr(decodedText)
            const codeParam = bin || decodedText
            router.push({ name: 'BinResults', params: { code: codeParam } })
          },
          (errorMessage) => {
            // decode error per frame
            // 不打印过多信息，保留为调试
            // pushDebug('frame error: ' + errorMessage)
          }
        )
      }catch(err){
        pushDebug('html5-qrcode start error: ' + (err && err.message ? err.message : String(err)))
        throw err
      }
  }catch(e){
    scanning.value = false
    console.error('startScan error', e)
    alert('无法访问摄像头：' + (e && e.message ? e.message : e))
  }
}

function stopScan(){
  scanning.value = false
  try{
    if(html5Qr.value){
      html5Qr.value.stop().catch(()=>{}).finally(()=>{ html5Qr.value = null })
    }
  }catch(_){ }
}

onBeforeUnmount(()=>{ try{ if(html5Qr.value) html5Qr.value.stop() }catch(_){} })
</script>

<template>
  <div class="scan-root">
  <div class="video-wrap" v-if="scanning">
    <div :id="qrRegionId" class="qr-reader"></div>
    <div class="scan-rect"></div>
    <button class="stop-btn" @click="stopScan">停止</button>
  </div>

    <div v-else class="center-btn">
        <button @click="startScan">扫码</button>
    </div>
  </div>
</template>

<style scoped>
  .scan-root{ display:flex; align-items:center; justify-content:center; height:100vh; padding:12px }
  .center-btn{ 
    width:100%; 
    display:flex; 
    justify-content:center;
    align-items: center;
  }
  .center-btn button{ 
    padding:16px 32px; 
    font-size:20px; 
    border-radius:12px;
    background: #42b983;
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .center-btn button:hover {
    background: #359c6d;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  .center-btn button:active {
    transform: translateY(0);
  }
  .video-wrap{ position:relative; width:100%; max-width:420px; aspect-ratio:3/4; background:#000; border-radius:12px; overflow:hidden; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); }
  video{ width:100%; max-width:420px; height:auto; aspect-ratio:3/4; object-fit:cover; border-radius:12px }
  .video-hidden{ display:none }
  .scan-rect{ position:absolute; left:50%; top:50%; width:68%; height:28%; transform:translate(-50%,-50%); border:2px solid rgba(0,255,0,0.9); border-radius:6px; animation: scan 3s infinite linear; }
  .stop-btn{ 
    position:absolute; 
    left:50%; 
    transform:translateX(-50%); 
    bottom:14px; 
    padding:10px 16px; 
    border-radius:8px; 
    background:rgba(255,255,255,0.9);
    color: #333;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .stop-btn:hover {
    background: rgba(240, 240, 240, 0.95);
    transform: translateX(-50%) scale(1.05);
  }
  
  @keyframes scan {
    0%, 100% { border-color: rgba(0,255,0,0.9); }
    50% { border-color: rgba(0,255,0,0.3); }
  }
</style>
