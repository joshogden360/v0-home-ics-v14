# Enhanced Object Detection Roadmap
## From Gemini LLM to Dedicated Computer Vision Pipeline

*Branch: `enhanced-object-detection`*  
*Goal: Support 100+ items per image with pixel-perfect cropping*

---

## 🎯 **Development Objectives**

### **Primary Goals**
- Replace/enhance Gemini 2.5 Pro with dedicated CV models
- Achieve pixel-perfect object cropping via instance segmentation
- Support 100+ items per image reliably
- Maintain current UI/UX while improving accuracy

### **Success Metrics**
- ✅ Detect 100+ items in complex scenes (vs current 40 max)
- ✅ Pixel-perfect crops with minimal background
- ✅ Sub-2 second processing for dense images
- ✅ 95%+ accuracy on household inventory items

---

## 🔄 **Architecture Transformation**

### **Current Pipeline (Gemini-based)**
```
Image → Base64 → Gemini 2.5 Pro → JSON parsing → Bounding boxes → UI
```

### **Target Pipeline (Hybrid CV)**
```
Image → Python CV Service → YOLO Detection → SAM Segmentation → Precise masks → UI
```

---

## 🛠 **Implementation Phases**

### **Phase 1: Infrastructure Setup** ⏱️ *Week 1*

#### **1.1 Python Microservice Foundation**
- [ ] Create Python FastAPI service for CV operations
- [ ] Set up Docker containerization for deployment
- [ ] Implement REST API endpoints matching current interface
- [ ] Add health checks and monitoring

#### **1.2 Model Integration**
- [ ] Install and test YOLOv8/v9 for object detection
- [ ] Integrate Segment Anything Model (SAM) for segmentation
- [ ] Create model management system (download, cache, version)
- [ ] Benchmark performance on sample images

#### **1.3 Development Environment**
- [ ] Set up local development with Docker Compose
- [ ] Create test image dataset (kitchen, garage, office, storage)
- [ ] Implement logging and debugging tools
- [ ] Configure GPU support (optional for development)

### **Phase 2: Core Detection Engine** ⏱️ *Week 2*

#### **2.1 YOLO Object Detection**
- [ ] Implement YOLOv8 detection with COCO classes
- [ ] Add confidence thresholding and NMS filtering
- [ ] Create custom class mapping for household items
- [ ] Optimize detection parameters for dense scenes

#### **2.2 Instance Segmentation**
- [ ] Integrate SAM with YOLO bounding box prompts
- [ ] Implement mask generation and refinement
- [ ] Add mask-to-crop conversion logic
- [ ] Create fallback to bounding boxes for failed segmentation

#### **2.3 Image Processing Pipeline**
- [ ] High-resolution image handling (4K support)
- [ ] Image tiling for ultra-dense scenes
- [ ] Preprocessing optimization (resize, normalize)
- [ ] Memory management for large batches

### **Phase 3: Enhanced Features** ⏱️ *Week 3*

#### **3.1 Advanced Detection**
- [ ] Implement open-vocabulary detection (Grounding DINO)
- [ ] Add small object detection optimization
- [ ] Create confidence-based filtering
- [ ] Implement duplicate detection removal

#### **3.2 Intelligent Labeling**
- [ ] Integrate CLIP for semantic understanding
- [ ] Add attribute detection (color, material, size)
- [ ] Create descriptive label generation
- [ ] Implement label confidence scoring

#### **3.3 Performance Optimization**
- [ ] Batch processing for multiple images
- [ ] Model quantization for speed
- [ ] Caching strategies for repeated analysis
- [ ] Async processing with progress tracking

### **Phase 4: Integration & Testing** ⏱️ *Week 4*

#### **4.1 Frontend Integration**
- [ ] Update ai-service.ts to call new CV API
- [ ] Modify response handling for masks/segments
- [ ] Enhance UI for segmentation visualization
- [ ] Add progress indicators for longer processing

#### **4.2 Deployment Setup**
- [ ] Configure production deployment (Railway/AWS/GCP)
- [ ] Set up GPU instances for inference
- [ ] Implement auto-scaling and load balancing
- [ ] Create monitoring and alerting

#### **4.3 Testing & Validation**
- [ ] Comprehensive testing with 100+ item images
- [ ] Performance benchmarking vs current system
- [ ] User acceptance testing
- [ ] Edge case handling (lighting, angles, occlusion)

---

## 🧱 **Technical Architecture**

### **New Components**

#### **Python CV Service** (`/cv-service/`)
```
cv-service/
├── app/
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   ├── yolo_detector.py # YOLO detection wrapper
│   │   ├── sam_segmenter.py # SAM segmentation wrapper
│   │   └── hybrid_pipeline.py # Combined detection+segmentation
│   ├── utils/
│   │   ├── image_processing.py # Image preprocessing
│   │   ├── mask_utils.py    # Mask manipulation
│   │   └── crop_generator.py # Crop extraction
│   └── api/
│       ├── detection.py     # Detection endpoints
│       └── segmentation.py  # Segmentation endpoints
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

#### **Enhanced Frontend Integration**
- Update `lib/services/ai-service.ts` with dual API support
- Add segmentation visualization to `bounding-box-overlay.tsx`
- Create crop preview component for pixel-perfect results
- Implement progressive loading for large item counts

### **API Specifications**

#### **Detection Endpoint**
```typescript
POST /api/v2/detect
{
  "image": "base64_string",
  "options": {
    "confidence_threshold": 0.5,
    "max_items": 100,
    "enable_segmentation": true,
    "high_resolution": false
  }
}

Response:
{
  "items": [
    {
      "id": "item_001",
      "bbox": [x, y, width, height],
      "mask": "base64_mask_or_null",
      "crop": "base64_cropped_image",
      "label": "red ceramic coffee mug",
      "confidence": 0.95,
      "class": "cup"
    }
  ],
  "processing_time": 1.2,
  "total_items": 15
}
```

---

## 🔄 **Migration Strategy**

### **Dual System Approach**
1. **Keep existing Gemini system as fallback**
2. **Add feature flag for new CV system**
3. **A/B test with user preference**
4. **Gradual rollout based on performance**

### **Rollback Plan**
- Environment variable to switch between systems
- Identical API interface for seamless swapping
- Performance monitoring to detect issues
- User feedback collection for quality comparison

---

## 📊 **Expected Improvements**

| Metric | Current (Gemini) | Target (CV Pipeline) | Improvement |
|--------|------------------|---------------------|-------------|
| Max Items/Image | 40 | 100+ | +150% |
| Crop Accuracy | Bounding box | Pixel-perfect | +90% |
| Processing Time | 3-5s | 1-2s | +60% |
| Complex Scene Handling | Poor | Excellent | +300% |
| Cost per Analysis | $0.02-0.05 | $0.001-0.01 | -80% |

---

## 🚀 **Getting Started**

### **Development Setup**
```bash
# 1. Switch to development branch
git checkout enhanced-object-detection

# 2. Create Python service
mkdir cv-service
cd cv-service

# 3. Set up virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 4. Install dependencies
pip install fastapi uvicorn torch torchvision
pip install ultralytics transformers
pip install opencv-python pillow numpy

# 5. Download models (automated in first run)
python -c "from ultralytics import YOLO; YOLO('yolov8m.pt')"
```

### **Quick Test**
```python
# test_detection.py
from ultralytics import YOLO
import cv2

# Load model
model = YOLO('yolov8m.pt')

# Test detection
results = model('test_image.jpg')
print(f"Detected {len(results[0].boxes)} objects")
```

---

## 📝 **Development Notes**

### **Model Selection Rationale**
- **YOLOv8**: Proven performance, active development, good ecosystem
- **SAM**: State-of-the-art segmentation, zero-shot capability
- **FastAPI**: Fast, modern Python API framework
- **Docker**: Consistent deployment across environments

### **Performance Considerations**
- GPU highly recommended for SAM (10x speed improvement)
- CPU-only deployment possible but slower
- Model quantization for edge deployment
- Batch processing for efficiency

### **Fallback Strategy**
- Always maintain Gemini integration as backup
- Implement circuit breaker pattern
- Graceful degradation on CV service failure
- User preference for detection method

---

## 🎯 **Milestone Deliverables**

### **Week 1 Checkpoint**
- [ ] Python service running locally
- [ ] Basic YOLO detection working
- [ ] Docker containerization complete
- [ ] API endpoints defined and tested

### **Week 2 Checkpoint**
- [ ] SAM integration functional
- [ ] High-quality crops generated
- [ ] Performance benchmarks established
- [ ] Integration plan finalized

### **Week 3 Checkpoint**
- [ ] Advanced features implemented
- [ ] Production deployment ready
- [ ] Frontend integration complete
- [ ] Testing suite comprehensive

### **Week 4 Checkpoint**
- [ ] Full system deployed and tested
- [ ] Performance targets met
- [ ] User feedback collected
- [ ] Documentation complete

---

**Ready to revolutionize object detection! 🚀**

*This enhanced system will transform the inventory experience from "good enough" to "pixel perfect".* 