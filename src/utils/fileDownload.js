export const downloadFile = (data, filename, mimeType = null) => {
    try {
      console.log(`💾 Downloading file: ${filename}`);
      
      let blob;
      
      if (data instanceof Blob) {
        blob = data;
      } else if (data instanceof ArrayBuffer) {
        blob = new Blob([data], { type: mimeType });
      } else if (typeof data === 'string') {
        blob = new Blob([data], { type: mimeType || 'text/plain' });
      } else {
        throw new Error('Unsupported data type for download');
      }
      
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Download initiated: ${filename}`);
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw new Error(`Failed to download ${filename}: ${error.message}`);
    }
  };
  
  export default {
    downloadFile,
  };
  