Image Analysis Bounding Box System and Optimization Plan
Current Bounding Box Detection Design
Architecture & Workflow: The current system uses a Next.js (React) frontend and a serverless API route to analyze images for item detection. When a user uploads an image, the client-side ai-service.ts module sends the image (base64-encoded) to a backend API endpoint (/api/ai/analyze) for processing
GitHub
. The backend calls Google’s Gemini 2.5 Pro vision model with a carefully crafted prompt to detect items. Specifically, app/api/ai/analyze/route.ts constructs a prompt instructing Gemini to “Detect household items, furniture, electronics, books, kitchen items, decorative items in this image… Output ONLY a valid JSON array where each entry has 'box_2d': [ymin, xmin, ymax, xmax] (0-1000 scale) and 'label': ...”
GitHub
. The image is attached as an inlineData part to the API call, and the model returns a JSON text containing an array of detected objects with bounding box coordinates and labels
GitHub
GitHub
. Bounding Box Format & Normalization: The Gemini model provides bounding boxes in a relative coordinate system scaled to 1000 (as noted in Google’s docs). For example, a box might be [100, 200, 300, 400] meaning the top-left and bottom-right corners on a normalized 1000x1000 grid
GitHub
. The backend route.ts then parses and normalizes these coordinates into 0.0–1.0 range before returning results. After cleaning the raw JSON text (removing markdown fences, fixing commas, etc.
GitHub
GitHub
), it converts each box_2d from the 0–1000 scale into fractional values by dividing by 1000
GitHub
. Each detected item is returned with x, y, width, height normalized to the image dimensions, along with a descriptive label (and a default confidence since Gemini doesn't supply one)
GitHub
GitHub
. This means a box’s coordinates are image-relative (percentages), which the frontend can use to draw overlays independent of actual pixel size. Key Modules: Several code modules orchestrate this process:
app/api/ai/analyze/route.ts – Server-side analysis endpoint that interfaces with Google Generative AI. It packages the image + prompt, calls Gemini, then parses and outputs JSON with normalized bounding boxes
GitHub
GitHub
.
lib/services/ai-service.ts – Client-side service that handles image preprocessing and calls the API route. Notably, its transformAndNormalizeResponse() function double-checks the format of returned coordinates
GitHub
. It handles both the legacy box_2d format and already-normalized {x, y, width, height}. If the API returned pixel coordinates or 0–1000 values, this function normalizes them by dividing by the image’s width/height (or 1000)
GitHub
. This was crucial to fix earlier alignment bugs – originally, boxes were misaligned because the frontend expected normalized 0–1 but the API returned pixel coordinates, which was resolved by this normalization step
GitHub
.
lib/services/image-preprocessor.ts – Prepares images before sending to the API. It likely handles resizing (e.g. scaling down large images to a max dimension, like 768px width
GitHub
), handles orientation metadata (to avoid rotated bounding boxes issues), and possibly adjusts quality. By resizing on the client, the system reduces payload size and processing time.
UI Components (/components/ai/*): The frontend uses a BoundingBoxOverlay component to render the boxes on the image and a BoundingBoxEditor for user adjustments. The overlay takes the normalized coordinates and multiplies by the displayed image dimensions to absolutely position each rectangle. State is managed with Jotai atoms – for example, detectedItemsAtom holds the list of detected items and boundingBoxesAtom holds the extracted box coordinates
GitHub
. When the analysis completes, the atoms are updated with the new items, and the overlay automatically displays all boxes. Users can click to select items (highlighting the box), or switch to an edit mode to drag/resize boxes. The editor uses a library (perfect-freehand) for drawing new boxes freehand if an item was missed
GitHub
. This interactive UI lets users refine the AI’s output before saving items.
In summary, the design is a client-server pipeline: the React frontend collects the image, calls the backend AI service, and then visualizes the returned bounding boxes. The use of normalized coordinates ensures the boxes scale correctly with the image on different screen sizes. The Google Gemini model provides a quick way to get detection without training a custom model, and its labels include descriptive text (e.g. “Black ceramic coffee mug”) which are directly used as item names. This integration is innovative (LLM-based vision), but it also introduces some limitations discussed next.
Limitations of the Current Method
While the current LLM-based approach works, it has significant shortcomings when dealing with complex scenes or a very large number of objects:
Robustness and Accuracy: The bounding box output from the Gemini model can be inconsistent for crowded or complex images. Large language models are not primarily designed for dense object detection. As the number of items grows or objects overlap, the model may miss items, merge multiple objects into one box, or produce inaccurate coordinates. The user has observed that “the current method is very faulty” for complexity, meaning it doesn’t reliably handle dozens of items. There is also no built-in confidence score or non-max suppression logic – the system trusts whatever boxes the LLM returns, which could include false positives or duplicates in complex scenes.
Pixel Precision: Bounding boxes from Gemini are axis-aligned rectangles that often include extra background. The LLM has no mechanism to give a tighter outline; it just provides the enclosing box. For near pixel-perfect crops (minimal background around each item), plain rectangles are often insufficient. For example, a chair’s bounding box will inevitably include some surrounding floor/wall. The current workflow would crop that entire rectangle. Achieving truly tight crops would require knowing an object’s exact silhouette or mask, which this approach doesn’t provide. As a result, the cropped images of items may include unnecessary blank space or parts of adjacent objects.
JSON Parsing Overhead: Because the model is returning JSON via a prompt, there is overhead in ensuring the response is well-formed. The code in route.ts has a substantial block dedicated to “clean up response text” and repair JSON syntax errors (removing trailing commas, fixing brackets/quotes)
GitHub
, including last-resort string parsing to extract coordinates if JSON parsing fails
GitHub
GitHub
. This adds complexity and potential points of failure. Despite improvements (they achieved 100% parsing success with repair logic
GitHub
), relying on an LLM to output JSON means occasional odd errors could happen if the model diverges from instructions (especially with very long lists of items).
Performance and Scalability: Processing large images with many items can be slow or costly. The system currently limits image size (e.g., ~768px or 10MB max) to keep Gemini’s analysis time reasonable
GitHub
. If one wanted to detect 100+ items in a single image, that image likely has a lot of detail and perhaps high resolution; sending a heavily downscaled image to the API might cause small items to be missed, but sending a full-resolution image could time out or exceed token limits when the model describes many objects. Moreover, each analysis call to Gemini is an API call that incurs latency (and usage cost). An image with “100s of items” might strain the prompt/response size limits of the model – the JSON output could be extremely long, increasing risk of formatting issues or partial responses. In a real-time or batch-add scenario, this approach may not meet the performance requirements (the progress report targeted ~2-5 seconds per image for 40 items
GitHub
, but 100 items could take significantly longer).
Lack of Specialized Training: The Gemini model is a general foundation model. It wasn’t specifically trained to identify every household inventory item with high precision. It might do well on common objects (chair, laptop, book) but could be confused by less typical items or small objects in clutter. There’s no fine-tuning here for the specific domain – whereas a dedicated vision model could be trained or configured to excel at densely-packed home scenes or particular item categories.
In short, the current design is innovative but not sufficiently reliable for heavy-duty use (dozens of items with pixel-perfect accuracy). The reliance on an LLM for object detection introduces unpredictability in complex cases. To achieve the goal of accurately and reliably splitting an image into 100+ individual item crops, a more specialized and robust solution is needed. Below we outline such a solution.
Recommendations for Robust Multi-Object Recognition and Cropping
To handle potentially hundreds of items per image with near pixel-perfect cropping, a new approach leveraging dedicated computer vision models is advisable. The solution will likely involve object detection and instance segmentation models instead of a pure LLM. Here are the key recommendations:
Adopt a Dedicated Object Detection Model (e.g. YOLO): Modern object detectors like YOLOv8 (You Only Look Once) or the latest YOLO models are extremely effective at finding multiple objects in an image. These models run a convolutional neural network over the image and output many bounding boxes with class labels and confidence scores
docs.ultralytics.com
. Unlike the LLM, they are purpose-built to handle dense scenes – YOLO can predict dozens of boxes in one forward pass and uses Non-Maximum Suppression to filter overlaps. By integrating a YOLO model (pre-trained on a broad dataset like COCO), the system could instantly recognize common household item classes (e.g. chair, cup, bottle, book, tv, person, etc.). The output would be a set of tight bounding boxes around each object, each tagged with a class name and a confidence score
docs.ultralytics.com
. This alone would greatly improve reliability: the detector won’t hallucinate non-existent objects and is less likely to merge separate items into one box. It also directly provides a confidence measure to threshold out low-quality detections. The YOLO family is known for real-time speed, so a well-optimized model could potentially analyze an image in under a second even with dozens of objects. You could run YOLO in a Python microservice (using PyTorch or ONNX Runtime) that the Next.js app calls. Given the Node.js environment on Vercel isn’t suitable for heavy ML, a separate Python backend (hosted on AWS Lambda, GCP, or a dedicated server with GPU) would handle the YOLO inference and return JSON results (bounding boxes + classes). This change would remove dependency on the Gemini API, and leverage open-source models with more predictable behavior on vision tasks.
Incorporate Instance Segmentation for Pixel-Perfect Crops: Object detection alone provides boxes, but not the exact outlines of objects. For near pixel-perfect cropping, an instance segmentation approach is needed. Instance segmentation models (like Mask R-CNN, or even YOLO models with a segmentation head) output a mask for each object – essentially a silhouette that follows the object’s shape
docs.ultralytics.com
. The Ultralytics YOLOv8, for example, has a -seg variant that can produce segmentation masks in addition to boxes
docs.ultralytics.com
docs.ultralytics.com
. Using such a model, the system can extract precise masks/contours for each item. The result is that each item’s boundaries are accurately identified, allowing one to crop just the object with minimal background. Even if you ultimately save them as rectangular image crops, you can compute the tightest bounding box around the mask so that the crop hugs the object on all sides (as opposed to a loosely drawn box from the detection). Instance segmentation is especially useful when objects touch or overlap; it can separate them by their shapes. In practice, implementing this could mean either switching to a segmentation model or running a two-stage process (detect first, then segment each detection). For example, you could use Segment Anything Model (SAM) by Meta – a powerful foundation model that can “identify the precise location of ... every object in an image” without training
blog.roboflow.com
. SAM can generate masks for all objects it sees, even for categories it’s never trained on, in a zero-shot manner. You could feed the raw image to SAM’s automatic mask generator and get potentially hundreds of masks (one per object-like region). From those masks, filters can remove overly large background segments or duplicates, and the remainder can be treated as your items. Each mask can yield a crop, and you could then use an image recognition model or your existing LLM (in caption mode) to label those crops (e.g., “black ceramic coffee mug”). The downside is performance – SAM (especially original ViT-H model) is heavy; however, there are faster variants like FastSAM and SAM 2.0 (which is 6× more accurate than SAM1 while likely improving speed)
blog.roboflow.com
blog.roboflow.com
. With a GPU, generating masks for a single image is on the order of seconds. This approach maximizes accuracy: you truly get pixel-level object separation.
Hybrid Detection + Segmentation Pipeline: For an optimal solution, consider a combination of detection and segmentation to leverage the strengths of both. One approach is: use a fast object detector (YOLO) to get an initial set of bounding boxes and rough labels, then apply SAM (or a smaller segmentation model) guided by those boxes. SAM allows using a bounding box as a prompt to extract the precise mask of whatever is inside that box. So, for each YOLO-detected item, you can run SAM with that box to get a refined mask of the object. This drastically focuses the segmentation, making it faster than segmenting the whole image blindly and avoiding extraneous masks. The output would be a high-quality mask for each detected item, effectively achieving pixel-perfect outline. The YOLO step provides confidence scores and basic labels (e.g. YOLO might classify an object as “cup” or “chair”), and then you can concatenate that with additional descriptors (or run a smaller vision transformer to get attributes/color). This hybrid method is similar to how some systems use Grounding DINO + SAM, where Grounding DINO finds objects (with open-vocabulary detection) and SAM segments them. In your case, YOLO’s predefined classes might be slightly limiting (COCO has ~80 classes, which may not cover every household object), but it covers many. If needed, an open-vocabulary detector (like OWL-ViT or Grounding DINO which can detect arbitrary objects given text queries) could replace YOLO to find items that aren’t in common datasets. That said, a well-trained detector will capture most usual items, and anything missing could still be added manually via your UI’s draw mode.
Improved Image Processing for Small Items: To reliably catch 100+ tiny items (for example, a drawer full of knick-knacks or a wall of tools), the system should use high-resolution images and possibly a tiling approach. The current pipeline reduces images to ~768px width
GitHub
 for efficiency, but at that scale very small objects become just a few pixels and might be missed. A robust solution would accept higher resolutions (e.g. 4K photos from modern phones) and either process them at full scale or in sections. One tactic is image tiling: split a large image into a grid of overlapping tiles (e.g. four quadrants or more) and run detection on each tile, then merge the results. This ensures that small items get a closer look. Many detectors have trouble if the image is resized too small; using a tiling strategy can overcome that without needing an extremely large single forward-pass (which could exhaust GPU memory). If a GPU server is available, processing a 4000×3000 image in one go with a strong detector is feasible – YOLO models typically take 640px or 1280px as default, but can be scaled up with some trade-off in speed. The benefit is that with higher resolution, you can truly detect tiny objects (like a pen or a set of keys on a table) that would be impossible to identify at 768px. It’s a trade-off between speed and thoroughness; perhaps make it configurable (standard mode vs. high-precision mode).
System Integration and Performance: Moving to a custom CV pipeline means you’ll need to host and maintain it. A Python-based microservice (Flask or FastAPI app, or even a serverless function with the model loaded) can be invoked from your Next.js frontend similar to how you call the Gemini API. You should budget in GPU usage if you want real-time performance for 100s of objects – CPU-only might be too slow for segmentation. For example, running YOLOv8 on CPU might take several seconds per image, whereas on a GPU it could be under a second for medium complexity. If immediate responsiveness isn’t critical, it could also be an asynchronous job (user uploads and gets notified when item processing is done). Another consideration is that an ensemble approach (detector + SAM) will have multiple steps; you’ll want to optimize the pipeline (e.g., running these in parallel for multiple images, or batching SAM calls if possible). There may be existing libraries or services to simplify this – for instance, Roboflow offers APIs for detection and segmentation that could offload the heavy lifting (with cost trade-offs). However, given the need for 100s of items with pixel-level accuracy, a custom pipeline you control might be more flexible and cost-effective in the long run.
Enhanced Labeling Strategy: One advantage of the current Gemini approach is the nicely formatted labels (including attributes like color or material in the description). Pure vision models like YOLO will just give basic class names (“cup”, “chair”, etc.), and segmentation models give no labels at all (just masks). To preserve rich descriptions, consider a second-stage classification or captioning step for each cropped item. For example, after obtaining each item’s image crop, you could feed it to an image captioning model or use an LLM vision model (like Gemini or GPT-4V if available) to generate a descriptive label. This could even be done client-side with a smaller model or via API. Another lightweight approach is to use CLIP embeddings to match the object to a set of known labels or to generate text features. If real-time labeling of 100 crops is too slow via AI, you could also let the user assign names to ambiguous items after detection. The key is that detection/segmentation gets you the crops reliably, and then you ensure those items are identified in a user-friendly way (which might be an interactive step or an automated one). This hybrid labeling approach – fast automated detection + optional LLM description per item – might give the best of both worlds: reliability in finding/cropping everything, and clarity in what each item is.
By implementing the above recommendations, the system would become far more robust and scalable. Instead of an LLM guessing boxes, you’d have a proven CV model explicitly trained to detect objects (ensuring you find all items even in crowded scenes). And by adding segmentation, each item can be isolated with precision – yielding near pixel-perfect crops where each image contains just the item and almost no background. Not only would this handle 100+ items, but it would do so accurately and consistently, which is crucial for a home inventory application. To illustrate the difference: in the current approach, if you had a cluttered garage photo with tools on a wall, Gemini might label “assorted tools on wall” as one box or miss smaller wrenches. A YOLO+SAM pipeline would detect every single tool (hammer, screwdriver, wrench, etc. as separate boxes) and then segment each one precisely, so you could end up with, say, 50 cropped images of individual tools, each correctly framed. This is exactly the kind of result needed for an inventory of 100s of items with minimal manual intervention. In conclusion, moving to a hybrid object detection and segmentation solution will significantly improve the item recognition feature. It aligns with how computer vision experts would tackle multi-object detection: first find all the objects (using a fast multi-object detector)
docs.ultralytics.com
, then obtain exact object boundaries (using segmentation)
docs.ultralytics.com
. Such a system will be more complex to implement than the current API call, but it will be accurate, effective, and reliable, meeting the goal of automatically cataloging large numbers of items from a single image with high fidelity. The investment in this approach will pay off in a much more powerful “Photo to Items” feature, ultimately providing users with confidence that even the most cluttered room can be turned into a precise inventory list with one click. Sources:
Code excerpts from v0-home-ics-v14 repository showing the current bounding box analysis flow
GitHub
GitHub
 and normalization logic
GitHub
.
Ultralytics YOLO Docs – explaining how object detection yields multiple bounding boxes with class labels
docs.ultralytics.com
 and how instance segmentation provides object masks for exact shapes
docs.ultralytics.com
.
Roboflow Blog on Segment Anything – highlighting that SAM can find “every object in an image” for comprehensive segmentation
blog.roboflow.com
.
Project documentation (Photo To Items feature overview) for additional context on the current implementation
GitHub
.
Citations
GitHub
ai-service.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/lib/services/ai-service.ts#L70-L79
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L38-L46
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L56-L64
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L70-L78
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L40-L48
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L98-L106
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L108-L116
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L172-L180
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L178-L186
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L34-L42
GitHub
ai-service.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/lib/services/ai-service.ts#L163-L171
GitHub
ai-service.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/lib/services/ai-service.ts#L168-L176
GitHub
BOUNDING_BOX_PROGRESS_REPORT.md

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/docs/BOUNDING_BOX_PROGRESS_REPORT.md#L2-L5
GitHub
PHOTO_TO_ITEMS_FEATURE.md

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/docs/PHOTO_TO_ITEMS_FEATURE.md#L140-L143
GitHub
ai.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/lib/atoms/ai.ts#L12-L20
GitHub
PHOTO_TO_ITEMS_FEATURE.md

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/docs/PHOTO_TO_ITEMS_FEATURE.md#L14-L19
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L102-L110
GitHub
route.ts

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/app/api/ai/analyze/route.ts#L134-L143
GitHub
BOUNDING_BOX_PROGRESS_REPORT.md

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/docs/BOUNDING_BOX_PROGRESS_REPORT.md#L24-L28
GitHub
image-analyzer.tsx

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/components/ai/image-analyzer.tsx#L96-L104
GitHub
BOUNDING_BOX_PROGRESS_REPORT.md

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/docs/BOUNDING_BOX_PROGRESS_REPORT.md#L82-L90

Object Detection - Ultralytics YOLO Docs

https://docs.ultralytics.com/tasks/detect/

Instance Segmentation - Ultralytics YOLO Docs

https://docs.ultralytics.com/tasks/segment/

Instance Segmentation - Ultralytics YOLO Docs

https://docs.ultralytics.com/tasks/segment/

Instance Segmentation - Ultralytics YOLO Docs

https://docs.ultralytics.com/tasks/segment/

How to Use the Segment Anything Model (SAM)

https://blog.roboflow.com/how-to-use-segment-anything-model-sam/

How to Use the Segment Anything Model (SAM)

https://blog.roboflow.com/how-to-use-segment-anything-model-sam/

How to Use the Segment Anything Model (SAM)

https://blog.roboflow.com/how-to-use-segment-anything-model-sam/
GitHub
PHOTO_TO_ITEMS_FEATURE.md

https://github.com/joshogden360/v0-home-ics-v14/blob/035d05a0923b367c8847a429989c00b0847d6215/docs/PHOTO_TO_ITEMS_FEATURE.md#L68-L76
All Sources

github

docs.ultralytics

blog.roboflow