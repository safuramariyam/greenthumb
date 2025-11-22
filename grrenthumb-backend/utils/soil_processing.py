"""
Soil Image Processing Utilities
Extracts color and texture features from soil images
"""
import cv2
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

class SoilImageProcessor:
    """Process soil images to extract features"""
    
    @staticmethod
    def process_image_file(image_bytes: bytes) -> dict:
        """
        Process uploaded image file
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Dictionary with extracted features
        """
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image.convert('RGB'))
            
            # Extract features
            features = SoilImageProcessor._extract_all_features(image_array)
            
            logger.info(f"Image processed successfully. Features extracted: {len(features)}")
            return features
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise ValueError(f"Failed to process image: {str(e)}")
    
    @staticmethod
    def _extract_all_features(image: np.ndarray) -> dict:
        """Extract all features from image"""
        color_features = SoilImageProcessor._extract_color_features(image)
        texture_features = SoilImageProcessor._extract_texture_features(image)
        
        return {**color_features, **texture_features}
    
    @staticmethod
    def _extract_color_features(image: np.ndarray) -> dict:
        """Extract RGB, HSV, and LAB color features"""
        try:
            # Convert to different color spaces
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            
            # Calculate mean values (center region to avoid edges)
            h, w = image.shape[:2]
            center_region = image[h//4:3*h//4, w//4:3*w//4]
            hsv_center = hsv[h//4:3*h//4, w//4:3*w//4]
            lab_center = lab[h//4:3*h//4, w//4:3*w//4]
            
            rgb_mean = np.mean(center_region, axis=(0, 1))
            hsv_mean = np.mean(hsv_center, axis=(0, 1))
            lab_mean = np.mean(lab_center, axis=(0, 1))
            
            # Calculate standard deviations for color uniformity
            rgb_std = np.std(center_region, axis=(0, 1))
            
            return {
                'r': float(rgb_mean[0]),
                'g': float(rgb_mean[1]),
                'b': float(rgb_mean[2]),
                'h': float(hsv_mean[0]),
                's': float(hsv_mean[1]),
                'v': float(hsv_mean[2]),
                'l': float(lab_mean[0]),
                'a': float(lab_mean[1]),
                'b_lab': float(lab_mean[2]),
                'rgb_uniformity': float(np.mean(rgb_std))
            }
        except Exception as e:
            logger.error(f"Error extracting color features: {str(e)}")
            raise
    
    @staticmethod
    def _extract_texture_features(image: np.ndarray) -> dict:
        """Extract texture features using edge detection"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Sobel edge detection
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            edge_magnitude = np.sqrt(sobelx**2 + sobely**2)
            
            # Calculate texture metrics
            texture_mean = float(np.mean(edge_magnitude))
            texture_std = float(np.std(edge_magnitude))
            
            # Variance for roughness
            roughness = float(np.var(gray))
            
            # Additional texture features
            # Contrast (difference between max and min intensity)
            contrast = float(np.max(gray) - np.min(gray))
            
            # Homogeneity (how uniform the texture is)
            homogeneity = 1.0 / (1.0 + texture_std)
            
            return {
                'edge_density': texture_mean,
                'edge_variance': texture_std,
                'roughness': roughness,
                'contrast': contrast,
                'homogeneity': float(homogeneity)
            }
        except Exception as e:
            logger.error(f"Error extracting texture features: {str(e)}")
            raise
    
    @staticmethod
    def validate_image(image_bytes: bytes) -> bool:
        """
        Validate if the uploaded file is a valid image
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            True if valid, False otherwise
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Check if image can be converted to RGB
            image.convert('RGB')
            
            # Check minimum dimensions
            width, height = image.size
            if width < 50 or height < 50:
                logger.warning(f"Image too small: {width}x{height}")
                return False
            
            # Check maximum dimensions (prevent memory issues)
            if width > 4096 or height > 4096:
                logger.warning(f"Image too large: {width}x{height}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Image validation failed: {str(e)}")
            return False