// Multiple image preview
document.getElementById('eventImages')?.addEventListener('change', function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    if (this.files.length > 5) {
      alert('Maximum 5 images allowed');
      this.value = '';
      return;
    }
    
    Array.from(this.files).forEach(file => {
      
      const reader = new FileReader();
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      
      reader.onload = (event) => {
        previewItem.innerHTML = `
          <img src="${event.target.result}" alt="Preview">
          <button type="button" class="remove-image">&times;</button>
        `;
        preview.appendChild(previewItem);
        
        // Add remove functionality
        previewItem.querySelector('.remove-image').addEventListener('click', () => {
          previewItem.remove();
          // Create new FileList without the removed file
          const dataTransfer = new DataTransfer();
          Array.from(this.files)
            .filter(f => f !== file)
            .forEach(f => dataTransfer.items.add(f));
          this.files = dataTransfer.files;
        });
      };
      
      reader.readAsDataURL(file);
    });
  });