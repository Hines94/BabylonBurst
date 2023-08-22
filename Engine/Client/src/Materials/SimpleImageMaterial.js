import * as BABYLON from "@babylonjs/core";

var nodeMaterial = undefined;
export function GetSimpleImageMaterial(scene) {
    nodeMaterial = new BABYLON.NodeMaterial("node", scene);
    setupNodeMaterial();
    return nodeMaterial.clone();
}
// InputBlock
var position = new BABYLON.InputBlock("position");
position.visibleInInspector = false;
position.visibleOnFrame = false;
position.target = 1;
position.setAsAttribute("position");

// TransformBlock
var WorldPos = new BABYLON.TransformBlock("WorldPos");
WorldPos.visibleInInspector = false;
WorldPos.visibleOnFrame = false;
WorldPos.target = 1;
WorldPos.complementZ = 0;
WorldPos.complementW = 1;

// InstancesBlock
var Instances = new BABYLON.InstancesBlock("Instances");
Instances.visibleInInspector = false;
Instances.visibleOnFrame = false;
Instances.target = 1;

// InputBlock
var world = new BABYLON.InputBlock("world0");
world.visibleInInspector = false;
world.visibleOnFrame = false;
world.target = 1;
world.setAsAttribute("world0");

// InputBlock
var world1 = new BABYLON.InputBlock("world1");
world1.visibleInInspector = false;
world1.visibleOnFrame = false;
world1.target = 1;
world1.setAsAttribute("world1");

// InputBlock
var world2 = new BABYLON.InputBlock("world2");
world2.visibleInInspector = false;
world2.visibleOnFrame = false;
world2.target = 1;
world2.setAsAttribute("world2");

// InputBlock
var world3 = new BABYLON.InputBlock("world3");
world3.visibleInInspector = false;
world3.visibleOnFrame = false;
world3.target = 1;
world3.setAsAttribute("world3");

// InputBlock
var world4 = new BABYLON.InputBlock("world");
world4.visibleInInspector = false;
world4.visibleOnFrame = false;
world4.target = 1;
world4.setAsSystemValue(BABYLON.NodeMaterialSystemValues.World);

// TransformBlock
var WorldPosViewProjectionTransform = new BABYLON.TransformBlock("WorldPos * ViewProjectionTransform");
WorldPosViewProjectionTransform.visibleInInspector = false;
WorldPosViewProjectionTransform.visibleOnFrame = false;
WorldPosViewProjectionTransform.target = 1;
WorldPosViewProjectionTransform.complementZ = 0;
WorldPosViewProjectionTransform.complementW = 1;

// InputBlock
var ViewProjection = new BABYLON.InputBlock("ViewProjection");
ViewProjection.visibleInInspector = false;
ViewProjection.visibleOnFrame = false;
ViewProjection.target = 1;
ViewProjection.setAsSystemValue(BABYLON.NodeMaterialSystemValues.ViewProjection);

// VertexOutputBlock
var VertexOutput = new BABYLON.VertexOutputBlock("VertexOutput");
VertexOutput.visibleInInspector = false;
VertexOutput.visibleOnFrame = false;
VertexOutput.target = 1;

// InputBlock
var ColorMultiplier = new BABYLON.InputBlock("ColorMultiplier");
ColorMultiplier.visibleInInspector = false;
ColorMultiplier.visibleOnFrame = false;
ColorMultiplier.target = 1;
ColorMultiplier.value = new BABYLON.Color4(0.8, 0.8, 0.8, 1);
ColorMultiplier.isConstant = false;

// AddBlock
var Add = new BABYLON.AddBlock("Add");
Add.visibleInInspector = false;
Add.visibleOnFrame = false;
Add.target = 4;

// InputBlock
var instanceColor = new BABYLON.InputBlock("instanceColor");
instanceColor.visibleInInspector = false;
instanceColor.visibleOnFrame = false;
instanceColor.target = 1;
instanceColor.setAsAttribute("instanceColor");

// LerpBlock
var Lerp = new BABYLON.LerpBlock("Lerp");
Lerp.visibleInInspector = false;
Lerp.visibleOnFrame = false;
Lerp.target = 4;

// InputBlock
var UseInstanceColor = new BABYLON.InputBlock("UseInstanceColor");
UseInstanceColor.visibleInInspector = false;
UseInstanceColor.visibleOnFrame = false;
UseInstanceColor.target = 1;
UseInstanceColor.value = 0;
UseInstanceColor.min = 0;
UseInstanceColor.max = 0;
UseInstanceColor.isBoolean = true;
UseInstanceColor.matrixMode = 0;
UseInstanceColor.animationType = BABYLON.AnimatedInputBlockTypes.None;
UseInstanceColor.isConstant = false;

// MultiplyBlock
var Multiply = new BABYLON.MultiplyBlock("Multiply");
Multiply.visibleInInspector = false;
Multiply.visibleOnFrame = false;
Multiply.target = 4;

// TextureBlock
var ImageTexture = new BABYLON.TextureBlock("ImageTexture");
ImageTexture.visibleInInspector = false;
ImageTexture.visibleOnFrame = false;
ImageTexture.target = 3;
ImageTexture.convertToGammaSpace = false;
ImageTexture.convertToLinearSpace = false;
ImageTexture.disableLevelMultiplication = false;

// InputBlock
var uv = new BABYLON.InputBlock("uv");
uv.visibleInInspector = false;
uv.visibleOnFrame = false;
uv.target = 1;
uv.setAsAttribute("uv");

// LerpBlock
var Lerp1 = new BABYLON.LerpBlock("Lerp");
Lerp1.visibleInInspector = false;
Lerp1.visibleOnFrame = false;
Lerp1.target = 4;

// InputBlock
var UseTexture = new BABYLON.InputBlock("UseTexture");
UseTexture.visibleInInspector = true;
UseTexture.visibleOnFrame = false;
UseTexture.target = 1;
UseTexture.value = 0;
UseTexture.min = 0;
UseTexture.max = 0;
UseTexture.isBoolean = true;
UseTexture.matrixMode = 0;
UseTexture.animationType = BABYLON.AnimatedInputBlockTypes.None;
UseTexture.isConstant = false;

// FragmentOutputBlock
var FragmentOutput = new BABYLON.FragmentOutputBlock("FragmentOutput");
FragmentOutput.visibleInInspector = false;
FragmentOutput.visibleOnFrame = false;
FragmentOutput.target = 2;
FragmentOutput.convertToGammaSpace = false;
FragmentOutput.convertToLinearSpace = false;
FragmentOutput.useLogarithmicDepth = false;

// Connections
position.output.connectTo(WorldPos.vector);
world.output.connectTo(Instances.world0);
world1.output.connectTo(Instances.world1);
world2.output.connectTo(Instances.world2);
world3.output.connectTo(Instances.world3);
world4.output.connectTo(Instances.world);
Instances.output.connectTo(WorldPos.transform);
WorldPos.output.connectTo(WorldPosViewProjectionTransform.vector);
ViewProjection.output.connectTo(WorldPosViewProjectionTransform.transform);
WorldPosViewProjectionTransform.output.connectTo(VertexOutput.vector);
ColorMultiplier.output.connectTo(Lerp.left);
ColorMultiplier.output.connectTo(Add.left);
instanceColor.output.connectTo(Add.right);
Add.output.connectTo(Lerp.right);
UseInstanceColor.output.connectTo(Lerp.gradient);
Lerp.output.connectTo(Lerp1.left);
uv.output.connectTo(ImageTexture.uv);
ImageTexture.rgba.connectTo(Multiply.left);
Lerp.output.connectTo(Multiply.right);
Multiply.output.connectTo(Lerp1.right);
UseTexture.output.connectTo(Lerp1.gradient);
Lerp1.output.connectTo(FragmentOutput.rgba);

function setupNodeMaterial() {
    // Output nodes
    nodeMaterial.addOutputNode(VertexOutput);
    nodeMaterial.addOutputNode(FragmentOutput);
    nodeMaterial.build();
}
