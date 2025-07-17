"""
Enhanced Object Detection Service
FastAPI application for advanced computer vision operations
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import time
from contextlib import asynccontextmanager

from .models.hybrid_pipeline import HybridDetectionPipeline
from .utils.image_processing import ImageProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
detection_pipeline: Optional[HybridDetectionPipeline] = None
image_processor: Optional[ImageProcessor] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize models on startup"""
    global detection_pipeline, image_processor
    
    logger.info("Initializing CV models...")
    try:
        detection_pipeline = HybridDetectionPipeline()
        image_processor = ImageProcessor()
        await detection_pipeline.initialize()
        logger.info("CV models initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        raise
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down CV service")

app = FastAPI(
    title="Enhanced Object Detection Service",
    description="Advanced computer vision service for household inventory",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class DetectionRequest(BaseModel):
    image: str  # Base64 encoded image
    options: Optional[Dict[str, Any]] = {
        "confidence_threshold": 0.5,
        "max_items": 100,
        "enable_segmentation": True,
        "high_resolution": False
    }

class DetectedItem(BaseModel):
    id: str
    bbox: List[float]  # [x, y, width, height] normalized
    mask: Optional[str] = None  # Base64 encoded mask
    crop: Optional[str] = None  # Base64 encoded crop
    label: str
    confidence: float
    class_name: str

class DetectionResponse(BaseModel):
    items: List[DetectedItem]
    processing_time: float
    total_items: int
    success: bool
    message: Optional[str] = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Enhanced Object Detection",
        "status": "running",
        "version": "1.0.0",
        "models_loaded": detection_pipeline is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models": {
            "yolo": detection_pipeline.yolo_detector.is_loaded() if detection_pipeline else False,
            "sam": detection_pipeline.sam_segmenter.is_loaded() if detection_pipeline else False
        },
        "timestamp": time.time()
    }

@app.post("/api/v2/detect", response_model=DetectionResponse)
async def detect_objects(request: DetectionRequest, background_tasks: BackgroundTasks):
    """
    Enhanced object detection with segmentation
    Replaces the Gemini-based detection system
    """
    start_time = time.time()
    
    try:
        if not detection_pipeline:
            raise HTTPException(status_code=503, detail="CV models not initialized")
        
        # Process the image
        logger.info(f"Processing detection request with {len(request.options)} options")
        
        # Decode and preprocess image
        processed_image = image_processor.decode_and_preprocess(request.image)
        
        # Run detection pipeline
        results = await detection_pipeline.detect_and_segment(
            processed_image,
            **request.options
        )
        
        processing_time = time.time() - start_time
        
        response = DetectionResponse(
            items=results,
            processing_time=processing_time,
            total_items=len(results),
            success=True,
            message=f"Successfully detected {len(results)} items"
        )
        
        logger.info(f"Detection completed in {processing_time:.2f}s - {len(results)} items")
        return response
        
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Detection failed after {processing_time:.2f}s: {e}")
        
        return DetectionResponse(
            items=[],
            processing_time=processing_time,
            total_items=0,
            success=False,
            message=f"Detection failed: {str(e)}"
        )

@app.post("/api/v2/segment")
async def segment_objects(request: DetectionRequest):
    """
    Pure segmentation endpoint (no detection)
    For when you want to segment everything in the image
    """
    start_time = time.time()
    
    try:
        if not detection_pipeline:
            raise HTTPException(status_code=503, detail="CV models not initialized")
        
        # Process image
        processed_image = image_processor.decode_and_preprocess(request.image)
        
        # Run segmentation only
        results = await detection_pipeline.segment_all(processed_image)
        
        processing_time = time.time() - start_time
        
        return {
            "segments": results,
            "processing_time": processing_time,
            "total_segments": len(results)
        }
        
    except Exception as e:
        logger.error(f"Segmentation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/models/info")
async def model_info():
    """Get information about loaded models"""
    if not detection_pipeline:
        return {"error": "Models not loaded"}
    
    return {
        "yolo": {
            "model": detection_pipeline.yolo_detector.model_name,
            "classes": detection_pipeline.yolo_detector.get_classes(),
            "loaded": detection_pipeline.yolo_detector.is_loaded()
        },
        "sam": {
            "model": detection_pipeline.sam_segmenter.model_name,
            "loaded": detection_pipeline.sam_segmenter.is_loaded()
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 