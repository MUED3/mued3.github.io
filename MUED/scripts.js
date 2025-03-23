document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });

    // Thai unicode range: \u0E00-\u0E7F
    const thaiRegex = /[\u0E00-\u0E7F]/;

    // Function to check if text contains Thai characters
    function containsThai(text) {
        return thaiRegex.test(text);
    }

    // Find elements that might contain Thai text but don't have lang attribute
    const textNodes = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    // Check each text node
    while (textNodes.nextNode()) {
        const node = textNodes.currentNode;
        if (containsThai(node.nodeValue.trim())) {
            // If parent doesn't already have lang attribute
            if (!node.parentElement.hasAttribute('lang')) {
                node.parentElement.setAttribute('lang', 'th');
            }
        }
    }
});

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios'); // Add this to handle URL images

// Placeholder image generator
router.get('/placeholder/:width/:height', async (req, res) => {
  const width = parseInt(req.params.width) || 300;
  const height = parseInt(req.params.height) || 200;
  
  // Check if there's a specific image requested
  const programType = req.query.type || 'default';
  
  // Map program types to image sources (local files or URLs)
  let imageSource;
  let isUrl = false;
  
  switch(programType) {
    case 'thai':
      imageSource = 'https://scontent.fnak4-1.fna.fbcdn.net/v/t39.30808-6/450868997_908830857951997_2654718720920804985_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=0hTkIS5raJIQ7kNvgHDit--&_nc_oc=AdiPGUJpSuUfjy81zD9xqfTMqG3KtM9qRzTL-l7rPSnPXh8wi2W-ysQ_qv4b79tHjETAu4HygG_U9ScIBo9ghZhy&_nc_zt=23&_nc_ht=scontent.fnak4-1.fna&_nc_gid=gWwxcLl1bFstiSE8aLDd2Q&oh=00_AYHZrnU-THgaRS_QIzKvgTrl1CPiP7a18nT9Z0sqd03e-Q&oe=67DD03A6';
      isUrl = true;
      break;
    case 'western':
      imageSource = path.join(__dirname, 'public/images/programs/western-classical.jpg');
      break;
    case 'contemporary':
      imageSource = 'https://scontent.fnak4-2.fna.fbcdn.net/v/t39.30808-6/469681734_122126392844404554_6976704201900551270_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=DhJJLSndH-sQ7kNvgFQwC8m&_nc_oc=AdjBqQ3Js5FF9pWAoeuNCcZv1s4G28cviW6vqP0MKrE6acWizeZbO-lNd_O05jyWdH9f8WA4ILVbRoWvm51YcKP2&_nc_zt=23&_nc_ht=scontent.fnak4-2.fna&_nc_gid=KJS3Ko3RdlgtakOMx7kpkQ&oh=00_AYEGY_d6ljh7AJI6tvKSlZWIB5fAVFrN_n6E0qEptOvLIQ&oe=67DCFB50';
      isUrl = true;
      break;
    default:
      // Fallback to a local image or a generic placeholder
      try {
        const imagesDir = path.join(__dirname, 'public/images/programs');
        if (fs.existsSync(imagesDir)) {
          const images = fs.readdirSync(imagesDir).filter(file => 
            file.endsWith('.jpg') || file.endsWith('.png')
          );
          if (images.length > 0) {
            const randomImage = images[Math.floor(Math.random() * images.length)];
            imageSource = path.join(imagesDir, randomImage);
          } else {
            throw new Error('No images found');
          }
        } else {
          throw new Error('Images directory not found');
        }
      } catch (err) {
        // If there's an error, just use a placeholder
        const svgPlaceholder = `
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#888" 
                  text-anchor="middle" dominant-baseline="middle">
              ${width} × ${height}
            </text>
          </svg>
        `;
        
        res.set('Content-Type', 'image/svg+xml');
        return res.send(svgPlaceholder);
      }
  }

  try {
    let imageBuffer;
    
    if (isUrl) {
      // Download image from URL
      const response = await axios.get(imageSource, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data, 'binary');
    } else {
      // Read local file
      if (!fs.existsSync(imageSource)) {
        throw new Error('Local image not found');
      }
      imageBuffer = fs.readFileSync(imageSource);
    }
    
    // Resize the image
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();
    
    // Set appropriate content type
    const contentType = imageSource.endsWith('.png') ? 'image/png' : 'image/jpeg';
    res.set('Content-Type', contentType);
    res.send(resizedImageBuffer);
    
  } catch (err) {
    console.error('Image processing error:', err);
    
    // Send a placeholder if there's an error
    const svgPlaceholder = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#888" 
              text-anchor="middle" dominant-baseline="middle">
          ${width} × ${height}
        </text>
      </svg>
    `;
    
    res.set('Content-Type', 'image/svg+xml');
    res.send(svgPlaceholder);
  }
});

module.exports = router;