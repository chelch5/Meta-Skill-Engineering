---
name: create-3d-scene
description: >
  Set up a Blender scene programmatically via Python (bpy) with objects,
  materials, lighting, camera, and environment configuration. Triggers on:
  "set up blender scene", "create 3D scene in blender", "bpy scene setup",
  "programmatic blender scene", "automated 3D visualization scene".
  Use when creating reproducible 3D visualization scenes, automating product or
  architectural rendering setup, generating multiple scene variations
  programmatically, building template scenes for batch rendering workflows,
  or integrating 3D visualization into data pipelines.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.1"
  domain: blender
  complexity: intermediate
  language: Python
  tags: blender, bpy, 3d, scene-setup, materials, lighting, camera
---

# Create 3D Scene

Set up a complete Blender scene programmatically using the Python API (bpy). Configure scene hierarchy, add mesh objects, create PBR materials with node-based shaders, position lighting and cameras, and set up environment/world settings.

## Purpose

Enable reproducible, code-driven 3D scene creation in Blender for automation workflows, batch processing, and integration with external data pipelines. Eliminates manual setup steps and ensures scene configurations can be version-controlled and repeated reliably.

## When to Use

- Creating reproducible 3D visualization scenes from scratch via Python
- Automating product visualization or architectural rendering setup
- Generating multiple scene variations programmatically
- Building template scenes for batch rendering workflows
- Prototyping scene layouts before manual refinement
- Integrating 3D visualization into data pipelines or reporting systems
- Setting up standard lighting/camera configurations for consistent renders

## When NOT to Use

- Manual scene editing in Blender GUI (this skill is for programmatic/scripted workflows only)
- Complex character rigging or animation setup (use specialized rigging tools)
- Game engine exports requiring real-time optimization (use game asset pipeline skills)
- Simple one-off renders without automation needs (manual GUI setup is faster)
- Scenes requiring heavy manual sculpting or vertex-level editing
- When the user explicitly requests non-Python approaches

## Inputs

| Input | Type | Description | Example |
|-------|------|-------------|---------|
| Scene specifications | Configuration | Objects, materials, lighting requirements | Product dimensions, material colors, lighting setup |
| Output requirements | Parameters | Resolution, render engine, quality settings | 1920x1080, Cycles, 128 samples |
| Asset paths | File paths | External models, textures, HDRIs | `/path/to/hdri.exr`, `product_model.obj` |
| Camera settings | Parameters | Position, rotation, focal length, DOF | `location=(7,-7,5)`, `lens=50mm` |
| Environment | Configuration | World shader, background, ambient settings | HDRI lighting, solid color, gradient |

## Output Contract

Produces a Python script that:
- Runs in Blender background mode without errors (`blender --background --python script.py`)
- Creates scene with named mesh objects in correct positions
- Applies PBR materials with proper node-based shader graphs
- Configures lighting (minimum 2 lights for key/fill setup)
- Positions camera with proper framing and active camera assignment
- Sets up world environment (HDRI or background color)
- Configures render settings appropriate to output requirements
- Organizes objects into named collections
- Includes `clear_scene()` for reproducibility

Validation: Script execution produces no errors; scene inspection confirms all elements present; test render produces visible output with proper lighting and materials.

### 1. Set Up Script Structure

Create a Python script with proper imports and structure:

```python
#!/usr/bin/env python3
"""
Scene setup script for Blender.
Usage: blender --background --python setup_scene.py
"""

import bpy
import math
import os
from pathlib import Path

def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # Clear orphaned data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)

    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)

def main():
    clear_scene()
    # Scene setup steps follow

if __name__ == "__main__":
    main()
```

**Validation checkpoint:**
- Save script and run `blender --background --python script.py -- --help` (if using argparse) or simple syntax check
- Confirm no ImportError for bpy
- If bpy import fails: Ensure script runs inside Blender's Python environment, not system Python

**Failure handling:**
- Syntax errors: Run `python -m py_compile script.py` before Blender execution
- Bpy import errors: Use `blender --background --python script.py` only; bpy is not available in standard Python
- Blender not found: Verify Blender installation and PATH, or use full path to blender executable

### 2. Add Mesh Objects

Create primitive or imported mesh objects:

```python
def add_objects():
    """Add mesh objects to scene."""
    # Add cube
    bpy.ops.mesh.primitive_cube_add(
        size=2.0,
        location=(0, 0, 1)
    )
    cube = bpy.context.active_object
    cube.name = "Product_Base"

    # Add sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0,
        segments=32,
        ring_count=16,
        location=(3, 0, 1)
    )
    sphere = bpy.context.active_object
    sphere.name = "Detail_Sphere"

    # Import external model (optional)
    # bpy.ops.import_scene.obj(filepath="model.obj")

    return cube, sphere
```

**Validation checkpoint:**
- After running script, open Blender and verify objects in Outliner
- Check object names match exactly (case-sensitive)
- Verify locations in Properties panel (N key) match requested coordinates
- Check for duplicate names: `bpy.data.objects.get("Product_Base")` should return single object

**Failure handling:**
- Objects not appearing: Check `bpy.context.active_object` is set after each add operation
- Naming conflicts: Query existing objects first with `if "Name" in bpy.data.objects:`, then rename or skip
- Wrong positions: Verify coordinate order is (X, Y, Z); Blender uses right-handed coordinate system
- Import errors: Verify file path exists before import; catch exceptions: `try: bpy.ops.import_scene.obj(...) except: pass`

### 3. Create Materials with Node-Based Shaders

Set up PBR materials using shader nodes:

```python
def create_material(name, base_color, metallic=0.0, roughness=0.5):
    """Create a PBR material with node setup."""
    # Create material
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Add Principled BSDF
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.location = (0, 0)
    node_bsdf.inputs['Base Color'].default_value = base_color + (1.0,)  # Add alpha
    node_bsdf.inputs['Metallic'].default_value = metallic
    node_bsdf.inputs['Roughness'].default_value = roughness

    # Add Material Output
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_output.location = (300, 0)

    # Link nodes
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    return mat

def apply_materials(cube, sphere):
    """Apply materials to objects."""
    # Create materials
    mat_red = create_material("RedPlastic", (0.8, 0.1, 0.1), metallic=0.0, roughness=0.4)
    mat_metal = create_material("Metal", (0.8, 0.8, 0.8), metallic=1.0, roughness=0.2)

    # Assign to objects
    if cube.data.materials:
        cube.data.materials[0] = mat_red
    else:
        cube.data.materials.append(mat_red)

    if sphere.data.materials:
        sphere.data.materials[0] = mat_metal
    else:
        sphere.data.materials.append(mat_metal)
```

**Validation checkpoint:**
- Open Shader Editor and verify node graph exists
- Check Principled BSDF node has correct inputs (Base Color, Metallic, Roughness)
- Verify node links connect BSDF output to Material Output surface input
- Inspect material slots on objects: `obj.data.materials` should contain assigned material

**Failure handling:**
- Nodes not appearing: Ensure `mat.use_nodes = True` before accessing node_tree
- Invalid color format: RGBA must be tuple of 4 floats 0.0-1.0; use `(r, g, b, 1.0)` for opaque
- Node connection errors: Verify output/input names exactly match Blender's API (`BSDF`, `Surface`)
- Material not showing on object: Assign to `obj.data.materials.append(mat)`, not `obj.materials`

### 4. Set Up Lighting

Configure lights for scene illumination:

```python
def setup_lighting():
    """Add lights to scene."""
    # Sun light
    bpy.ops.object.light_add(
        type='SUN',
        location=(5, 5, 10)
    )
    sun = bpy.context.active_object
    sun.name = "KeyLight"
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(45))

    # Area light (fill light)
    bpy.ops.object.light_add(
        type='AREA',
        location=(-4, -4, 6)
    )
    area = bpy.context.active_object
    area.name = "FillLight"
    area.data.energy = 200.0
    area.data.size = 5.0
    area.rotation_euler = (math.radians(60), 0, math.radians(-135))

    # Point light (rim light)
    bpy.ops.object.light_add(
        type='POINT',
        location=(2, -5, 3)
    )
    point = bpy.context.active_object
    point.name = "RimLight"
    point.data.energy = 500.0
```

**Validation checkpoint:**
- Verify lights visible in Outliner with correct names
- Check light types match request (SUN, AREA, POINT, SPOT)
- Inspect energy values: Cycles uses different scale than EEVEE (typically 10-1000 vs 1-10)
- Verify rotation applied: Use `math.radians(degrees)` for degree input

**Failure handling:**
- Lights too dim/bright in Cycles: Multiply energy by 100x compared to EEVEE values
- Wrong rotation: Ensure `math` module imported; rotation_euler expects radians, not degrees
- Light not affecting scene: Check `bpy.data.lights` collection, ensure light data linked to object
- Shadows missing: Enable shadow casting in light data properties

### 5. Position Camera

Set up camera with proper framing:

```python
def setup_camera():
    """Add and configure camera."""
    bpy.ops.object.camera_add(
        location=(7, -7, 5)
    )
    camera = bpy.context.active_object
    camera.name = "MainCamera"

    # Point camera at origin
    direction = (0, 0, 1) - camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    # Camera settings
    camera.data.lens = 50  # Focal length in mm
    camera.data.dof.use_dof = True
    camera.data.dof.focus_distance = 10.0
    camera.data.dof.aperture_fstop = 2.8

    # Set as active camera
    bpy.context.scene.camera = camera
```

**Validation checkpoint:**
- Verify camera appears in Outliner named "MainCamera" or specified name
- Check `bpy.context.scene.camera` is set to camera object (render camera active)
- Inspect camera location/rotation in Properties panel
- Verify lens focal length in Camera Data properties (50mm = 50.0)
- Test viewport: Numpad 0 should switch to camera view with objects in frame

**Failure handling:**
- Camera not looking at target: Alternative rotation method:
  ```python
  import mathutils
  direction = mathutils.Vector((0,0,0)) - camera.location
  camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
  ```
- DOF not working: Verify `camera.data.dof.use_dof = True` and focus_distance > 0
- Wrong field of view: Check sensor size settings; default 36mm is full-frame equivalent
- Camera not rendering: Mandatory assignment `bpy.context.scene.camera = camera_object`

### 6. Configure World Environment

Set up world shader and background:

```python
def setup_world():
    """Configure world environment."""
    world = bpy.data.worlds['World']
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Add Environment Texture (for HDRI)
    node_env = nodes.new(type='ShaderNodeTexEnvironment')
    node_env.location = (-300, 0)

    # Load HDRI if path provided and file exists
    hdri_path = kwargs.get('hdri_path', '')
    if hdri_path and os.path.exists(hdri_path):
        node_env.image = bpy.data.images.load(hdri_path)
        node_bg.inputs['Strength'].default_value = kwargs.get('hdri_strength', 1.0)
    else:
        # Fallback: Use solid color background
        node_bg.inputs['Color'].default_value = kwargs.get('bg_color', (0.05, 0.05, 0.05, 1.0))

    # Add Background shader
    node_bg = nodes.new(type='ShaderNodeBackground')
    node_bg.location = (0, 0)
    node_bg.inputs['Strength'].default_value = 1.0

    # Add World Output
    node_output = nodes.new(type='ShaderNodeOutputWorld')
    node_output.location = (300, 0)

    # Link nodes
    links.new(node_env.outputs['Color'], node_bg.inputs['Color'])
    links.new(node_bg.outputs['Background'], node_output.inputs['Surface'])
```

**Validation checkpoint:**
- Open World Properties panel and verify node editor shows environment setup
- Check HDRI loaded: Image texture node shows image name if HDRI path valid
- Inspect background strength value matches intended lighting level
- Verify world output node connects to background shader
- Test render preview: Background visible in rendered viewport mode

**Failure handling:**
- HDRI not loading: Verify file path is absolute or relative to Blender's working directory; check file format (.exr, .hdr supported)
- Pink/missing background in render: Image failed to load; verify path with `os.path.exists()` before loading
- Too bright/dark environment: Adjust Background node strength (typically 0.1-2.0 range)
- No environment lighting: Ensure node links connect Environment Texture → Background → World Output
- HDRI path issues: Accept HDRI path as parameter with fallback to solid color

### 7. Configure Render Settings

Set basic render parameters:

```python
def setup_render_settings():
    """Configure render settings."""
    scene = bpy.context.scene

    # Render engine
    scene.render.engine = 'CYCLES'  # or 'BLENDER_EEVEE'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True

    # Output settings
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100

    # File format
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '16'
    scene.render.filepath = "/tmp/render_"
```

**Validation checkpoint:**
- Check render engine set correctly: `bpy.context.scene.render.engine` equals 'CYCLES' or 'BLENDER_EEVEE'
- Verify resolution: Scene properties show X/Y values at 100% scale
- Inspect samples: Cycles samples set appropriately (128-512 for preview, 1024+ for final)
- Verify output filepath set and directory exists
- Test: Run quick preview render `bpy.ops.render.render(write_file=True)` should complete

**Failure handling:**
- Engine not found: Valid options are 'CYCLES', 'BLENDER_EEVEE', 'BLENDER_WORKBENCH'
- Resolution errors: Must be positive integers > 0; check percentage is 100 for full resolution
- Permission denied on output: Verify output directory exists and is writable: `os.makedirs(os.path.dirname(path), exist_ok=True)`
- Cycles not available: Some Blender builds exclude Cycles; fallback to 'BLENDER_EEVEE'
- Denoising fails: Requires specific Cycles version; disable with `scene.cycles.use_denoising = False` if errors occur

### 8. Organize Scene Hierarchy

Create collections for organization:

```python
def organize_collections():
    """Organize objects into collections."""
    # Create collections
    col_geometry = bpy.data.collections.new("Geometry")
    col_lights = bpy.data.collections.new("Lights")
    col_cameras = bpy.data.collections.new("Cameras")

    # Link to scene
    bpy.context.scene.collection.children.link(col_geometry)
    bpy.context.scene.collection.children.link(col_lights)
    bpy.context.scene.collection.children.link(col_cameras)

    # Move objects to collections
    for obj in bpy.data.objects:
        # Unlink from main collection
        bpy.context.scene.collection.objects.unlink(obj)

        # Link to appropriate collection
        if obj.type == 'MESH':
            col_geometry.objects.link(obj)
        elif obj.type == 'LIGHT':
            col_lights.objects.link(obj)
        elif obj.type == 'CAMERA':
            col_cameras.objects.link(obj)
```

**Validation checkpoint:**
- Verify collections exist in Outliner: "Geometry", "Lights", "Cameras"
- Check objects moved to correct collections by type
- Ensure no objects remain in Scene Collection root (orphaned check)
- Confirm objects appear in exactly one collection (no duplicates)

**Failure handling:**
- Collection already exists: Check `if "Name" not in bpy.data.collections:` before creating
- Object still in root: Unlink from `bpy.context.scene.collection.objects` after linking to new collection
- Object in multiple collections: Unlink from all collections first, then link to target
- Collection hierarchy wrong: Link to `bpy.context.scene.collection.children` not `.objects`
- Type detection failing: Verify `obj.type` is one of: 'MESH', 'LIGHT', 'CAMERA', 'EMPTY', etc.

## Validation Checklist

Execute these checks after script completion:

- [ ] **Syntax validation**: `python -m py_compile setup_scene.py` returns no errors
- [ ] **Blender execution**: `blender --background --python setup_scene.py` exits with code 0
- [ ] **Object count**: `len(bpy.data.objects)` equals expected mesh + light + camera count
- [ ] **Named objects**: Each expected name exists in `bpy.data.objects` exactly once
- [ ] **Materials assigned**: Each mesh object has at least one material slot populated
- [ ] **Node networks**: Materials have `use_nodes=True` and node_tree.links is non-empty
- [ ] **Active camera**: `bpy.context.scene.camera` is not None and points to existing camera
- [ ] **Camera framing**: Camera view (Numpad 0) shows target objects centered
- [ ] **Light intensity**: At least 2 lights have `energy > 0` and correct type assigned
- [ ] **World nodes**: World shader has nodes connected: Environment/Background → Output
- [ ] **Render configured**: `render.resolution_x/y` matches requirements, engine is valid
- [ ] **Collections created**: Expected collection names exist in `bpy.data.collections`
- [ ] **Organization**: Each object linked to exactly one collection, none in Scene root
- [ ] **Orphan cleanup**: `len([m for m in bpy.data.meshes if m.users == 0])` equals 0
- [ ] **Reproducibility**: Running script twice produces same scene state (idempotent)

## Failure Handling

### Critical Failures (Stop and Report)

| Symptom | Likely Cause | Recovery Action |
|---------|--------------|----------------|
| `ModuleNotFoundError: No module named 'bpy'` | Script run outside Blender | Execute only via `blender --background --python script.py` |
| `AttributeError: 'NoneType' has no attribute 'active_object'` | Operator failed, no active object | Check operator success before accessing `bpy.context.active_object` |
| `RuntimeError: Operator bpy.ops.object.delete.poll() failed` | Context incorrect | Ensure in Object mode, not Edit mode |
| Scene empty after execution | Objects not linked to scene collection | Verify `bpy.context.collection.objects.link(obj)` called |
| Render produces black image | No lights or camera not active | Check `scene.camera` assignment and light energy values |

### Recoverable Issues (Apply Workarounds)

| Symptom | Workaround | Prevention |
|---------|------------|------------|
| HDRI file not found | Use solid color background fallback | Accept path as parameter, validate with `os.path.exists()` |
| Material appears pink | Image texture missing; check file paths | Always verify external assets before loading |
| Cycles engine unavailable | Switch to 'BLENDER_EEVEE' | Detect available engines with `bpy.context.preferences.addons` |
| Object naming collision | Rename existing or skip creation | Query `bpy.data.objects` before creating new |
| Permission denied on render output | Create directory if missing | Use `os.makedirs(os.path.dirname(path), exist_ok=True)` |

### Validation Commands

Quick diagnostic commands to run in Blender Python console or script:

```python
# Check scene state
print(f"Objects: {len(bpy.data.objects)}")
print(f"Cameras: {len([o for o in bpy.data.objects if o.type == 'CAMERA'])}")
print(f"Lights: {len([o for o in bpy.data.objects if o.type == 'LIGHT'])}")
print(f"Meshes: {len([o for o in bpy.data.objects if o.type == 'MESH'])}")
print(f"Active camera: {bpy.context.scene.camera}")

# Check for orphaned data
orphaned_meshes = [m.name for m in bpy.data.meshes if m.users == 0]
orphaned_mats = [m.name for m in bpy.data.materials if m.users == 0]
print(f"Orphaned meshes: {orphaned_meshes}")
print(f"Orphaned materials: {orphaned_mats}")

# Verify collections
for col in bpy.data.collections:
    print(f"Collection '{col.name}': {len(col.objects)} objects")
```

## Common Pitfalls

1. **Object naming conflicts**: Use unique names, check for existing objects before creating
2. **Incorrect color format**: RGB values must be tuples (r, g, b, a) in [0,1] range
3. **Missing alpha channel**: When setting colors, include alpha: `(r, g, b, 1.0)`
4. **Node connection errors**: Verify node types have expected inputs/outputs before linking
5. **Camera not active**: Must set `bpy.context.scene.camera = camera_object`
6. **Relative vs absolute paths**: Use absolute paths or Path() for cross-platform compatibility
7. **Units confusion**: Blender uses meters by default, camera lens in millimeters
8. **Rotation formats**: Use `math.radians()` for degree-to-radian conversion
9. **Render engine differences**: EEVEE and Cycles have different features and parameters
10. **Memory leaks**: Clear orphaned data blocks to prevent memory buildup in batch operations

## Next Steps

After completing scene setup, proceed with:

- **Render execution**: Execute the rendering pipeline using render settings configured here
- **Batch variations**: Use the scene template to generate multiple product shots by varying object positions, materials, or camera angles
- **Animation extension**: Add keyframe animation to camera or objects for turntable presentations
- **Asset library**: Save the configured scene as a reusable template for consistent visualization branding
- **Integration**: Export scene data to external pipelines via JSON/CSV metadata about objects, cameras, and render settings

### Related Skills

- **script-blender-automation**: Advanced scripting patterns for procedural modeling, mesh manipulation, and batch operations beyond scene setup
- **render-blender-output**: Configure rendering pipeline, execute renders, and manage output formats/destinations
- **create-2d-composition**: 2D graphics composition using similar code-driven approaches for non-3D visualization needs

## References

- Blender Python API documentation: https://docs.blender.org/api/current/
- bpy.context operations: https://docs.blender.org/api/current/bpy.context.html
- Node-based materials: https://docs.blender.org/manual/en/latest/render/shader_nodes/
- Cycles render settings: https://docs.blender.org/manual/en/latest/render/cycles/render_settings/
- Coordinate system: Right-handed, Y-forward, Z-up (meters for units, millimeters for camera focal length)
