<script setup>
import { ref, onBeforeUnmount, nextTick } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/library'
import { useRouter } from 'vue-router'

const router = useRouter()
const codeReader = new BrowserMultiFormatReader()
const scanning = ref(false)
const videoRef = ref(null)

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
      // 如果 videoRef 没准备好，重试几次（每次等待 100ms）
      let attempts = 0
      while(!videoRef.value && attempts < 5){
        await new Promise(r => setTimeout(r, 100))
        attempts++
      }
      if(!videoRef.value){
        console.error('video element not ready after retries')
        scanning.value = false
        alert('摄像头预览无法初始化，请重试或检查浏览器权限/证书')
        return
      }

      await codeReader.decodeFromVideoDevice(undefined, videoRef.value, (result, err) => {
      if(result){
        stopScan()
        const text = result.getText()
        const bin = parseBinFromQr(text)
        if(bin){
          router.push({ name: 'BinResults', params: { code: bin } })
        } else {
          router.push({ name: 'BinResults', params: { code: text } })
        }
      }
      if(err){
        // 常见错误会通过 err 报告，记录便于调试
        console.debug('ZXing scan err:', err)
      }
    })
  }catch(e){
    scanning.value = false
    console.error('startScan error', e)
    // 将错误显示为浏览器提示，便于快速定位权限或安全性问题
    alert('无法访问摄像头：' + (e && e.message ? e.message : e))
  }
}

function stopScan(){
  scanning.value = false
  try{ codeReader.reset() }catch(_){}
}

onBeforeUnmount(()=>{ try{ codeReader.reset() }catch(_){} })
</script>

<template>
  <div class="scan-root">
    <!-- video 元素始终存在以确保 ref 可用；通过类控制显示 -->
    <video ref="videoRef" :class="{ 'video-hidden': !scanning }" autoplay muted playsinline></video>

    <div class="video-wrap" v-if="scanning">
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
