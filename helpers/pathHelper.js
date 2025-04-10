module.exports = {
    getDisplayImage: (event) => {
      const imagePath = event.mainImage || event.images?.[0] || 'images/default-event.jpg';
      return imagePath.startsWith('uploads/') ? `/${imagePath}` : imagePath;
    }
  };