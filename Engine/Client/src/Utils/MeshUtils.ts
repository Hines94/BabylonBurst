import { Mesh, PBRMaterial, Scene, StandardMaterial, VertexBuffer, VertexData } from "@babylonjs/core";
import { EntVector3 } from "../EntitySystem/CoreComponents";
import { defaultLayerMask } from "./LayerMasks";

export function GenerateOutlineMesh(original: Mesh, outlineWidth = 0.005) {
    const outline = GenerateScaledMesh(original, outlineWidth);
    outline.flipFaces(true);
    outline.isPickable = false;
    return outline;
}

export function GenerateScaledMesh(original: Mesh, scaleAmmt = 0.005) {
    const scaled = original.clone("Scaled_" + original.name);
    scaled.makeGeometryUnique();
    const positions = scaled.getVerticesData(VertexBuffer.PositionKind);
    const normals = scaled.getVerticesData(VertexBuffer.NormalKind);
    for (var i = 0; i < positions.length; i++) {
        positions[i] = positions[i] + normals[i] * scaleAmmt;
    }
    return scaled;
}

export function CreateMeshFromTriangles(triangles: EntVector3[][], scene: Scene, existingMesh: Mesh = undefined): Mesh {
    // Convert the triangles to positions and indices
    const positions: number[] = [];
    const indices: number[] = [];
    for (const triangle of triangles) {
        for (const vertex of triangle) {
            positions.push(vertex.X, vertex.Y, vertex.Z);
        }
    }
    for (let i = 0; i < triangles.length * 3; i++) {
        indices.push(i);
    }

    // Calculate the normals
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);

    // Create and apply vertex data
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;

    // Create the mesh and apply the vertex data
    if (existingMesh === undefined) {
        const mesh = new Mesh("generatedMesh", scene);
        vertexData.applyToMesh(mesh);
        mesh.material = new StandardMaterial("GenerateMat");
        mesh.material.backFaceCulling = false;
        mesh.layerMask = defaultLayerMask;
        return mesh;
    } else {
        vertexData.applyToMesh(existingMesh);
        existingMesh.isVisible = true;
        return existingMesh;
    }
}
